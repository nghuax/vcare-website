import { NextResponse } from "next/server";
import { z } from "zod";

import { requirePatientUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const payloadSchema = z.object({
  fullName: z.string().min(2).max(120),
  phone: z.string().max(30).optional(),
  locale: z.enum(["vi-VN", "en-US"]),
});

export async function PATCH(request: Request) {
  const sessionUser = await requirePatientUser();

  try {
    const parsed = payloadSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid account settings payload." },
        { status: 400 },
      );
    }

    await prisma.user.update({
      where: {
        id: sessionUser.id,
      },
      data: {
        fullName: parsed.data.fullName.trim(),
        phone: parsed.data.phone?.trim() || null,
        locale: parsed.data.locale,
      },
    });

    return NextResponse.json({ message: "Account settings saved." });
  } catch {
    return NextResponse.json(
      { message: "Unable to save account settings." },
      { status: 500 },
    );
  }
}
