import {
  insuranceUiStatusDescription,
  insuranceUiStatusLabel,
  toInsuranceUiStatus,
  type InsuranceUiStatus,
} from "@/lib/insurance";
import { prisma } from "@/lib/prisma";
import { seededImageUrl } from "@/lib/random-data";

export type InsuranceRecordListItem = {
  id: string;
  insuranceProviderName: string;
  cardholderName: string;
  insuranceNumber: string;
  registeredHospitalName: string | null;
  insuranceExpiryDate: Date | null;
  submittedAt: Date;
  reviewedAt: Date | null;
  verifiedAt: Date | null;
  status: string;
  statusLabel: string;
  statusDescription: string;
  uiStatus: InsuranceUiStatus;
  documentCount: number;
  reviewedByStaffName: string | null;
  verifiedByStaffName: string | null;
};

export type InsuranceRecordDetail = InsuranceRecordListItem & {
  documents: Array<{
    id: string;
    documentType: string;
    fileName: string;
    fileUrl: string;
    createdAt: Date;
  }>;
  verificationNotes: Array<{
    id: string;
    note: string;
    isPatientVisible: boolean;
    createdAt: Date;
    createdByStaffName: string;
  }>;
};

export type InsuranceStatusSnapshot = {
  insuranceRecordId: string | null;
  status: string;
  uiStatus: InsuranceUiStatus;
  statusLabel: string;
  statusDescription: string;
  submittedAt: Date | null;
};

const MOCK_INSURANCE_ID = "c223456789012345678901234";

function mockNowOffset(days = 0): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function mapStatus(status: string | null | undefined) {
  const uiStatus = toInsuranceUiStatus(status);

  return {
    uiStatus,
    statusLabel: insuranceUiStatusLabel(uiStatus),
    statusDescription: insuranceUiStatusDescription(uiStatus),
  };
}

function mapInsuranceRecord(record: {
  id: string;
  insuranceProviderName: string;
  cardholderName: string;
  insuranceNumber: string;
  registeredHospitalName: string | null;
  insuranceExpiryDate: Date | null;
  submittedAt: Date;
  reviewedAt: Date | null;
  verifiedAt: Date | null;
  insuranceVerificationStatus: string;
  documents: Array<{ id: string }>;
  reviewedByStaff: { fullName: string } | null;
  verifiedByStaff: { fullName: string } | null;
}): InsuranceRecordListItem {
  const status = mapStatus(record.insuranceVerificationStatus);

  return {
    id: record.id,
    insuranceProviderName: record.insuranceProviderName,
    cardholderName: record.cardholderName,
    insuranceNumber: record.insuranceNumber,
    registeredHospitalName: record.registeredHospitalName,
    insuranceExpiryDate: record.insuranceExpiryDate,
    submittedAt: record.submittedAt,
    reviewedAt: record.reviewedAt,
    verifiedAt: record.verifiedAt,
    status: record.insuranceVerificationStatus,
    statusLabel: status.statusLabel,
    statusDescription: status.statusDescription,
    uiStatus: status.uiStatus,
    documentCount: record.documents.length,
    reviewedByStaffName: record.reviewedByStaff?.fullName ?? null,
    verifiedByStaffName: record.verifiedByStaff?.fullName ?? null,
  };
}

function mockInsuranceRecords(): InsuranceRecordListItem[] {
  const pendingStatus = mapStatus("SUBMITTED");

  return [
    {
      id: MOCK_INSURANCE_ID,
      insuranceProviderName: "Vietnam Social Insurance",
      cardholderName: "VCare Patient",
      insuranceNumber: "VN-BHYT-MOCK-0001",
      registeredHospitalName: "VCare Partner Hospital",
      insuranceExpiryDate: mockNowOffset(250),
      submittedAt: mockNowOffset(-1),
      reviewedAt: null,
      verifiedAt: null,
      status: "SUBMITTED",
      statusLabel: pendingStatus.statusLabel,
      statusDescription: pendingStatus.statusDescription,
      uiStatus: pendingStatus.uiStatus,
      documentCount: 2,
      reviewedByStaffName: null,
      verifiedByStaffName: null,
    },
  ];
}

function mockInsuranceDetail(): InsuranceRecordDetail {
  const item = mockInsuranceRecords()[0];

  return {
    ...item,
    documents: [
      {
        id: "mock-insurance-doc-front",
        documentType: "CARD_FRONT",
        fileName: "insurance-front.jpg",
        fileUrl: seededImageUrl("mock-insurance-front", 1200, 760),
        createdAt: mockNowOffset(-1),
      },
      {
        id: "mock-insurance-doc-back",
        documentType: "CARD_BACK",
        fileName: "insurance-back.jpg",
        fileUrl: seededImageUrl("mock-insurance-back", 1200, 760),
        createdAt: mockNowOffset(-1),
      },
    ],
    verificationNotes: [],
  };
}

async function safeQuery<T>(query: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await query();
  } catch {
    return fallback;
  }
}

export async function getPatientInsuranceRecords(
  patientUserId: string,
): Promise<InsuranceRecordListItem[]> {
  const records = await safeQuery(
    async () => {
      const rows = await prisma.insuranceRecord.findMany({
        where: { patientUserId },
        include: {
          documents: {
            select: { id: true },
          },
          reviewedByStaff: {
            select: { fullName: true },
          },
          verifiedByStaff: {
            select: { fullName: true },
          },
        },
        orderBy: { submittedAt: "desc" },
      });

      return rows.map(mapInsuranceRecord);
    },
    mockInsuranceRecords(),
  );

  return records.length ? records : [];
}

export async function getPatientInsuranceDetail(
  patientUserId: string,
  insuranceRecordId: string,
): Promise<InsuranceRecordDetail | null> {
  const fallback = insuranceRecordId === MOCK_INSURANCE_ID ? mockInsuranceDetail() : null;

  return safeQuery(
    async () => {
      const record = await prisma.insuranceRecord.findFirst({
        where: {
          id: insuranceRecordId,
          patientUserId,
        },
        include: {
          documents: {
            orderBy: { createdAt: "desc" },
          },
          verificationNotes: {
            include: {
              createdByStaff: {
                select: { fullName: true },
              },
            },
            orderBy: { createdAt: "desc" },
          },
          reviewedByStaff: {
            select: { fullName: true },
          },
          verifiedByStaff: {
            select: { fullName: true },
          },
        },
      });

      if (!record) {
        return null;
      }

      return {
        ...mapInsuranceRecord(record),
        documents: record.documents,
        verificationNotes: record.verificationNotes.map((note) => ({
          id: note.id,
          note: note.note,
          isPatientVisible: note.isPatientVisible,
          createdAt: note.createdAt,
          createdByStaffName: note.createdByStaff.fullName,
        })),
      };
    },
    fallback,
  );
}

export async function getPatientInsuranceStatusSnapshot(
  patientUserId: string,
): Promise<InsuranceStatusSnapshot> {
  return safeQuery(
    async () => {
      const latestRecord = await prisma.insuranceRecord.findFirst({
        where: { patientUserId },
        select: {
          id: true,
          insuranceVerificationStatus: true,
          submittedAt: true,
        },
        orderBy: { submittedAt: "desc" },
      });

      if (!latestRecord) {
        const fallbackStatus = mapStatus("NOT_SUBMITTED");

        return {
          insuranceRecordId: null,
          status: "NOT_SUBMITTED",
          uiStatus: fallbackStatus.uiStatus,
          statusLabel: fallbackStatus.statusLabel,
          statusDescription: fallbackStatus.statusDescription,
          submittedAt: null,
        };
      }

      const mapped = mapStatus(latestRecord.insuranceVerificationStatus);

      return {
        insuranceRecordId: latestRecord.id,
        status: latestRecord.insuranceVerificationStatus,
        uiStatus: mapped.uiStatus,
        statusLabel: mapped.statusLabel,
        statusDescription: mapped.statusDescription,
        submittedAt: latestRecord.submittedAt,
      };
    },
    {
      insuranceRecordId: MOCK_INSURANCE_ID,
      status: "SUBMITTED",
      uiStatus: "PENDING_VERIFICATION",
      statusLabel: "pending verification",
      statusDescription:
        "Insurance uploaded and waiting for clinic or hospital staff review.",
      submittedAt: mockNowOffset(-1),
    },
  );
}
