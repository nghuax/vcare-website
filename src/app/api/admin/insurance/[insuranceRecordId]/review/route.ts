import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireStaffOrAdminUser } from "@/lib/session";

const payloadSchema = z.object({
  action: z.enum(["VERIFY", "REJECT", "REQUEST_INFO"]),
  note: z.string().trim().max(1000).optional(),
  isPatientVisible: z.boolean().optional(),
});

type RouteProps = {
  params: Promise<{
    insuranceRecordId: string;
  }>;
};

export async function POST(request: Request, { params }: RouteProps) {
  const sessionUser = await requireStaffOrAdminUser();

  const { insuranceRecordId } = await params;

  if (!insuranceRecordId) {
    return NextResponse.json({ message: "Insurance record is required." }, { status: 400 });
  }

  try {
    const parsed = payloadSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid insurance review payload." },
        { status: 400 },
      );
    }

    const insuranceRecord = await prisma.insuranceRecord.findUnique({
      where: { id: insuranceRecordId },
      select: {
        id: true,
        patientUserId: true,
      },
    });

    if (!insuranceRecord) {
      return NextResponse.json(
        { message: "Insurance record not found." },
        { status: 404 },
      );
    }

    const payload = parsed.data;

    await prisma.$transaction(async (tx) => {
      if (payload.action === "VERIFY") {
        await tx.insuranceRecord.update({
          where: { id: insuranceRecordId },
          data: {
            insuranceVerificationStatus: "VERIFIED",
            reviewedByStaffId: sessionUser.id,
            verifiedByStaffId: sessionUser.id,
            reviewedAt: new Date(),
            verifiedAt: new Date(),
          },
        });
      } else if (payload.action === "REJECT") {
        await tx.insuranceRecord.update({
          where: { id: insuranceRecordId },
          data: {
            insuranceVerificationStatus: "REJECTED",
            reviewedByStaffId: sessionUser.id,
            reviewedAt: new Date(),
            verifiedByStaffId: null,
            verifiedAt: null,
          },
        });
      } else {
        await tx.insuranceRecord.update({
          where: { id: insuranceRecordId },
          data: {
            insuranceVerificationStatus: "NEEDS_INFORMATION",
            reviewedByStaffId: sessionUser.id,
            reviewedAt: new Date(),
            verifiedByStaffId: null,
            verifiedAt: null,
          },
        });
      }

      if (payload.note?.trim()) {
        await tx.insuranceVerificationNote.create({
          data: {
            insuranceRecordId,
            createdByStaffId: sessionUser.id,
            note: payload.note,
            isPatientVisible: payload.isPatientVisible ?? true,
          },
        });
      }

      await tx.notification.create({
        data: {
          userId: insuranceRecord.patientUserId,
          title: "Insurance verification status updated",
          body:
            payload.action === "VERIFY"
              ? "Insurance verification status is now verified."
              : payload.action === "REJECT"
                ? "Insurance verification status is now rejected."
                : "Insurance verification requires additional information.",
          channel: "IN_APP",
          status: "SENT",
          sentAt: new Date(),
          relatedEntityType: "InsuranceRecord",
          relatedEntityId: insuranceRecordId,
        },
      });
    });

    return NextResponse.json({ message: "Insurance review saved." });
  } catch {
    return NextResponse.json(
      { message: "Unable to save insurance review." },
      { status: 500 },
    );
  }
}
