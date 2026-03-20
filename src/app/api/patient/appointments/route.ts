import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requirePatientUser } from "@/lib/session";

const payloadSchema = z.object({
  facilityType: z.enum(["HOSPITAL", "CLINIC"]),
  facilityId: z.string().cuid(),
  doctorId: z.string().cuid().optional(),
  slotId: z.string().cuid(),
  familyMemberId: z.string().cuid().optional(),
  appointmentRequestNote: z.string().trim().max(500).optional(),
});

export async function POST(request: Request) {
  const sessionUser = await requirePatientUser();

  try {
    const parsed = payloadSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid appointment request payload." },
        { status: 400 },
      );
    }

    if (parsed.data.familyMemberId) {
      const familyMember = await prisma.familyMember.findFirst({
        where: {
          id: parsed.data.familyMemberId,
          patientUserId: sessionUser.id,
        },
        select: { id: true },
      });

      if (!familyMember) {
        return NextResponse.json(
          { message: "Family profile not found for this account." },
          { status: 404 },
        );
      }
    }

    const slot = await prisma.doctorAvailabilitySlot.findUnique({
      where: { id: parsed.data.slotId },
      include: {
        doctor: {
          include: {
            reviewSummary: {
              select: {
                averageRating: true,
                reviewCount: true,
              },
            },
            hospital: {
              select: {
                id: true,
                name: true,
              },
            },
            clinic: {
              select: {
                id: true,
                name: true,
                hospitalId: true,
                hospital: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!slot || slot.status !== "OPEN") {
      return NextResponse.json(
        { message: "Selected time slot is not available." },
        { status: 409 },
      );
    }

    const slotClinicId = slot.doctor.clinic?.id ?? null;
    const slotHospitalId = slot.doctor.hospital?.id ?? slot.doctor.clinic?.hospitalId ?? null;

    if (
      parsed.data.facilityType === "HOSPITAL" &&
      slotHospitalId !== parsed.data.facilityId
    ) {
      return NextResponse.json(
        { message: "Selected slot does not match the chosen hospital." },
        { status: 400 },
      );
    }

    if (parsed.data.facilityType === "CLINIC" && slotClinicId !== parsed.data.facilityId) {
      return NextResponse.json(
        { message: "Selected slot does not match the chosen clinic." },
        { status: 400 },
      );
    }

    if (parsed.data.doctorId && parsed.data.doctorId !== slot.doctorId) {
      return NextResponse.json(
        { message: "Selected slot does not match the selected doctor." },
        { status: 400 },
      );
    }

    const latestInsuranceRecord = await prisma.insuranceRecord.findFirst({
      where: {
        patientUserId: sessionUser.id,
      },
      select: {
        id: true,
        insuranceVerificationStatus: true,
      },
      orderBy: { submittedAt: "desc" },
    });

    const appointmentRequest = await prisma.$transaction(async (tx) => {
      const slotUpdate = await tx.doctorAvailabilitySlot.updateMany({
        where: {
          id: slot.id,
          status: "OPEN",
        },
        data: {
          status: "HELD",
        },
      });

      if (!slotUpdate.count) {
        throw new Error("SLOT_NOT_OPEN");
      }

      const createdRequest = await tx.appointmentRequest.create({
        data: {
          patientUserId: sessionUser.id,
          familyMemberId: parsed.data.familyMemberId ?? null,
          doctorId: slot.doctorId,
          hospitalId: slotHospitalId,
          clinicId: slotClinicId,
          selectedSlotId: slot.id,
          requestedForAt: slot.startsAt,
          status: "REQUESTED",
          appointmentRequestNote: parsed.data.appointmentRequestNote || null,
          doctorInformationSnapshot: {
            selectedFacilityType: parsed.data.facilityType,
            selectedFacilityId: parsed.data.facilityId,
            selectedDoctorManually: Boolean(parsed.data.doctorId),
            doctorInformation: {
              doctorName: slot.doctor.fullName,
              specialty: slot.doctor.specialty,
              doctorInformation: slot.doctor.doctorInformation,
              yearsOfExperience: slot.doctor.yearsOfExperience,
              hospitalName: slot.doctor.hospital?.name ?? slot.doctor.clinic?.hospital?.name,
              clinicName: slot.doctor.clinic?.name,
              ratingScore: slot.doctor.reviewSummary?.averageRating ?? null,
              reviewCount: slot.doctor.reviewSummary?.reviewCount ?? 0,
            },
            insuranceVerificationStatus:
              latestInsuranceRecord?.insuranceVerificationStatus ?? "NOT_SUBMITTED",
            insuranceRecordId: latestInsuranceRecord?.id ?? null,
          },
        },
      });

      await tx.notification.create({
        data: {
          userId: sessionUser.id,
          title: "Appointment request submitted",
          body: `Appointment request submitted with ${slot.doctor.fullName} at ${slot.startsAt.toISOString()}.`,
          channel: "IN_APP",
          status: "SENT",
          sentAt: new Date(),
          relatedEntityType: "AppointmentRequest",
          relatedEntityId: createdRequest.id,
        },
      });

      return createdRequest;
    });

    return NextResponse.json(
      {
        message: "Appointment request submitted.",
        data: {
          appointmentRequestId: appointmentRequest.id,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "SLOT_NOT_OPEN") {
      return NextResponse.json(
        { message: "Selected time slot is no longer available." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { message: "Unable to submit appointment request." },
      { status: 500 },
    );
  }
}
