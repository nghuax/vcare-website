import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireStaffOrAdminUser } from "@/lib/session";

function diffDays(from: Date, to: Date): number {
  const diffMs = to.getTime() - from.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export async function POST() {
  const sessionUser = await requireStaffOrAdminUser();

  try {
    const cycles = await prisma.refillCycle.findMany({
      where: {
        nextRefillAt: {
          not: null,
        },
      },
      include: {
        prescription: {
          select: {
            patientUserId: true,
            prescriptionReference: true,
          },
        },
      },
    });

    let updatedCount = 0;

    await prisma.$transaction(async (tx) => {
      for (const cycle of cycles) {
        if (!cycle.nextRefillAt) {
          continue;
        }

        const remainingDays = diffDays(new Date(), cycle.nextRefillAt);

        const nextStatus = remainingDays <= 5 ? "DUE" : "TRACKING";

        if (nextStatus !== cycle.status) {
          await tx.refillCycle.update({
            where: { id: cycle.id },
            data: {
              status: nextStatus,
              reviewedByStaffId: sessionUser.id,
              reviewedAt: new Date(),
            },
          });

          updatedCount += 1;

          if (nextStatus === "DUE") {
            await tx.notification.create({
              data: {
                userId: cycle.prescription.patientUserId,
                title: "Refill reminder state updated",
                body: `Refill reminder state is due soon for prescription ${cycle.prescription.prescriptionReference ?? cycle.prescription.patientUserId.slice(0, 8)}.`,
                channel: "IN_APP",
                status: "SENT",
                sentAt: new Date(),
                relatedEntityType: "RefillCycle",
                relatedEntityId: cycle.id,
              },
            });
          }
        }
      }
    });

    return NextResponse.json({
      message: "Reminder states recomputed.",
      data: { updatedCount },
    });
  } catch {
    return NextResponse.json(
      { message: "Unable to recompute reminder states." },
      { status: 500 },
    );
  }
}
