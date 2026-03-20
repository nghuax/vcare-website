import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireStaffOrAdminUser } from "@/lib/session";

const hospitalPayloadSchema = z.object({
  type: z.literal("HOSPITAL"),
  id: z.string().cuid().optional(),
  name: z.string().trim().min(2).max(150),
  code: z.string().trim().max(60).optional(),
  addressLine: z.string().trim().max(180).optional(),
  city: z.string().trim().max(80).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  isBookingVisible: z.boolean().default(true),
});

const clinicPayloadSchema = z.object({
  type: z.literal("CLINIC"),
  id: z.string().cuid().optional(),
  hospitalId: z.string().cuid().optional(),
  name: z.string().trim().min(2).max(150),
  code: z.string().trim().max(60).optional(),
  addressLine: z.string().trim().max(180).optional(),
  city: z.string().trim().max(80).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  isBookingVisible: z.boolean().default(true),
});

const payloadSchema = z.discriminatedUnion("type", [
  hospitalPayloadSchema,
  clinicPayloadSchema,
]);

export async function POST(request: Request) {
  await requireStaffOrAdminUser();

  try {
    const parsed = payloadSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid facility payload." }, { status: 400 });
    }

    const payload = parsed.data;

    if (payload.type === "HOSPITAL") {
      const hospital = payload.id
        ? await prisma.hospital.update({
            where: { id: payload.id },
            data: {
              name: payload.name,
              code: payload.code || null,
              addressLine: payload.addressLine || null,
              city: payload.city || null,
              status: payload.status,
              isBookingVisible: payload.isBookingVisible,
            },
          })
        : await prisma.hospital.create({
            data: {
              name: payload.name,
              code: payload.code || null,
              addressLine: payload.addressLine || null,
              city: payload.city || null,
              status: payload.status,
              isBookingVisible: payload.isBookingVisible,
            },
          });

      return NextResponse.json(
        {
          message: "Hospital saved.",
          data: { hospitalId: hospital.id },
        },
        { status: 201 },
      );
    }

    if (payload.hospitalId) {
      const hospital = await prisma.hospital.findUnique({
        where: { id: payload.hospitalId },
        select: { id: true },
      });

      if (!hospital) {
        return NextResponse.json({ message: "Hospital not found." }, { status: 404 });
      }
    }

    const clinic = payload.id
      ? await prisma.clinic.update({
          where: { id: payload.id },
          data: {
            hospitalId: payload.hospitalId || null,
            name: payload.name,
            code: payload.code || null,
            addressLine: payload.addressLine || null,
            city: payload.city || null,
            status: payload.status,
            isBookingVisible: payload.isBookingVisible,
          },
        })
      : await prisma.clinic.create({
          data: {
            hospitalId: payload.hospitalId || null,
            name: payload.name,
            code: payload.code || null,
            addressLine: payload.addressLine || null,
            city: payload.city || null,
            status: payload.status,
            isBookingVisible: payload.isBookingVisible,
          },
        });

    return NextResponse.json(
      {
        message: "Clinic saved.",
        data: { clinicId: clinic.id },
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { message: "Unable to save facility information." },
      { status: 500 },
    );
  }
}
