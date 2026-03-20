import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { seededAvatarUrl } from "@/lib/random-data";
import { requireStaffOrAdminUser } from "@/lib/session";

const payloadSchema = z.object({
  doctorId: z.string().cuid().optional(),
  fullName: z.string().trim().min(2).max(120),
  specialty: z.string().trim().max(120).optional(),
  hospitalId: z.string().cuid().optional(),
  clinicId: z.string().cuid().optional(),
  licenseNumber: z.string().trim().max(120).optional(),
  doctorInformation: z.string().trim().max(600).optional(),
  consultationFeeNote: z.string().trim().max(200).optional(),
  yearsOfExperience: z.number().int().min(0).max(70).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  slotStartsAt: z.array(z.string().datetime()).max(12).optional(),
});

export async function POST(request: Request) {
  await requireStaffOrAdminUser();

  try {
    const parsed = payloadSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid doctor payload." }, { status: 400 });
    }

    const payload = parsed.data;

    if (payload.hospitalId) {
      const hospital = await prisma.hospital.findUnique({
        where: { id: payload.hospitalId },
        select: { id: true },
      });

      if (!hospital) {
        return NextResponse.json({ message: "Hospital not found." }, { status: 404 });
      }
    }

    if (payload.clinicId) {
      const clinic = await prisma.clinic.findUnique({
        where: { id: payload.clinicId },
        select: { id: true },
      });

      if (!clinic) {
        return NextResponse.json({ message: "Clinic not found." }, { status: 404 });
      }
    }

    const doctor = await prisma.$transaction(async (tx) => {
      const upsertedDoctor = payload.doctorId
        ? await tx.doctor.update({
            where: { id: payload.doctorId },
            data: {
              fullName: payload.fullName,
              specialty: payload.specialty || null,
              hospitalId: payload.hospitalId || null,
              clinicId: payload.clinicId || null,
              licenseNumber: payload.licenseNumber || undefined,
              doctorInformation: payload.doctorInformation || null,
              consultationFeeNote: payload.consultationFeeNote || null,
              yearsOfExperience: payload.yearsOfExperience ?? null,
              status: payload.status,
            },
          })
        : await tx.doctor.create({
            data: {
              fullName: payload.fullName,
              specialty: payload.specialty || null,
              hospitalId: payload.hospitalId || null,
              clinicId: payload.clinicId || null,
              licenseNumber: payload.licenseNumber || `VC-DR-${Date.now()}`,
              doctorInformation: payload.doctorInformation || null,
              consultationFeeNote: payload.consultationFeeNote || null,
              profileImageUrl: seededAvatarUrl(
                `${payload.fullName}-${payload.licenseNumber ?? Date.now().toString()}`,
              ),
              yearsOfExperience: payload.yearsOfExperience ?? null,
              status: payload.status,
            },
          });

      if (payload.slotStartsAt?.length) {
        for (const startsAtIso of payload.slotStartsAt) {
          const startsAt = new Date(startsAtIso);
          const endsAt = new Date(startsAt.getTime() + 45 * 60 * 1000);

          await tx.doctorAvailabilitySlot.upsert({
            where: {
              doctorId_startsAt: {
                doctorId: upsertedDoctor.id,
                startsAt,
              },
            },
            update: {
              clinicId: payload.clinicId || upsertedDoctor.clinicId,
              endsAt,
              status: "OPEN",
            },
            create: {
              doctorId: upsertedDoctor.id,
              clinicId: payload.clinicId || upsertedDoctor.clinicId,
              startsAt,
              endsAt,
              status: "OPEN",
            },
          });
        }
      }

      return upsertedDoctor;
    });

    return NextResponse.json(
      {
        message: "Doctor information saved.",
        data: {
          doctorId: doctor.id,
        },
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { message: "Unable to save doctor information." },
      { status: 500 },
    );
  }
}
