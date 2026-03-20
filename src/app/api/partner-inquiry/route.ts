import { NextResponse } from "next/server";
import type { PartnerOrganizationType } from "@prisma/client";

import { prisma } from "@/lib/prisma";

type PartnerInquiryPayload = {
  organizationName?: string;
  organizationType?: "PHARMACY" | "CLINIC" | "HOSPITAL" | "OTHER";
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  inquiryMessage?: string;
};

const ORGANIZATION_TYPES = new Set(["PHARMACY", "CLINIC", "HOSPITAL", "OTHER"]);

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as PartnerInquiryPayload;

    const organizationName = payload.organizationName?.trim();
    const contactName = payload.contactName?.trim();
    const contactEmail = payload.contactEmail?.trim().toLowerCase();
    const contactPhone = payload.contactPhone?.trim();
    const inquiryMessage = payload.inquiryMessage?.trim();
    const organizationType = payload.organizationType?.toUpperCase();

    if (!organizationName || !contactName || !contactEmail || !inquiryMessage) {
      return NextResponse.json(
        { message: "organizationName, contactName, contactEmail, and inquiryMessage are required." },
        { status: 400 },
      );
    }

    if (
      !organizationType ||
      !ORGANIZATION_TYPES.has(organizationType) ||
      !isPartnerOrganizationType(organizationType)
    ) {
      return NextResponse.json(
        { message: "organizationType is invalid." },
        { status: 400 },
      );
    }

    const createdRecord = await prisma.partnerOrganization.create({
      data: {
        name: organizationName,
        organizationType,
        contactName,
        contactEmail,
        contactPhone: contactPhone || null,
        inquiryMessage,
        inquiryStatus: "NEW",
      },
      select: {
        id: true,
        name: true,
        inquiryStatus: true,
      },
    });

    return NextResponse.json(
      {
        message: "Partner inquiry submitted.",
        data: createdRecord,
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { message: "Unable to submit inquiry right now." },
      { status: 500 },
    );
  }
}

function isPartnerOrganizationType(
  value: string,
): value is PartnerOrganizationType {
  return (
    value === "PHARMACY" ||
    value === "CLINIC" ||
    value === "HOSPITAL" ||
    value === "OTHER"
  );
}
