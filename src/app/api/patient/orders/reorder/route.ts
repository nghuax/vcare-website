import { NextResponse } from "next/server";
import { z } from "zod";

import { requirePatientUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const payloadSchema = z.object({
  prescriptionId: z.string().cuid(),
  medicineId: z.string().cuid(),
  quantity: z.number().int().min(1).max(30),
  fulfillmentMethod: z.enum(["PICKUP", "DELIVERY"]),
  deliveryAddress: z.string().min(5).max(300).optional(),
  requestNote: z.string().max(300).optional(),
});

export async function POST(request: Request) {
  const sessionUser = await requirePatientUser();

  try {
    const parsed = payloadSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid reorder request payload." },
        { status: 400 },
      );
    }

    if (
      parsed.data.fulfillmentMethod === "DELIVERY" &&
      !parsed.data.deliveryAddress?.trim()
    ) {
      return NextResponse.json(
        { message: "Delivery address is required for delivery requests." },
        { status: 400 },
      );
    }

    const prescription = await prisma.prescription.findFirst({
      where: {
        id: parsed.data.prescriptionId,
        patientUserId: sessionUser.id,
      },
      select: {
        id: true,
      },
    });

    if (!prescription) {
      return NextResponse.json(
        { message: "Prescription not found." },
        { status: 404 },
      );
    }

    const medicine = await prisma.medicine.findUnique({
      where: {
        id: parsed.data.medicineId,
      },
      select: {
        id: true,
      },
    });

    if (!medicine) {
      return NextResponse.json(
        { message: "Medicine not found." },
        { status: 404 },
      );
    }

    const orderNumber = `VC-ORD-${Date.now()}`;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        patientUserId: sessionUser.id,
        prescriptionId: parsed.data.prescriptionId,
        medicineId: parsed.data.medicineId,
        quantity: parsed.data.quantity,
        fulfillmentMethod: parsed.data.fulfillmentMethod,
        deliveryAddress: parsed.data.deliveryAddress?.trim() || null,
        requestNote: parsed.data.requestNote?.trim() || null,
        status: "SUBMITTED",
        submittedAt: new Date(),
      },
      select: {
        id: true,
        orderNumber: true,
      },
    });

    await prisma.notification.create({
      data: {
        userId: sessionUser.id,
        title: "Reorder request submitted",
        body: `Order ${order.orderNumber ?? order.id} has been submitted for processing.`,
        channel: "IN_APP",
        status: "SENT",
        sentAt: new Date(),
        relatedEntityType: "Order",
        relatedEntityId: order.id,
      },
    });

    return NextResponse.json(
      {
        message: "Reorder request submitted.",
        data: {
          orderId: order.id,
        },
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { message: "Unable to submit reorder request." },
      { status: 500 },
    );
  }
}
