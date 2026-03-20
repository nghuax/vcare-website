import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requirePatientUser } from "@/lib/session";

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;
const ACCEPTED_MIME_PREFIXES = ["image/"];
const ACCEPTED_MIME_TYPES = ["application/pdf"];

const uploadSchema = z.object({
  cardholderName: z.string().trim().min(2).max(120),
  insuranceNumber: z.string().trim().min(5).max(80),
  insuranceProviderName: z.string().trim().min(2).max(120),
  registeredHospitalName: z.string().trim().max(200).optional(),
  insuranceExpiryDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

function normalizeFile(file: FormDataEntryValue | null): File | null {
  if (!(file instanceof File)) {
    return null;
  }

  if (!file.size) {
    return null;
  }

  return file;
}

function isAllowedMimeType(mimeType: string): boolean {
  return (
    ACCEPTED_MIME_TYPES.includes(mimeType) ||
    ACCEPTED_MIME_PREFIXES.some((prefix) => mimeType.startsWith(prefix))
  );
}

function validateFile(file: File, label: string): string | null {
  if (!isAllowedMimeType(file.type)) {
    return `${label} must be an image or PDF file.`;
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `${label} must be 8MB or smaller.`;
  }

  return null;
}

export async function POST(request: Request) {
  const sessionUser = await requirePatientUser();

  try {
    const formData = await request.formData();

    const parsed = uploadSchema.safeParse({
      cardholderName: formData.get("cardholderName"),
      insuranceNumber: formData.get("insuranceNumber"),
      insuranceProviderName: formData.get("insuranceProviderName"),
      registeredHospitalName: formData.get("registeredHospitalName") || undefined,
      insuranceExpiryDate: formData.get("insuranceExpiryDate") || undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid insurance upload payload." },
        { status: 400 },
      );
    }

    const cardFrontFile = normalizeFile(formData.get("insuranceCardFront"));
    const cardBackFile = normalizeFile(formData.get("insuranceCardBack"));
    const supportingDocument = normalizeFile(formData.get("supportingDocument"));

    const allFiles = [
      { file: cardFrontFile, label: "Insurance card front" },
      { file: cardBackFile, label: "Insurance card back" },
      { file: supportingDocument, label: "Supporting document" },
    ];

    if (!allFiles.some(({ file }) => Boolean(file))) {
      return NextResponse.json(
        {
          message:
            "Upload at least one insurance card image or supporting document.",
        },
        { status: 400 },
      );
    }

    for (const entry of allFiles) {
      if (!entry.file) {
        continue;
      }

      const validationError = validateFile(entry.file, entry.label);

      if (validationError) {
        return NextResponse.json({ message: validationError }, { status: 400 });
      }
    }

    const insuranceRecord = await prisma.$transaction(async (tx) => {
      const createdRecord = await tx.insuranceRecord.create({
        data: {
          patientUserId: sessionUser.id,
          insuranceProviderName: parsed.data.insuranceProviderName,
          cardholderName: parsed.data.cardholderName,
          insuranceNumber: parsed.data.insuranceNumber,
          registeredHospitalName: parsed.data.registeredHospitalName || null,
          insuranceExpiryDate: parsed.data.insuranceExpiryDate
            ? new Date(`${parsed.data.insuranceExpiryDate}T00:00:00.000Z`)
            : null,
          insuranceVerificationStatus: "SUBMITTED",
          submittedAt: new Date(),
        },
      });

      const createDocumentData: Array<{
        uploadedByUserId: string;
        insuranceRecordId: string;
        documentType: "CARD_FRONT" | "CARD_BACK" | "SUPPORTING_DOCUMENT";
        fileName: string;
        fileUrl: string;
      }> = [];

      function buildStoredFile(file: File) {
        const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");

        return {
          fileName: safeFileName,
          fileUrl: `uploaded://insurance/${createdRecord.id}/${safeFileName}`,
        };
      }

      if (cardFrontFile) {
        const storedFile = buildStoredFile(cardFrontFile);

        createDocumentData.push({
          uploadedByUserId: sessionUser.id,
          insuranceRecordId: createdRecord.id,
          documentType: "CARD_FRONT",
          fileName: storedFile.fileName,
          fileUrl: storedFile.fileUrl,
        });
      }

      if (cardBackFile) {
        const storedFile = buildStoredFile(cardBackFile);

        createDocumentData.push({
          uploadedByUserId: sessionUser.id,
          insuranceRecordId: createdRecord.id,
          documentType: "CARD_BACK",
          fileName: storedFile.fileName,
          fileUrl: storedFile.fileUrl,
        });
      }

      if (supportingDocument) {
        const storedFile = buildStoredFile(supportingDocument);

        createDocumentData.push({
          uploadedByUserId: sessionUser.id,
          insuranceRecordId: createdRecord.id,
          documentType: "SUPPORTING_DOCUMENT",
          fileName: storedFile.fileName,
          fileUrl: storedFile.fileUrl,
        });
      }

      if (createDocumentData.length) {
        await tx.insuranceDocument.createMany({
          data: createDocumentData,
        });
      }

      await tx.notification.create({
        data: {
          userId: sessionUser.id,
          title: "Insurance uploaded",
          body: "Insurance uploaded. Verification pending clinic or hospital staff review.",
          channel: "IN_APP",
          status: "SENT",
          sentAt: new Date(),
          relatedEntityType: "InsuranceRecord",
          relatedEntityId: createdRecord.id,
        },
      });

      return createdRecord;
    });

    return NextResponse.json(
      {
        message: "Insurance uploaded successfully.",
        data: {
          insuranceRecordId: insuranceRecord.id,
        },
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { message: "Unable to upload insurance right now." },
      { status: 500 },
    );
  }
}
