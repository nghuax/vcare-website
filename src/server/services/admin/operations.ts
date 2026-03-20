import { daysUntil } from "@/lib/date";
import { prisma } from "@/lib/prisma";
import {
  createRandomDoctorProfile,
  seededAvatarUrl,
  seededImageUrl,
} from "@/lib/random-data";

export type AdminAnalyticsSummary = {
  totalPrescriptions: number;
  pendingPrescriptionReviews: number;
  pendingInsuranceVerifications: number;
  totalBookings: number;
  totalReorderRequests: number;
  patientCount: number;
  doctorCount: number;
};

export type PrescriptionQueueItem = {
  id: string;
  reference: string;
  patientName: string;
  status: string;
  insuranceStatus: string;
  uploadedAt: Date;
  reviewedAt: Date | null;
  reviewedByStaffName: string | null;
  imageCount: number;
  scheduleCount: number;
  notes: string | null;
};

export type PrescriptionReviewDetail = PrescriptionQueueItem & {
  patientUserId: string;
  patientEmail: string;
  patientPhone: string | null;
  images: Array<{
    id: string;
    imageUrl: string;
    imageLabel: string | null;
    createdAt: Date;
  }>;
  schedules: Array<{
    id: string;
    medicineId: string;
    medicineName: string;
    dosageInstruction: string | null;
    timingLabel: string | null;
    timesPerDay: number | null;
    startDate: Date | null;
    endDate: Date | null;
    status: string;
  }>;
};

export type InsuranceQueueItem = {
  id: string;
  patientName: string;
  cardholderName: string;
  insuranceNumber: string;
  insuranceProviderName: string;
  status: string;
  submittedAt: Date;
  reviewedAt: Date | null;
  verifiedAt: Date | null;
  reviewedByStaffName: string | null;
  verifiedByStaffName: string | null;
  documentCount: number;
  noteCount: number;
};

export type PatientListItem = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  createdAt: Date;
  prescriptionCount: number;
  insuranceCount: number;
  appointmentCount: number;
  orderCount: number;
};

export type PatientDetailRecord = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  status: string;
  createdAt: Date;
  prescriptions: Array<{
    id: string;
    reference: string;
    status: string;
    uploadedAt: Date;
  }>;
  insuranceRecords: Array<{
    id: string;
    insuranceNumber: string;
    status: string;
    submittedAt: Date;
  }>;
  appointmentRequests: Array<{
    id: string;
    status: string;
    requestedAt: Date;
    doctorName: string | null;
    clinicName: string | null;
    hospitalName: string | null;
  }>;
  orders: Array<{
    id: string;
    status: string;
    fulfillmentMethod: string;
    createdAt: Date;
  }>;
  familyMembers: Array<{
    id: string;
    fullName: string;
    relationship: string;
  }>;
  notifications: Array<{
    id: string;
    title: string;
    status: string;
    createdAt: Date;
  }>;
};

export type MedicinePlanCreatorData = {
  reviewablePrescriptions: Array<{
    id: string;
    reference: string;
    patientName: string;
    status: string;
    scheduleCount: number;
  }>;
  schedules: Array<{
    id: string;
    prescriptionId: string;
    prescriptionReference: string;
    patientName: string;
    medicineName: string;
    timingLabel: string;
    timesPerDay: number;
    status: string;
    startDate: Date | null;
    endDate: Date | null;
  }>;
};

export type OrderManagementItem = {
  id: string;
  orderNumber: string;
  patientName: string;
  status: string;
  fulfillmentMethod: string;
  quantity: number | null;
  createdAt: Date;
  reviewedByStaffName: string | null;
  prescriptionReference: string;
  medicineName: string;
};

export type ReminderItem = {
  refillCycleId: string;
  patientName: string;
  prescriptionReference: string;
  medicineName: string;
  cycleDays: number;
  status: string;
  nextRefillAt: Date | null;
  reminderState: "TRACKING" | "DUE_SOON" | "OVERDUE";
  daysRemaining: number | null;
};

export type DoctorManagementData = {
  doctors: Array<{
    id: string;
    fullName: string;
    specialty: string | null;
    status: string;
    doctorInformation: string | null;
    consultationFeeNote: string | null;
    profileImageUrl: string | null;
    yearsOfExperience: number | null;
    clinicId: string | null;
    clinicName: string | null;
    hospitalId: string | null;
    hospitalName: string | null;
    ratingScore: number;
    reviewCount: number;
    slotCount: number;
    nextSlotAt: Date | null;
  }>;
  hospitalOptions: Array<{ id: string; name: string }>;
  clinicOptions: Array<{ id: string; name: string; hospitalId: string | null }>;
};

export type FacilityManagementData = {
  hospitals: Array<{
    id: string;
    name: string;
    code: string | null;
    city: string | null;
    status: string;
    isBookingVisible: boolean;
    clinicCount: number;
    doctorCount: number;
  }>;
  clinics: Array<{
    id: string;
    name: string;
    code: string | null;
    city: string | null;
    status: string;
    isBookingVisible: boolean;
    hospitalId: string | null;
    hospitalName: string | null;
    doctorCount: number;
  }>;
};

export type ConsultationNoteLogItem = {
  id: string;
  patientName: string;
  doctorName: string | null;
  summary: string;
  doctorInformation: string | null;
  createdAt: Date;
  reviewedAt: Date | null;
  reviewedByStaffName: string | null;
};

const MOCK_PATIENT_ID = "mock-patient-001";
const MOCK_PRESCRIPTION_ID = "mock-rx-001";
const MOCK_INSURANCE_ID = "mock-insurance-001";
const MOCK_DOCTOR_PROFILE = createRandomDoctorProfile("admin-mock-doctor-1");

function mockNowOffset(days = 0, hours = 0): Date {
  const date = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  date.setHours(date.getHours() + hours);
  return date;
}

async function safeQuery<T>(query: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await query();
  } catch {
    return fallback;
  }
}

function toReminderState(nextRefillAt: Date | null): {
  reminderState: "TRACKING" | "DUE_SOON" | "OVERDUE";
  daysRemaining: number | null;
} {
  if (!nextRefillAt) {
    return {
      reminderState: "TRACKING",
      daysRemaining: null,
    };
  }

  const remaining = daysUntil(nextRefillAt);

  if (remaining < 0) {
    return {
      reminderState: "OVERDUE",
      daysRemaining: remaining,
    };
  }

  if (remaining <= 5) {
    return {
      reminderState: "DUE_SOON",
      daysRemaining: remaining,
    };
  }

  return {
    reminderState: "TRACKING",
    daysRemaining: remaining,
  };
}

function mockAnalytics(): AdminAnalyticsSummary {
  return {
    totalPrescriptions: 12,
    pendingPrescriptionReviews: 4,
    pendingInsuranceVerifications: 3,
    totalBookings: 7,
    totalReorderRequests: 9,
    patientCount: 6,
    doctorCount: 5,
  };
}

function mockPrescriptionQueue(): PrescriptionQueueItem[] {
  return [
    {
      id: MOCK_PRESCRIPTION_ID,
      reference: "VC-RX-MOCK-001",
      patientName: "Nguyen Van A",
      status: "UPLOADED",
      insuranceStatus: "SUBMITTED",
      uploadedAt: mockNowOffset(-1),
      reviewedAt: null,
      reviewedByStaffName: null,
      imageCount: 2,
      scheduleCount: 0,
      notes: "Uploaded prescription pending review.",
    },
    {
      id: "mock-rx-002",
      reference: "VC-RX-MOCK-002",
      patientName: "Tran Thi B",
      status: "REVIEW_IN_PROGRESS",
      insuranceStatus: "IN_REVIEW",
      uploadedAt: mockNowOffset(-3),
      reviewedAt: mockNowOffset(-2),
      reviewedByStaffName: "VCare Staff",
      imageCount: 1,
      scheduleCount: 1,
      notes: "Schedule review in progress.",
    },
  ];
}

function mockPrescriptionDetail(
  prescriptionId: string,
): PrescriptionReviewDetail | null {
  const queueItem = mockPrescriptionQueue().find((item) => item.id === prescriptionId);

  if (!queueItem) {
    return null;
  }

  return {
    ...queueItem,
    patientUserId: MOCK_PATIENT_ID,
    patientEmail: "patient@vcare.vn",
    patientPhone: "+84 912 345 678",
    images: [
      {
        id: "mock-rx-image-1",
        imageUrl: seededImageUrl(`admin-prescription-${prescriptionId}`, 1200, 760),
        imageLabel: "front.jpg",
        createdAt: mockNowOffset(-1),
      },
    ],
    schedules: [
      {
        id: "mock-schedule-1",
        medicineId: "mock-med-1",
        medicineName: "Metformin 500mg",
        dosageInstruction: "Schedule created by staff review.",
        timingLabel: "08:00 and 20:00",
        timesPerDay: 2,
        startDate: mockNowOffset(-1),
        endDate: mockNowOffset(28),
        status: "ACTIVE",
      },
    ],
  };
}

function mockInsuranceQueue(): InsuranceQueueItem[] {
  return [
    {
      id: MOCK_INSURANCE_ID,
      patientName: "Nguyen Van A",
      cardholderName: "Nguyen Van A",
      insuranceNumber: "VN-BHYT-MOCK-001",
      insuranceProviderName: "Vietnam Social Insurance",
      status: "SUBMITTED",
      submittedAt: mockNowOffset(-2),
      reviewedAt: null,
      verifiedAt: null,
      reviewedByStaffName: null,
      verifiedByStaffName: null,
      documentCount: 2,
      noteCount: 0,
    },
    {
      id: "mock-insurance-002",
      patientName: "Tran Thi B",
      cardholderName: "Tran Thi B",
      insuranceNumber: "VN-BHYT-MOCK-002",
      insuranceProviderName: "Vietnam Social Insurance",
      status: "VERIFIED",
      submittedAt: mockNowOffset(-14),
      reviewedAt: mockNowOffset(-12),
      verifiedAt: mockNowOffset(-11),
      reviewedByStaffName: "VCare Staff",
      verifiedByStaffName: "VCare Staff",
      documentCount: 3,
      noteCount: 1,
    },
  ];
}

function mockPatientList(): PatientListItem[] {
  return [
    {
      id: MOCK_PATIENT_ID,
      fullName: "Nguyen Van A",
      email: "patient@vcare.vn",
      phone: "+84 912 345 678",
      createdAt: mockNowOffset(-90),
      prescriptionCount: 3,
      insuranceCount: 2,
      appointmentCount: 2,
      orderCount: 2,
    },
    {
      id: "mock-patient-002",
      fullName: "Tran Thi B",
      email: "tran.b@example.vn",
      phone: "+84 938 111 222",
      createdAt: mockNowOffset(-40),
      prescriptionCount: 2,
      insuranceCount: 1,
      appointmentCount: 1,
      orderCount: 1,
    },
  ];
}

function mockPatientDetail(patientUserId: string): PatientDetailRecord | null {
  const profile = mockPatientList().find((patient) => patient.id === patientUserId);

  if (!profile) {
    return null;
  }

  return {
    id: profile.id,
    fullName: profile.fullName,
    email: profile.email,
    phone: profile.phone,
    status: "ACTIVE",
    createdAt: profile.createdAt,
    prescriptions: mockPrescriptionQueue().map((item) => ({
      id: item.id,
      reference: item.reference,
      status: item.status,
      uploadedAt: item.uploadedAt,
    })),
    insuranceRecords: mockInsuranceQueue().map((item) => ({
      id: item.id,
      insuranceNumber: item.insuranceNumber,
      status: item.status,
      submittedAt: item.submittedAt,
    })),
    appointmentRequests: [
      {
        id: "mock-appt-001",
        status: "REQUESTED",
        requestedAt: mockNowOffset(-1),
        doctorName: MOCK_DOCTOR_PROFILE.fullName,
        clinicName: "VCare Coordination Clinic",
        hospitalName: "VCare Partner Hospital",
      },
    ],
    orders: [
      {
        id: "mock-order-001",
        status: "SUBMITTED",
        fulfillmentMethod: "PICKUP",
        createdAt: mockNowOffset(-1),
      },
    ],
    familyMembers: [
      {
        id: "mock-family-001",
        fullName: "Nguyen Thi C",
        relationship: "CHILD",
      },
    ],
    notifications: [
      {
        id: "mock-notification-001",
        title: "Insurance uploaded",
        status: "SENT",
        createdAt: mockNowOffset(-2),
      },
    ],
  };
}

function mockMedicinePlanData(): MedicinePlanCreatorData {
  return {
    reviewablePrescriptions: mockPrescriptionQueue().map((item) => ({
      id: item.id,
      reference: item.reference,
      patientName: item.patientName,
      status: item.status,
      scheduleCount: item.scheduleCount,
    })),
    schedules: [
      {
        id: "mock-schedule-1",
        prescriptionId: MOCK_PRESCRIPTION_ID,
        prescriptionReference: "VC-RX-MOCK-001",
        patientName: "Nguyen Van A",
        medicineName: "Metformin 500mg",
        timingLabel: "08:00 and 20:00",
        timesPerDay: 2,
        status: "ACTIVE",
        startDate: mockNowOffset(-2),
        endDate: mockNowOffset(28),
      },
    ],
  };
}

function mockOrders(): OrderManagementItem[] {
  return [
    {
      id: "mock-order-001",
      orderNumber: "VC-ORD-MOCK-001",
      patientName: "Nguyen Van A",
      status: "SUBMITTED",
      fulfillmentMethod: "PICKUP",
      quantity: 1,
      createdAt: mockNowOffset(-1),
      reviewedByStaffName: null,
      prescriptionReference: "VC-RX-MOCK-001",
      medicineName: "Metformin 500mg",
    },
  ];
}

function mockReminders(): ReminderItem[] {
  const nextRefillAt = mockNowOffset(3);
  const state = toReminderState(nextRefillAt);

  return [
    {
      refillCycleId: "mock-refill-001",
      patientName: "Nguyen Van A",
      prescriptionReference: "VC-RX-MOCK-001",
      medicineName: "Metformin 500mg",
      cycleDays: 30,
      status: "TRACKING",
      nextRefillAt,
      reminderState: state.reminderState,
      daysRemaining: state.daysRemaining,
    },
  ];
}

function mockDoctorManagementData(): DoctorManagementData {
  return {
    doctors: [
      {
        id: "mock-doctor-001",
        fullName: MOCK_DOCTOR_PROFILE.fullName,
        specialty: MOCK_DOCTOR_PROFILE.specialty,
        status: "ACTIVE",
        doctorInformation: MOCK_DOCTOR_PROFILE.doctorInformation,
        consultationFeeNote: MOCK_DOCTOR_PROFILE.consultationFeeNote,
        profileImageUrl: MOCK_DOCTOR_PROFILE.profileImageUrl,
        yearsOfExperience: MOCK_DOCTOR_PROFILE.yearsOfExperience,
        clinicId: "mock-clinic-001",
        clinicName: "VCare Coordination Clinic",
        hospitalId: "mock-hospital-001",
        hospitalName: "VCare Partner Hospital",
        ratingScore: MOCK_DOCTOR_PROFILE.ratingScore,
        reviewCount: MOCK_DOCTOR_PROFILE.reviewCount,
        slotCount: 4,
        nextSlotAt: mockNowOffset(1),
      },
    ],
    hospitalOptions: [
      { id: "mock-hospital-001", name: "VCare Partner Hospital" },
      { id: "mock-hospital-002", name: "VCare North General Hospital" },
    ],
    clinicOptions: [
      {
        id: "mock-clinic-001",
        name: "VCare Coordination Clinic",
        hospitalId: "mock-hospital-001",
      },
    ],
  };
}

function mockFacilityData(): FacilityManagementData {
  return {
    hospitals: [
      {
        id: "mock-hospital-001",
        name: "VCare Partner Hospital",
        code: "VC-HCM-001",
        city: "Ho Chi Minh City",
        status: "ACTIVE",
        isBookingVisible: true,
        clinicCount: 2,
        doctorCount: 3,
      },
    ],
    clinics: [
      {
        id: "mock-clinic-001",
        name: "VCare Coordination Clinic",
        code: "VC-CLINIC-001",
        city: "Ho Chi Minh City",
        status: "ACTIVE",
        isBookingVisible: true,
        hospitalId: "mock-hospital-001",
        hospitalName: "VCare Partner Hospital",
        doctorCount: 2,
      },
    ],
  };
}

function mockConsultationNotes(): ConsultationNoteLogItem[] {
  return [
    {
      id: "mock-consultation-001",
      patientName: "Nguyen Van A",
      doctorName: MOCK_DOCTOR_PROFILE.fullName,
      summary: "Follow-up coordination note from staff.",
      doctorInformation: "Doctor information snapshot placeholder.",
      createdAt: mockNowOffset(-4),
      reviewedAt: mockNowOffset(-3),
      reviewedByStaffName: "VCare Staff",
    },
  ];
}

export async function getAdminAnalyticsSummary(): Promise<AdminAnalyticsSummary> {
  return safeQuery(
    async () => {
      const [
        totalPrescriptions,
        pendingPrescriptionReviews,
        pendingInsuranceVerifications,
        totalBookings,
        totalReorderRequests,
        patientCount,
        doctorCount,
      ] = await Promise.all([
        prisma.prescription.count(),
        prisma.prescription.count({
          where: {
            status: {
              in: ["UPLOADED", "REVIEW_IN_PROGRESS"],
            },
          },
        }),
        prisma.insuranceRecord.count({
          where: {
            insuranceVerificationStatus: {
              in: ["SUBMITTED", "IN_REVIEW", "NEEDS_INFORMATION"],
            },
          },
        }),
        prisma.appointmentRequest.count(),
        prisma.order.count(),
        prisma.user.count({
          where: { role: "PATIENT" },
        }),
        prisma.doctor.count(),
      ]);

      return {
        totalPrescriptions,
        pendingPrescriptionReviews,
        pendingInsuranceVerifications,
        totalBookings,
        totalReorderRequests,
        patientCount,
        doctorCount,
      };
    },
    mockAnalytics(),
  );
}

export async function getPrescriptionReviewQueue(
  statusFilter: string | undefined,
): Promise<PrescriptionQueueItem[]> {
  const normalizedFilter = statusFilter?.toUpperCase();

  const rows = await safeQuery(
    async () => {
      const prescriptions = await prisma.prescription.findMany({
        where:
          normalizedFilter && normalizedFilter !== "ALL"
            ? {
                status: normalizedFilter as
                  | "UPLOADED"
                  | "REVIEW_IN_PROGRESS"
                  | "ACTIVE"
                  | "REJECTED"
                  | "EXPIRED"
                  | "ARCHIVED",
              }
            : undefined,
        include: {
          patientUser: {
            select: {
              fullName: true,
            },
          },
          reviewedByStaff: {
            select: {
              fullName: true,
            },
          },
          images: {
            select: { id: true },
          },
          dosageSchedules: {
            select: { id: true },
          },
        },
        orderBy: { uploadedPrescriptionAt: "desc" },
      });

      return prescriptions.map((item) => ({
        id: item.id,
        reference: item.prescriptionReference ?? item.id.slice(0, 8).toUpperCase(),
        patientName: item.patientUser.fullName,
        status: item.status,
        insuranceStatus: item.insuranceVerificationStatus,
        uploadedAt: item.uploadedPrescriptionAt,
        reviewedAt: item.reviewedAt,
        reviewedByStaffName: item.reviewedByStaff?.fullName ?? null,
        imageCount: item.images.length,
        scheduleCount: item.dosageSchedules.length,
        notes: item.notes,
      }));
    },
    mockPrescriptionQueue(),
  );

  if (!normalizedFilter || normalizedFilter === "ALL") {
    return rows;
  }

  return rows.filter((item) => item.status === normalizedFilter);
}

export async function getPrescriptionReviewDetail(
  prescriptionId: string,
): Promise<PrescriptionReviewDetail | null> {
  const fallback = mockPrescriptionDetail(prescriptionId);

  return safeQuery(
    async () => {
      const record = await prisma.prescription.findUnique({
        where: { id: prescriptionId },
        include: {
          patientUser: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
            },
          },
          reviewedByStaff: {
            select: { fullName: true },
          },
          images: true,
          dosageSchedules: {
            include: {
              medicine: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            orderBy: { createdAt: "asc" },
          },
        },
      });

      if (!record) {
        return null;
      }

      return {
        id: record.id,
        reference: record.prescriptionReference ?? record.id.slice(0, 8).toUpperCase(),
        patientName: record.patientUser.fullName,
        patientUserId: record.patientUser.id,
        patientEmail: record.patientUser.email,
        patientPhone: record.patientUser.phone,
        status: record.status,
        insuranceStatus: record.insuranceVerificationStatus,
        uploadedAt: record.uploadedPrescriptionAt,
        reviewedAt: record.reviewedAt,
        reviewedByStaffName: record.reviewedByStaff?.fullName ?? null,
        imageCount: record.images.length,
        scheduleCount: record.dosageSchedules.length,
        notes: record.notes,
        images: record.images,
        schedules: record.dosageSchedules.map((schedule) => ({
          id: schedule.id,
          medicineId: schedule.medicine.id,
          medicineName: schedule.medicine.name,
          dosageInstruction: schedule.dosageInstruction,
          timingLabel: schedule.timingLabel,
          timesPerDay: schedule.timesPerDay,
          startDate: schedule.startDate,
          endDate: schedule.endDate,
          status: schedule.status,
        })),
      };
    },
    fallback,
  );
}

export async function getInsuranceVerificationQueue(
  statusFilter: string | undefined,
): Promise<InsuranceQueueItem[]> {
  const normalizedFilter = statusFilter?.toUpperCase();

  const rows = await safeQuery(
    async () => {
      const records = await prisma.insuranceRecord.findMany({
        where:
          normalizedFilter && normalizedFilter !== "ALL"
            ? {
                insuranceVerificationStatus: normalizedFilter as
                  | "NOT_SUBMITTED"
                  | "SUBMITTED"
                  | "IN_REVIEW"
                  | "VERIFIED"
                  | "REJECTED"
                  | "NEEDS_INFORMATION"
                  | "CLOSED",
              }
            : undefined,
        include: {
          patientUser: {
            select: { fullName: true },
          },
          reviewedByStaff: {
            select: { fullName: true },
          },
          verifiedByStaff: {
            select: { fullName: true },
          },
          documents: {
            select: { id: true },
          },
          verificationNotes: {
            select: { id: true },
          },
        },
        orderBy: { submittedAt: "desc" },
      });

      return records.map((item) => ({
        id: item.id,
        patientName: item.patientUser.fullName,
        cardholderName: item.cardholderName,
        insuranceNumber: item.insuranceNumber,
        insuranceProviderName: item.insuranceProviderName,
        status: item.insuranceVerificationStatus,
        submittedAt: item.submittedAt,
        reviewedAt: item.reviewedAt,
        verifiedAt: item.verifiedAt,
        reviewedByStaffName: item.reviewedByStaff?.fullName ?? null,
        verifiedByStaffName: item.verifiedByStaff?.fullName ?? null,
        documentCount: item.documents.length,
        noteCount: item.verificationNotes.length,
      }));
    },
    mockInsuranceQueue(),
  );

  if (!normalizedFilter || normalizedFilter === "ALL") {
    return rows;
  }

  return rows.filter((item) => item.status === normalizedFilter);
}

export async function getPatientList(
  query: string | undefined,
): Promise<PatientListItem[]> {
  const normalizedQuery = query?.trim().toLowerCase() ?? "";

  const rows = await safeQuery(
    async () => {
      const users = await prisma.user.findMany({
        where: {
          role: "PATIENT",
          OR: normalizedQuery
            ? [
                { fullName: { contains: normalizedQuery, mode: "insensitive" } },
                { email: { contains: normalizedQuery, mode: "insensitive" } },
              ]
            : undefined,
        },
        include: {
          _count: {
            select: {
              patientPrescriptions: true,
              insuranceRecords: true,
              appointmentRequests: true,
              orders: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return users.map((user) => ({
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        createdAt: user.createdAt,
        prescriptionCount: user._count.patientPrescriptions,
        insuranceCount: user._count.insuranceRecords,
        appointmentCount: user._count.appointmentRequests,
        orderCount: user._count.orders,
      }));
    },
    mockPatientList(),
  );

  if (!normalizedQuery) {
    return rows;
  }

  return rows.filter(
    (item) =>
      item.fullName.toLowerCase().includes(normalizedQuery) ||
      item.email.toLowerCase().includes(normalizedQuery),
  );
}

export async function getPatientDetail(
  patientUserId: string,
): Promise<PatientDetailRecord | null> {
  const fallback = mockPatientDetail(patientUserId);

  return safeQuery(
    async () => {
      const user = await prisma.user.findFirst({
        where: {
          id: patientUserId,
          role: "PATIENT",
        },
        include: {
          patientPrescriptions: {
            orderBy: { uploadedPrescriptionAt: "desc" },
            select: {
              id: true,
              prescriptionReference: true,
              status: true,
              uploadedPrescriptionAt: true,
            },
          },
          insuranceRecords: {
            orderBy: { submittedAt: "desc" },
            select: {
              id: true,
              insuranceNumber: true,
              insuranceVerificationStatus: true,
              submittedAt: true,
            },
          },
          appointmentRequests: {
            orderBy: { requestedAt: "desc" },
            include: {
              doctor: { select: { fullName: true } },
              clinic: { select: { name: true } },
              hospital: { select: { name: true } },
            },
          },
          orders: {
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              status: true,
              fulfillmentMethod: true,
              createdAt: true,
            },
          },
          familyMembers: {
            select: {
              id: true,
              fullName: true,
              relationship: true,
            },
            orderBy: { createdAt: "desc" },
          },
          notifications: {
            take: 10,
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              title: true,
              status: true,
              createdAt: true,
            },
          },
        },
      });

      if (!user) {
        return null;
      }

      return {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        status: user.status,
        createdAt: user.createdAt,
        prescriptions: user.patientPrescriptions.map((item) => ({
          id: item.id,
          reference: item.prescriptionReference ?? item.id.slice(0, 8).toUpperCase(),
          status: item.status,
          uploadedAt: item.uploadedPrescriptionAt,
        })),
        insuranceRecords: user.insuranceRecords.map((item) => ({
          id: item.id,
          insuranceNumber: item.insuranceNumber,
          status: item.insuranceVerificationStatus,
          submittedAt: item.submittedAt,
        })),
        appointmentRequests: user.appointmentRequests.map((item) => ({
          id: item.id,
          status: item.status,
          requestedAt: item.requestedAt,
          doctorName: item.doctor?.fullName ?? null,
          clinicName: item.clinic?.name ?? null,
          hospitalName: item.hospital?.name ?? null,
        })),
        orders: user.orders.map((item) => ({
          id: item.id,
          status: item.status,
          fulfillmentMethod: item.fulfillmentMethod,
          createdAt: item.createdAt,
        })),
        familyMembers: user.familyMembers,
        notifications: user.notifications,
      };
    },
    fallback,
  );
}

export async function getMedicinePlanCreatorData(): Promise<MedicinePlanCreatorData> {
  return safeQuery(
    async () => {
      const [prescriptions, schedules] = await Promise.all([
        prisma.prescription.findMany({
          where: {
            status: {
              in: ["UPLOADED", "REVIEW_IN_PROGRESS", "ACTIVE"],
            },
          },
          include: {
            patientUser: {
              select: { fullName: true },
            },
            dosageSchedules: {
              select: { id: true },
            },
          },
          orderBy: { uploadedPrescriptionAt: "desc" },
        }),
        prisma.dosageSchedule.findMany({
          include: {
            medicine: {
              select: { name: true },
            },
            prescription: {
              select: {
                id: true,
                prescriptionReference: true,
                patientUser: {
                  select: { fullName: true },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 40,
        }),
      ]);

      return {
        reviewablePrescriptions: prescriptions.map((item) => ({
          id: item.id,
          reference: item.prescriptionReference ?? item.id.slice(0, 8).toUpperCase(),
          patientName: item.patientUser.fullName,
          status: item.status,
          scheduleCount: item.dosageSchedules.length,
        })),
        schedules: schedules.map((item) => ({
          id: item.id,
          prescriptionId: item.prescription.id,
          prescriptionReference:
            item.prescription.prescriptionReference ??
            item.prescription.id.slice(0, 8).toUpperCase(),
          patientName: item.prescription.patientUser.fullName,
          medicineName: item.medicine.name,
          timingLabel: item.timingLabel ?? "Timing pending",
          timesPerDay: item.timesPerDay ?? 1,
          status: item.status,
          startDate: item.startDate,
          endDate: item.endDate,
        })),
      };
    },
    mockMedicinePlanData(),
  );
}

export async function getOrdersManagement(
  statusFilter: string | undefined,
): Promise<OrderManagementItem[]> {
  const normalizedFilter = statusFilter?.toUpperCase();

  const rows = await safeQuery(
    async () => {
      const orders = await prisma.order.findMany({
        where:
          normalizedFilter && normalizedFilter !== "ALL"
            ? {
                status: normalizedFilter as
                  | "DRAFT"
                  | "SUBMITTED"
                  | "REVIEWED_BY_STAFF"
                  | "READY_FOR_PICKUP"
                  | "DELIVERED"
                  | "CANCELED",
              }
            : undefined,
        include: {
          patientUser: {
            select: { fullName: true },
          },
          reviewedByStaff: {
            select: { fullName: true },
          },
          prescription: {
            select: {
              id: true,
              prescriptionReference: true,
            },
          },
          medicine: {
            select: { name: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return orders.map((item) => ({
        id: item.id,
        orderNumber: item.orderNumber ?? item.id.slice(0, 8).toUpperCase(),
        patientName: item.patientUser.fullName,
        status: item.status,
        fulfillmentMethod: item.fulfillmentMethod,
        quantity: item.quantity,
        createdAt: item.createdAt,
        reviewedByStaffName: item.reviewedByStaff?.fullName ?? null,
        prescriptionReference:
          item.prescription?.prescriptionReference ??
          item.prescription?.id.slice(0, 8).toUpperCase() ??
          "-",
        medicineName: item.medicine?.name ?? "Prescription reorder",
      }));
    },
    mockOrders(),
  );

  if (!normalizedFilter || normalizedFilter === "ALL") {
    return rows;
  }

  return rows.filter((item) => item.status === normalizedFilter);
}

export async function getReminderManagementData(): Promise<ReminderItem[]> {
  return safeQuery(
    async () => {
      const cycles = await prisma.refillCycle.findMany({
        include: {
          medicine: {
            select: { name: true },
          },
          prescription: {
            select: {
              id: true,
              prescriptionReference: true,
              patientUser: {
                select: { fullName: true },
              },
            },
          },
        },
        orderBy: { nextRefillAt: "asc" },
      });

      return cycles.map((cycle) => {
        const reminder = toReminderState(cycle.nextRefillAt);

        return {
          refillCycleId: cycle.id,
          patientName: cycle.prescription.patientUser.fullName,
          prescriptionReference:
            cycle.prescription.prescriptionReference ??
            cycle.prescription.id.slice(0, 8).toUpperCase(),
          medicineName: cycle.medicine.name,
          cycleDays: cycle.cycleDays,
          status: cycle.status,
          nextRefillAt: cycle.nextRefillAt,
          reminderState: reminder.reminderState,
          daysRemaining: reminder.daysRemaining,
        };
      });
    },
    mockReminders(),
  );
}

export async function getDoctorManagementData(): Promise<DoctorManagementData> {
  return safeQuery(
    async () => {
      const [doctors, hospitals, clinics] = await Promise.all([
        prisma.doctor.findMany({
          include: {
            hospital: {
              select: {
                id: true,
                name: true,
              },
            },
            clinic: {
              select: {
                id: true,
                name: true,
              },
            },
            reviewSummary: {
              select: {
                averageRating: true,
                reviewCount: true,
              },
            },
            availabilitySlots: {
              where: {
                startsAt: {
                  gte: new Date(),
                },
                status: {
                  in: ["OPEN", "HELD"],
                },
              },
              orderBy: { startsAt: "asc" },
            },
          },
          orderBy: { fullName: "asc" },
        }),
        prisma.hospital.findMany({
          where: { status: "ACTIVE" },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        }),
        prisma.clinic.findMany({
          where: { status: "ACTIVE" },
          select: {
            id: true,
            name: true,
            hospitalId: true,
          },
          orderBy: { name: "asc" },
        }),
      ]);

      return {
        doctors: doctors.map((doctor) => ({
          id: doctor.id,
          fullName: doctor.fullName,
          specialty: doctor.specialty,
          status: doctor.status,
          doctorInformation: doctor.doctorInformation,
          consultationFeeNote: doctor.consultationFeeNote,
          profileImageUrl: doctor.profileImageUrl ?? seededAvatarUrl(`doctor-${doctor.id}`),
          yearsOfExperience: doctor.yearsOfExperience,
          clinicId: doctor.clinic?.id ?? null,
          clinicName: doctor.clinic?.name ?? null,
          hospitalId: doctor.hospital?.id ?? null,
          hospitalName: doctor.hospital?.name ?? null,
          ratingScore: doctor.reviewSummary?.averageRating ?? 0,
          reviewCount: doctor.reviewSummary?.reviewCount ?? 0,
          slotCount: doctor.availabilitySlots.length,
          nextSlotAt: doctor.availabilitySlots[0]?.startsAt ?? null,
        })),
        hospitalOptions: hospitals,
        clinicOptions: clinics,
      };
    },
    mockDoctorManagementData(),
  );
}

export async function getFacilityManagementData(): Promise<FacilityManagementData> {
  return safeQuery(
    async () => {
      const [hospitals, clinics] = await Promise.all([
        prisma.hospital.findMany({
          include: {
            _count: {
              select: {
                clinics: true,
                doctors: true,
              },
            },
          },
          orderBy: { name: "asc" },
        }),
        prisma.clinic.findMany({
          include: {
            hospital: {
              select: {
                name: true,
              },
            },
            _count: {
              select: {
                doctors: true,
              },
            },
          },
          orderBy: { name: "asc" },
        }),
      ]);

      return {
        hospitals: hospitals.map((item) => ({
          id: item.id,
          name: item.name,
          code: item.code,
          city: item.city,
          status: item.status,
          isBookingVisible: item.isBookingVisible,
          clinicCount: item._count.clinics,
          doctorCount: item._count.doctors,
        })),
        clinics: clinics.map((item) => ({
          id: item.id,
          name: item.name,
          code: item.code,
          city: item.city,
          status: item.status,
          isBookingVisible: item.isBookingVisible,
          hospitalId: item.hospitalId,
          hospitalName: item.hospital?.name ?? null,
          doctorCount: item._count.doctors,
        })),
      };
    },
    mockFacilityData(),
  );
}

export async function getConsultationNoteLog(): Promise<ConsultationNoteLogItem[]> {
  return safeQuery(
    async () => {
      const notes = await prisma.consultationNote.findMany({
        include: {
          patientUser: { select: { fullName: true } },
          doctor: { select: { fullName: true } },
          reviewedByStaff: { select: { fullName: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      return notes.map((item) => ({
        id: item.id,
        patientName: item.patientUser.fullName,
        doctorName: item.doctor?.fullName ?? null,
        summary: item.summary,
        doctorInformation: item.doctorInformation,
        createdAt: item.createdAt,
        reviewedAt: item.reviewedAt,
        reviewedByStaffName: item.reviewedByStaff?.fullName ?? null,
      }));
    },
    mockConsultationNotes(),
  );
}
