import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireStaffOrAdminUser } from "@/lib/session";

const payloadSchema = z.object({
  status: z.enum([
    "DRAFT",
    "SUBMITTED",
    "REVIEWED_BY_STAFF",
    "READY_FOR_PICKUP",
    "DELIVERED",
    "CANCELED",
  ]),
  requestNote: z.string().trim().max(300).optional(),
});

type RouteProps = {
  params: Promise<{
    orderId: string;
  }>;
};

export async function PATCH(request: Request, { params }: RouteProps) {
  const sessionUser = await requireStaffOrAdminUser();

  const { orderId } = await params;

  try {
    const parsed = payloadSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid order update payload." },
        { status: 400 },
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        patientUserId: true,
      },
    });

    if (!order) {
      return NextResponse.json({ message: "Order not found." }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: parsed.data.status,
          reviewedByStaffId: sessionUser.id,
          reviewedAt: new Date(),
          fulfilledAt: parsed.data.status === "DELIVERED" ? new Date() : null,
          requestNote: parsed.data.requestNote || undefined,
        },
      });

      await tx.notification.create({
        data: {
          userId: order.patientUserId,
          title: "Order status updated",
          body: `Your reorder request status is now ${parsed.data.status.toLowerCase().replaceAll("_", " ")}.`,
          channel: "IN_APP",
          status: "SENT",
          sentAt: new Date(),
          relatedEntityType: "Order",
          relatedEntityId: orderId,
        },
      });
    });

    return NextResponse.json({ message: "Order updated." });
  } catch {
    return NextResponse.json(
      { message: "Unable to update order." },
      { status: 500 },
    );
  }
}
