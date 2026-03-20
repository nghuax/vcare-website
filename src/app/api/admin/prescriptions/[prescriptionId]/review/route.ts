import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireStaffOrAdminUser } from "@/lib/session";

const payloadSchema = z.object({
  action: z.enum(["APPROVE", "REJECT", "IN_REVIEW"]),
  reviewNote: z.string().trim().max(1000).optional(),
  medicineName: z.string().trim().max(120).optional(),
  dosageInstruction: z.string().trim().max(300).optional(),
  timingLabel: z.string().trim().max(120).optional(),
  timesPerDay: z.number().int().min(1).max(6).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  cycleDays: z.number().int().min(1).max(180).optional(),
});

type RouteProps = {
  params: Promise<{
    prescriptionId: string;
  }>;
};

function mapActionToStatus(action: "APPROVE" | "REJECT" | "IN_REVIEW") {
  if (action === "APPROVE") {
    return "ACTIVE" as const;
  }

  if (action === "REJECT") {
    return "REJECTED" as const;
  }

  return "REVIEW_IN_PROGRESS" as const;
}

export async function POST(request: Request, { params }: RouteProps) {
  const sessionUser = await requireStaffOrAdminUser();

  const { prescriptionId } = await params;

  if (!prescriptionId) {
    return NextResponse.json({ message: "Prescription is required." }, { status: 400 });
  }

  try {
    const parsed = payloadSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid prescription review payload." },
        { status: 400 },
      );
    }

    const payload = parsed.data;

    if (payload.endDate && payload.startDate) {
      const startAt = new Date(payload.startDate);
      const endAt = new Date(payload.endDate);

      if (endAt <= startAt) {
        return NextResponse.json(
          { message: "End date must be after start date." },
          { status: 400 },
        );
      }
    }

    const prescription = await prisma.prescription.findUnique({
      where: { id: prescriptionId },
      select: {
        id: true,
        patientUserId: true,
        notes: true,
      },
    });

    if (!prescription) {
      return NextResponse.json({ message: "Prescription not found." }, { status: 404 });
    }

    const status = mapActionToStatus(payload.action);

    await prisma.$transaction(async (tx) => {
      await tx.prescription.update({
        where: { id: prescriptionId },
        data: {
          status,
          reviewedByStaffId: sessionUser.id,
          reviewedAt: new Date(),
          notes: payload.reviewNote || prescription.notes,
        },
      });

      if (payload.medicineName && payload.action !== "REJECT") {
        const existingMedicine = await tx.medicine.findFirst({
          where: {
            name: {
              equals: payload.medicineName,
              mode: "insensitive",
            },
          },
          select: {
            id: true,
            code: true,
          },
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
            select: {
              id: true,
              code: true,
            },
          }));

        await tx.dosageSchedule.upsert({
          where: {
            prescriptionId_medicineId: {
              prescriptionId,
              medicineId: medicine.id,
            },
          },
          update: {
            dosageInstruction: payload.dosageInstruction || null,
            timingLabel: payload.timingLabel || null,
            timesPerDay: payload.timesPerDay ?? null,
            startDate: payload.startDate ? new Date(payload.startDate) : null,
            endDate: payload.endDate ? new Date(payload.endDate) : null,
            status: "ACTIVE",
          },
          create: {
            prescriptionId,
            medicineId: medicine.id,
            dosageInstruction: payload.dosageInstruction || null,
            timingLabel: payload.timingLabel || null,
            timesPerDay: payload.timesPerDay ?? 1,
            startDate: payload.startDate ? new Date(payload.startDate) : null,
            endDate: payload.endDate ? new Date(payload.endDate) : null,
            status: "ACTIVE",
          },
        });

        const cycleDays = payload.cycleDays ?? 30;
        const nextRefillAt = payload.endDate
          ? new Date(payload.endDate)
          : new Date(Date.now() + cycleDays * 24 * 60 * 60 * 1000);

        await tx.refillCycle.upsert({
          where: {
            prescriptionId_medicineId: {
              prescriptionId,
              medicineId: medicine.id,
            },
          },
          update: {
            reviewedByStaffId: sessionUser.id,
            reviewedAt: new Date(),
            cycleDays,
            status: "TRACKING",
            nextRefillAt,
          },
          create: {
            prescriptionId,
            medicineId: medicine.id,
            reviewedByStaffId: sessionUser.id,
            reviewedAt: new Date(),
            cycleDays,
            status: "TRACKING",
            nextRefillAt,
          },
        });
      }

      await tx.notification.create({
        data: {
          userId: prescription.patientUserId,
          title: "Prescription reviewed by staff",
          body:
            status === "REJECTED"
              ? "Your uploaded prescription was reviewed and marked rejected."
              : "Your uploaded prescription was reviewed by staff.",
          channel: "IN_APP",
          status: "SENT",
          sentAt: new Date(),
          relatedEntityType: "Prescription",
          relatedEntityId: prescriptionId,
        },
      });
    });

    return NextResponse.json({ message: "Prescription review saved." });
  } catch {
    return NextResponse.json(
      { message: "Unable to save prescription review." },
      { status: 500 },
    );
  }
}
