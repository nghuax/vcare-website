import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireStaffOrAdminUser } from "@/lib/session";

const payloadSchema = z.object({
  prescriptionId: z.string().cuid(),
  medicineName: z.string().trim().min(2).max(120),
  dosageInstruction: z.string().trim().max(300).optional(),
  timingLabel: z.string().trim().min(2).max(120),
  timesPerDay: z.number().int().min(1).max(6),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  cycleDays: z.number().int().min(1).max(180).default(30),
});

export async function POST(request: Request) {
  const sessionUser = await requireStaffOrAdminUser();

  try {
    const parsed = payloadSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid medicine plan payload." },
        { status: 400 },
      );
    }

    const payload = parsed.data;

    if (payload.endDate && payload.startDate) {
      if (new Date(payload.endDate) <= new Date(payload.startDate)) {
        return NextResponse.json(
          { message: "End date must be after start date." },
          { status: 400 },
        );
      }
    }

    const prescription = await prisma.prescription.findUnique({
      where: { id: payload.prescriptionId },
      select: {
        id: true,
        patientUserId: true,
      },
    });

    if (!prescription) {
      return NextResponse.json({ message: "Prescription not found." }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const existingMedicine = await tx.medicine.findFirst({
        where: {
          name: {
            equals: payload.medicineName,
            mode: "insensitive",
          },
        },
        select: { id: true },
      });

      const medicine =
        existingMedicine ??
        (await tx.medicine.create({
          data: {
            name: payload.medicineName,
            code: `VC-MED-${Date.now()}`,
            dosageForm: "Tablet",
            status: "ACTIVE",
          },
          select: { id: true },
        }));

      const schedule = await tx.dosageSchedule.upsert({
        where: {
          prescriptionId_medicineId: {
            prescriptionId: payload.prescriptionId,
            medicineId: medicine.id,
          },
        },
        update: {
          dosageInstruction: payload.dosageInstruction || null,
          timingLabel: payload.timingLabel,
          timesPerDay: payload.timesPerDay,
          startDate: payload.startDate ? new Date(payload.startDate) : null,
          endDate: payload.endDate ? new Date(payload.endDate) : null,
          status: "ACTIVE",
        },
        create: {
          prescriptionId: payload.prescriptionId,
          medicineId: medicine.id,
          dosageInstruction: payload.dosageInstruction || null,
          timingLabel: payload.timingLabel,
          timesPerDay: payload.timesPerDay,
          startDate: payload.startDate ? new Date(payload.startDate) : null,
          endDate: payload.endDate ? new Date(payload.endDate) : null,
          status: "ACTIVE",
        },
      });

      const nextRefillAt = payload.endDate
        ? new Date(payload.endDate)
        : new Date(Date.now() + payload.cycleDays * 24 * 60 * 60 * 1000);

      await tx.refillCycle.upsert({
        where: {
          prescriptionId_medicineId: {
            prescriptionId: payload.prescriptionId,
            medicineId: medicine.id,
          },
        },
        update: {
          reviewedByStaffId: sessionUser.id,
          reviewedAt: new Date(),
          cycleDays: payload.cycleDays,
          status: "TRACKING",
          nextRefillAt,
        },
        create: {
          prescriptionId: payload.prescriptionId,
          medicineId: medicine.id,
          reviewedByStaffId: sessionUser.id,
          reviewedAt: new Date(),
          cycleDays: payload.cycleDays,
          status: "TRACKING",
          nextRefillAt,
        },
      });

      await tx.prescription.update({
        where: { id: payload.prescriptionId },
        data: {
          reviewedByStaffId: sessionUser.id,
          reviewedAt: new Date(),
          status: "REVIEW_IN_PROGRESS",
        },
      });

      await tx.notification.create({
        data: {
          userId: prescription.patientUserId,
          title: "Medicine schedule updated",
          body: "A staff-created or uploaded-prescription-based schedule was updated.",
          channel: "IN_APP",
          status: "SENT",
          sentAt: new Date(),
          relatedEntityType: "DosageSchedule",
          relatedEntityId: schedule.id,
        },
      });

      return schedule.id;
    });

    return NextResponse.json(
      {
        message: "Medicine plan saved.",
        data: {
          scheduleId: result,
        },
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { message: "Unable to save medicine plan." },
      { status: 500 },
    );
  }
}
