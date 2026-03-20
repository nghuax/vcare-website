import { NextResponse } from "next/server";
import { z } from "zod";

import { requirePatientUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const payloadSchema = z.object({
  scheduleId: z.string().cuid(),
  prescriptionId: z.string().cuid(),
});

export async function POST(request: Request) {
  const sessionUser = await requirePatientUser();

  try {
    const json = (await request.json()) as unknown;
    const parsed = payloadSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid medicine intake payload." },
        { status: 400 },
      );
    }

    const schedule = await prisma.dosageSchedule.findFirst({
      where: {
        id: parsed.data.scheduleId,
        prescriptionId: parsed.data.prescriptionId,
        prescription: {
          patientUserId: sessionUser.id,
        },
      },
      select: {
        id: true,
        prescriptionId: true,
      },
    });

    if (!schedule) {
      return NextResponse.json(
        { message: "Medicine schedule not found." },
        { status: 404 },
      );
    }

    await prisma.$transaction([
      prisma.medicationIntakeLog.create({
        data: {
          patientUserId: sessionUser.id,
          prescriptionId: schedule.prescriptionId,
          dosageScheduleId: schedule.id,
          intakeAt: new Date(),
        },
      }),
      prisma.notification.create({
        data: {
          userId: sessionUser.id,
          title: "Medicine marked as taken",
          body: "Your medicine schedule has been updated for today.",
          channel: "IN_APP",
          status: "SENT",
          sentAt: new Date(),
          relatedEntityType: "DosageSchedule",
          relatedEntityId: schedule.id,
        },
      }),
    ]);

    return NextResponse.json({ message: "Medicine marked as taken." });
  } catch {
    return NextResponse.json(
      { message: "Unable to mark medicine as taken." },
      { status: 500 },
    );
  }
}
