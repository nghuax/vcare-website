import { NextResponse } from "next/server";
import { z } from "zod";

import { requirePatientUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const payloadSchema = z.object({
  fullName: z.string().min(2).max(120),
  relationship: z.enum([
    "SPOUSE",
    "CHILD",
    "PARENT",
    "SIBLING",
    "CAREGIVER",
    "OTHER",
  ]),
  dateOfBirth: z.string().date().optional(),
  phone: z.string().max(30).optional(),
});

export async function POST(request: Request) {
  const sessionUser = await requirePatientUser();

  try {
    const parsed = payloadSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid family profile payload." },
        { status: 400 },
      );
    }

    const member = await prisma.familyMember.create({
      data: {
        patientUserId: sessionUser.id,
        fullName: parsed.data.fullName.trim(),
        relationship: parsed.data.relationship,
        dateOfBirth: parsed.data.dateOfBirth
          ? new Date(parsed.data.dateOfBirth)
          : null,
        phone: parsed.data.phone?.trim() || null,
      },
      select: {
        id: true,
      },
    });

    return NextResponse.json(
      {
        message: "Family profile added.",
        data: { id: member.id },
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { message: "Unable to add family profile." },
      { status: 500 },
    );
  }
}
