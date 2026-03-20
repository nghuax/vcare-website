import { NextResponse } from "next/server";
import { z } from "zod";

import { requirePatientUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const PLACEHOLDER_MEDICINE_CODE = "VC-UPLOADED-PLACEHOLDER";

const uploadSchema = z.object({
  notes: z.string().max(500).optional(),
  familyMemberId: z.string().cuid().optional(),
});

export async function POST(request: Request) {
  const sessionUser = await requirePatientUser();

  try {
    const formData = await request.formData();

    const rawNotes = formData.get("notes");
    const rawFamilyMemberId = formData.get("familyMemberId");
    const rawFile = formData.get("prescriptionImage");

    if (!(rawFile instanceof File)) {
      return NextResponse.json(
        { message: "Prescription image is required." },
        { status: 400 },
      );
    }

    if (!rawFile.type.startsWith("image/")) {
      return NextResponse.json(
        { message: "Only image files are supported." },
        { status: 400 },
      );
    }

    if (rawFile.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { message: "Image size must be 5MB or smaller." },
        { status: 400 },
      );
    }

    const parsed = uploadSchema.safeParse({
      notes: typeof rawNotes === "string" ? rawNotes.trim() : undefined,
      familyMemberId:
        typeof rawFamilyMemberId === "string" && rawFamilyMemberId
          ? rawFamilyMemberId
          : undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid upload payload." },
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
          { message: "Family profile does not exist for this account." },
          { status: 404 },
        );
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const uploadedAt = new Date();

      const medicine = await tx.medicine.upsert({
        where: { code: PLACEHOLDER_MEDICINE_CODE },
        update: {
          name: "Uploaded Prescription Medicine",
          dosageForm: "Unknown",
          status: "ACTIVE",
        },
        create: {
          code: PLACEHOLDER_MEDICINE_CODE,
          name: "Uploaded Prescription Medicine",
          dosageForm: "Unknown",
          status: "ACTIVE",
        },
      });

      const prescription = await tx.prescription.create({
        data: {
          patientUserId: sessionUser.id,
          uploadedByUserId: sessionUser.id,
          status: "UPLOADED",
          insuranceVerificationStatus: "NOT_SUBMITTED",
          notes:
            parsed.data.notes ||
            "Uploaded prescription-based schedule pending staff review.",
          prescriptionReference: `VC-RX-${Date.now()}`,
          uploadedPrescriptionAt: uploadedAt,
        },
      });

      const safeFileName = rawFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");

      await tx.prescriptionImage.create({
        data: {
          prescriptionId: prescription.id,
          uploadedByUserId: sessionUser.id,
          imageLabel: safeFileName,
          imageUrl: `uploaded://prescription/${prescription.id}/${safeFileName}`,
        },
      });

      await tx.dosageSchedule.create({
        data: {
          prescriptionId: prescription.id,
          medicineId: medicine.id,
          timingLabel: "08:00 and 20:00",
          dosageInstruction: "Schedule created from uploaded prescription.",
          timesPerDay: 2,
          startDate: uploadedAt,
          endDate: new Date(uploadedAt.getTime() + 30 * 24 * 60 * 60 * 1000),
          status: "ACTIVE",
        },
      });

      await tx.refillCycle.create({
        data: {
          prescriptionId: prescription.id,
          medicineId: medicine.id,
          cycleDays: 30,
          nextRefillAt: new Date(uploadedAt.getTime() + 27 * 24 * 60 * 60 * 1000),
          status: "TRACKING",
        },
      });

      await tx.notification.create({
        data: {
          userId: sessionUser.id,
          title: "Prescription uploaded",
          body: "Your uploaded prescription is now available in your account.",
          channel: "IN_APP",
          status: "SENT",
          sentAt: new Date(),
          relatedEntityType: "Prescription",
          relatedEntityId: prescription.id,
        },
      });

      return prescription.id;
    });

    return NextResponse.json(
      {
        message: "Prescription uploaded successfully.",
        data: {
          prescriptionId: result,
        },
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { message: "Unable to upload prescription right now." },
      { status: 500 },
    );
  }
}
