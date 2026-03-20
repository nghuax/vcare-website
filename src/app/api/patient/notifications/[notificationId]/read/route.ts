import { NextResponse } from "next/server";

import { requirePatientUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

type Params = {
  params: Promise<{
    notificationId: string;
  }>;
};

export async function POST(_: Request, context: Params) {
  const sessionUser = await requirePatientUser();

  const { notificationId } = await context.params;

  if (!notificationId) {
    return NextResponse.json(
      { message: "Notification ID is required." },
      { status: 400 },
    );
  }

  try {
    await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId: sessionUser.id,
      },
      data: {
        readAt: new Date(),
        status: "READ",
      },
    });

    return NextResponse.json({ message: "Notification marked as read." });
  } catch {
    return NextResponse.json(
      { message: "Unable to update notification right now." },
      { status: 500 },
    );
  }
}
