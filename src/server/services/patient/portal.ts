import { daysUntil, isSameDay } from "@/lib/date";
import { prisma } from "@/lib/prisma";
import { seededImageUrl } from "@/lib/random-data";

export type PrescriptionListItem = {
  id: string;
  reference: string;
  status: string;
  insuranceStatus: string;
  uploadedAt: Date;
  imageCount: number;
  scheduleCount: number;
  refillDueAt: Date | null;
};

export type PrescriptionDetail = {
  id: string;
  reference: string;
  status: string;
  insuranceStatus: string;
  uploadedAt: Date;
  notes: string | null;
  images: Array<{
    id: string;
    imageUrl: string;
    imageLabel: string | null;
    createdAt: Date;
  }>;
  schedules: Array<{
    id: string;
    medicineName: string;
    timingLabel: string | null;
    dosageInstruction: string | null;
    timesPerDay: number | null;
    startDate: Date | null;
    endDate: Date | null;
    lastTakenAt: Date | null;
    takenToday: boolean;
  }>;
  refillCycles: Array<{
    id: string;
    medicineName: string;
    nextRefillAt: Date | null;
    status: string;
    cycleDays: number;
  }>;
  orders: Array<{
    id: string;
    status: string;
    fulfillmentMethod: string;
    createdAt: Date;
    quantity: number | null;
  }>;
};

export type MedicineScheduleItem = {
  scheduleId: string;
  prescriptionId: string;
  prescriptionReference: string;
  medicineName: string;
  timingLabel: string;
  dosageInstruction: string | null;
  timesPerDay: number;
  startDate: Date | null;
  endDate: Date | null;
  lastTakenAt: Date | null;
  takenToday: boolean;
};

export type RefillAlertItem = {
  refillCycleId: string;
  prescriptionId: string;
  prescriptionReference: string;
  medicineId: string;
  medicineName: string;
  nextRefillAt: Date | null;
  alertState: "DUE_SOON" | "OVERDUE" | "TRACKING";
  daysRemaining: number | null;
  cycleDays: number;
};

export type OrderItem = {
  id: string;
  status: string;
  fulfillmentMethod: string;
  quantity: number | null;
  submittedAt: Date | null;
  createdAt: Date;
  medicineName: string;
  prescriptionReference: string;
};

export type FamilyMemberItem = {
  id: string;
  fullName: string;
  relationship: string;
  dateOfBirth: Date | null;
  phone: string | null;
  createdAt: Date;
};

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  status: string;
  channel: string;
  createdAt: Date;
  readAt: Date | null;
};

export type PatientSettings = {
  fullName: string;
  email: string;
  phone: string;
  locale: string;
};

export type PatientDashboardSummary = {
  prescriptionCount: number;
  activeScheduleCount: number;
  refillDueCount: number;
  orderCount: number;
  notificationUnreadCount: number;
};

const MOCK_PRESCRIPTION_ID = "c123456789012345678901234";
const MOCK_IMAGE_ID = "c123456789012345678901235";
const MOCK_SCHEDULE_ONE_ID = "c123456789012345678901236";
const MOCK_SCHEDULE_TWO_ID = "c123456789012345678901237";
const MOCK_REFILL_ID = "c123456789012345678901238";
const MOCK_MEDICINE_ID = "c123456789012345678901239";
const MOCK_ORDER_ID = "c123456789012345678901240";

function mockNowOffset(days = 0): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function mockPrescriptions(): PrescriptionListItem[] {
  return [
    {
      id: MOCK_PRESCRIPTION_ID,
      reference: "VC-MOCK-0001",
      status: "UPLOADED",
      insuranceStatus: "SUBMITTED",
      uploadedAt: mockNowOffset(-2),
      imageCount: 1,
      scheduleCount: 2,
      refillDueAt: mockNowOffset(4),
    },
  ];
}

function mockPrescriptionDetail(): PrescriptionDetail {
  return {
    id: MOCK_PRESCRIPTION_ID,
    reference: "VC-MOCK-0001",
    status: "UPLOADED",
    insuranceStatus: "SUBMITTED",
    uploadedAt: mockNowOffset(-2),
    notes: "Uploaded prescription-based schedule placeholder.",
    images: [
      {
        id: MOCK_IMAGE_ID,
        imageUrl: seededImageUrl("mock-prescription-image-1"),
        imageLabel: "uploaded-prescription.jpg",
        createdAt: mockNowOffset(-2),
      },
    ],
    schedules: [
      {
        id: MOCK_SCHEDULE_ONE_ID,
        medicineName: "Uploaded Medicine A",
        timingLabel: "08:00 and 20:00",
        dosageInstruction: "Schedule created from uploaded prescription.",
        timesPerDay: 2,
        startDate: mockNowOffset(-2),
        endDate: mockNowOffset(28),
        lastTakenAt: mockNowOffset(-0.3),
        takenToday: true,
      },
      {
        id: MOCK_SCHEDULE_TWO_ID,
        medicineName: "Uploaded Medicine B",
        timingLabel: "13:00",
        dosageInstruction: "Schedule created from uploaded prescription.",
        timesPerDay: 1,
        startDate: mockNowOffset(-2),
        endDate: mockNowOffset(12),
        lastTakenAt: null,
        takenToday: false,
      },
    ],
    refillCycles: [
      {
        id: MOCK_REFILL_ID,
        medicineName: "Uploaded Medicine A",
        nextRefillAt: mockNowOffset(4),
        status: "TRACKING",
        cycleDays: 30,
      },
    ],
    orders: [
      {
        id: MOCK_ORDER_ID,
        status: "SUBMITTED",
        fulfillmentMethod: "PICKUP",
        createdAt: mockNowOffset(-1),
        quantity: 1,
      },
    ],
  };
}

function mockNotifications(): NotificationItem[] {
  return [
    {
      id: "mock-notification-1",
      title: "Prescription uploaded",
      body: "Your uploaded prescription was added to your account.",
      status: "SENT",
      channel: "IN_APP",
      createdAt: mockNowOffset(-1),
      readAt: null,
    },
    {
      id: "mock-notification-2",
      title: "Medicine schedule available",
      body: "A staff-created or uploaded-prescription-based schedule is now visible.",
      status: "SENT",
      channel: "IN_APP",
      createdAt: mockNowOffset(-1),
      readAt: mockNowOffset(-0.8),
    },
    {
      id: "mock-notification-3",
      title: "Refill reminder state",
      body: "One medicine is due for refill in 4 days.",
      status: "SENT",
      channel: "IN_APP",
      createdAt: mockNowOffset(-0.4),
      readAt: null,
    },
  ];
}

async function safeQuery<T>(query: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await query();
  } catch {
    return fallback;
  }
}

export async function getPatientDashboardSummary(
  patientUserId: string,
): Promise<PatientDashboardSummary> {
  return safeQuery(
    async () => {
      const [prescriptionCount, activeScheduleCount, orderCount, unreadCount, refillCycles] =
        await Promise.all([
          prisma.prescription.count({ where: { patientUserId } }),
          prisma.dosageSchedule.count({
            where: {
              prescription: { patientUserId },
              status: "ACTIVE",
            },
          }),
          prisma.order.count({ where: { patientUserId } }),
          prisma.notification.count({
            where: {
              userId: patientUserId,
              readAt: null,
            },
          }),
          prisma.refillCycle.findMany({
            where: {
              prescription: { patientUserId },
            },
            select: {
              nextRefillAt: true,
            },
          }),
        ]);

      const refillDueCount = refillCycles.filter((cycle) => {
        if (!cycle.nextRefillAt) {
          return false;
        }

        return daysUntil(cycle.nextRefillAt) <= 5;
      }).length;

      return {
        prescriptionCount,
        activeScheduleCount,
        refillDueCount,
        orderCount,
        notificationUnreadCount: unreadCount,
      };
    },
    {
      prescriptionCount: 1,
      activeScheduleCount: 2,
      refillDueCount: 1,
      orderCount: 1,
      notificationUnreadCount: 2,
    },
  );
}

export async function getPatientPrescriptions(
  patientUserId: string,
): Promise<PrescriptionListItem[]> {
  const data = await safeQuery(
    async () => {
      const prescriptions = await prisma.prescription.findMany({
        where: { patientUserId },
        include: {
          images: { select: { id: true } },
          dosageSchedules: { select: { id: true } },
          refillCycles: {
            orderBy: { nextRefillAt: "asc" },
            select: { nextRefillAt: true },
          },
        },
        orderBy: { uploadedPrescriptionAt: "desc" },
      });

      return prescriptions.map((item) => ({
        id: item.id,
        reference: item.prescriptionReference ?? item.id.slice(0, 8).toUpperCase(),
        status: item.status,
        insuranceStatus: item.insuranceVerificationStatus,
        uploadedAt: item.uploadedPrescriptionAt,
        imageCount: item.images.length,
        scheduleCount: item.dosageSchedules.length,
        refillDueAt: item.refillCycles[0]?.nextRefillAt ?? null,
      }));
    },
    mockPrescriptions(),
  );

  return data.length ? data : [];
}

export async function getPatientPrescriptionDetail(
  patientUserId: string,
  prescriptionId: string,
): Promise<PrescriptionDetail | null> {
  const fallback = prescriptionId === MOCK_PRESCRIPTION_ID ? mockPrescriptionDetail() : null;

  return safeQuery(
    async () => {
      const record = await prisma.prescription.findFirst({
        where: {
          id: prescriptionId,
          patientUserId,
        },
        include: {
          images: true,
          dosageSchedules: {
            include: {
              medicine: { select: { name: true } },
              intakeLogs: {
                where: { patientUserId },
                orderBy: { intakeAt: "desc" },
                take: 1,
              },
            },
            orderBy: { createdAt: "asc" },
          },
          refillCycles: {
            include: {
              medicine: { select: { name: true } },
            },
            orderBy: { nextRefillAt: "asc" },
          },
          orders: {
            orderBy: { createdAt: "desc" },
            take: 6,
          },
        },
      });

      if (!record) {
        return null;
      }

      return {
        id: record.id,
        reference: record.prescriptionReference ?? record.id.slice(0, 8).toUpperCase(),
        status: record.status,
        insuranceStatus: record.insuranceVerificationStatus,
        uploadedAt: record.uploadedPrescriptionAt,
        notes: record.notes,
        images: record.images,
        schedules: record.dosageSchedules.map((schedule) => {
          const lastTakenAt = schedule.intakeLogs[0]?.intakeAt ?? null;

          return {
            id: schedule.id,
            medicineName: schedule.medicine.name,
            timingLabel: schedule.timingLabel,
            dosageInstruction: schedule.dosageInstruction,
            timesPerDay: schedule.timesPerDay,
            startDate: schedule.startDate,
            endDate: schedule.endDate,
            lastTakenAt,
            takenToday: lastTakenAt ? isSameDay(lastTakenAt, new Date()) : false,
          };
        }),
        refillCycles: record.refillCycles.map((cycle) => ({
          id: cycle.id,
          medicineName: cycle.medicine.name,
          nextRefillAt: cycle.nextRefillAt,
          status: cycle.status,
          cycleDays: cycle.cycleDays,
        })),
        orders: record.orders.map((order) => ({
          id: order.id,
          status: order.status,
          fulfillmentMethod: order.fulfillmentMethod,
          createdAt: order.createdAt,
          quantity: order.quantity,
        })),
      };
    },
    fallback,
  );
}

export async function getPatientMedicineSchedule(
  patientUserId: string,
): Promise<MedicineScheduleItem[]> {
  return safeQuery(
    async () => {
      const schedules = await prisma.dosageSchedule.findMany({
        where: {
          prescription: { patientUserId },
          status: "ACTIVE",
        },
        include: {
          medicine: { select: { name: true } },
          prescription: {
            select: {
              id: true,
              prescriptionReference: true,
            },
          },
          intakeLogs: {
            where: { patientUserId },
            orderBy: { intakeAt: "desc" },
            take: 1,
          },
        },
        orderBy: { createdAt: "asc" },
      });

      return schedules.map((schedule) => {
        const lastTakenAt = schedule.intakeLogs[0]?.intakeAt ?? null;

        return {
          scheduleId: schedule.id,
          prescriptionId: schedule.prescription.id,
          prescriptionReference:
            schedule.prescription.prescriptionReference ??
            schedule.prescription.id.slice(0, 8).toUpperCase(),
          medicineName: schedule.medicine.name,
          timingLabel: schedule.timingLabel ?? "Timing pending staff review",
          dosageInstruction: schedule.dosageInstruction,
          timesPerDay: schedule.timesPerDay ?? 1,
          startDate: schedule.startDate,
          endDate: schedule.endDate,
          lastTakenAt,
          takenToday: lastTakenAt ? isSameDay(lastTakenAt, new Date()) : false,
        };
      });
    },
    mockPrescriptionDetail().schedules.map((schedule, index) => ({
      scheduleId: schedule.id,
      prescriptionId: MOCK_PRESCRIPTION_ID,
      prescriptionReference: "VC-MOCK-0001",
      medicineName: schedule.medicineName,
      timingLabel: schedule.timingLabel ?? "Pending",
      dosageInstruction: schedule.dosageInstruction,
      timesPerDay: schedule.timesPerDay ?? 1,
      startDate: schedule.startDate,
      endDate: schedule.endDate,
      lastTakenAt: schedule.lastTakenAt,
      takenToday: index === 0,
    })),
  );
}

function toAlertState(nextRefillAt: Date | null): {
  state: "DUE_SOON" | "OVERDUE" | "TRACKING";
  daysRemaining: number | null;
} {
  if (!nextRefillAt) {
    return {
      state: "TRACKING",
      daysRemaining: null,
    };
  }

  const remaining = daysUntil(nextRefillAt);

  if (remaining < 0) {
    return {
      state: "OVERDUE",
      daysRemaining: remaining,
    };
  }

  if (remaining <= 5) {
    return {
      state: "DUE_SOON",
      daysRemaining: remaining,
    };
  }

  return {
    state: "TRACKING",
    daysRemaining: remaining,
  };
}

export async function getPatientRefillAlerts(
  patientUserId: string,
): Promise<RefillAlertItem[]> {
  return safeQuery(
    async () => {
      const cycles = await prisma.refillCycle.findMany({
        where: {
          prescription: { patientUserId },
        },
        include: {
          medicine: { select: { id: true, name: true } },
          prescription: {
            select: {
              id: true,
              prescriptionReference: true,
            },
          },
        },
        orderBy: { nextRefillAt: "asc" },
      });

      return cycles.map((cycle) => {
        const alertMeta = toAlertState(cycle.nextRefillAt);

        return {
          refillCycleId: cycle.id,
          prescriptionId: cycle.prescription.id,
          prescriptionReference:
            cycle.prescription.prescriptionReference ??
            cycle.prescription.id.slice(0, 8).toUpperCase(),
          medicineId: cycle.medicine.id,
          medicineName: cycle.medicine.name,
          nextRefillAt: cycle.nextRefillAt,
          alertState: alertMeta.state,
          daysRemaining: alertMeta.daysRemaining,
          cycleDays: cycle.cycleDays,
        };
      });
    },
    [
      {
        refillCycleId: MOCK_REFILL_ID,
        prescriptionId: MOCK_PRESCRIPTION_ID,
        prescriptionReference: "VC-MOCK-0001",
        medicineId: MOCK_MEDICINE_ID,
        medicineName: "Uploaded Medicine A",
        nextRefillAt: mockNowOffset(4),
        alertState: "DUE_SOON",
        daysRemaining: 4,
        cycleDays: 30,
      },
    ],
  );
}

export async function getPatientOrders(patientUserId: string): Promise<OrderItem[]> {
  return safeQuery(
    async () => {
      const orders = await prisma.order.findMany({
        where: { patientUserId },
        include: {
          medicine: { select: { name: true } },
          prescription: {
            select: {
              id: true,
              prescriptionReference: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return orders.map((order) => ({
        id: order.id,
        status: order.status,
        fulfillmentMethod: order.fulfillmentMethod,
        quantity: order.quantity,
        submittedAt: order.submittedAt,
        createdAt: order.createdAt,
        medicineName: order.medicine?.name ?? "Prescription reorder",
        prescriptionReference:
          order.prescription?.prescriptionReference ??
          order.prescription?.id.slice(0, 8).toUpperCase() ??
          "-",
      }));
    },
    [
      {
        id: MOCK_ORDER_ID,
        status: "SUBMITTED",
        fulfillmentMethod: "PICKUP",
        quantity: 1,
        submittedAt: mockNowOffset(-1),
        createdAt: mockNowOffset(-1),
        medicineName: "Uploaded Medicine A",
        prescriptionReference: "VC-MOCK-0001",
      },
    ],
  );
}

export async function getPatientFamilyMembers(
  patientUserId: string,
): Promise<FamilyMemberItem[]> {
  return safeQuery(
    async () => {
      return prisma.familyMember.findMany({
        where: { patientUserId },
        orderBy: { createdAt: "desc" },
      });
    },
    [],
  );
}

export async function getPatientNotifications(
  patientUserId: string,
): Promise<NotificationItem[]> {
  const data = await safeQuery(
    async () => {
      return prisma.notification.findMany({
        where: { userId: patientUserId },
        orderBy: { createdAt: "desc" },
        take: 20,
      });
    },
    mockNotifications(),
  );

  return data.length ? data : mockNotifications();
}

export async function getPatientSettings(
  patientUserId: string,
): Promise<PatientSettings> {
  return safeQuery(
    async () => {
      const user = await prisma.user.findUnique({
        where: { id: patientUserId },
        select: {
          fullName: true,
          email: true,
          phone: true,
          locale: true,
        },
      });

      if (!user) {
        return {
          fullName: "Patient User",
          email: "patient@example.com",
          phone: "",
          locale: "vi-VN",
        };
      }

      return {
        fullName: user.fullName,
        email: user.email,
        phone: user.phone ?? "",
        locale: user.locale,
      };
    },
    {
      fullName: "Patient User",
      email: "patient@example.com",
      phone: "",
      locale: "vi-VN",
    },
  );
}
