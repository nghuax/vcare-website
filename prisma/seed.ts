import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { createRandomDoctorProfile, seededImageUrl } from "../src/lib/random-data";

const prisma = new PrismaClient();

type SeedDoctor = {
  licenseNumber: string;
  fullName: string;
  specialty: string;
  doctorInformation: string;
  consultationFeeNote: string;
  profileImageUrl: string;
  yearsOfExperience: number;
  hospitalCode: string;
  clinicCode: string;
  reviewSummary: {
    averageRating: number;
    reviewCount: number;
    punctuality: number;
    communication: number;
    supportiveness: number;
  };
  slots: Array<{
    dayOffset: number;
    startHour: number;
    startMinute?: number;
    durationMinutes?: number;
  }>;
};

type SeedDoctorBase = {
  licenseNumber: string;
  hospitalCode: string;
  clinicCode: string;
  slots: SeedDoctor["slots"];
};

const hospitals = [
  {
    code: "VC-HCM-001",
    name: "VCare Partner Hospital",
    city: "Ho Chi Minh City",
    addressLine: "123 Nguyen Hue, District 1",
  },
  {
    code: "VC-HN-001",
    name: "VCare North General Hospital",
    city: "Hanoi",
    addressLine: "45 Tran Hung Dao, Hoan Kiem",
  },
];

const clinics = [
  {
    code: "VC-CLINIC-001",
    name: "VCare Coordination Clinic",
    city: "Ho Chi Minh City",
    addressLine: "12 Le Loi, District 1",
    hospitalCode: "VC-HCM-001",
  },
  {
    code: "VC-CLINIC-002",
    name: "VCare Family Clinic District 7",
    city: "Ho Chi Minh City",
    addressLine: "90 Nguyen Thi Thap, District 7",
    hospitalCode: "VC-HCM-001",
  },
  {
    code: "VC-CLINIC-003",
    name: "VCare Hanoi Outpatient Clinic",
    city: "Hanoi",
    addressLine: "88 Ly Thuong Kiet, Hoan Kiem",
    hospitalCode: "VC-HN-001",
  },
];

const doctorSeeds: SeedDoctorBase[] = [
  {
    licenseNumber: "VC-DR-0001",
    hospitalCode: "VC-HCM-001",
    clinicCode: "VC-CLINIC-001",
    slots: [
      { dayOffset: 1, startHour: 9, durationMinutes: 45 },
      { dayOffset: 1, startHour: 10, durationMinutes: 45 },
      { dayOffset: 2, startHour: 14, durationMinutes: 45 },
    ],
  },
  {
    licenseNumber: "VC-DR-0002",
    hospitalCode: "VC-HCM-001",
    clinicCode: "VC-CLINIC-002",
    slots: [
      { dayOffset: 1, startHour: 13, durationMinutes: 45 },
      { dayOffset: 3, startHour: 9, startMinute: 30, durationMinutes: 45 },
      { dayOffset: 4, startHour: 15, durationMinutes: 45 },
    ],
  },
  {
    licenseNumber: "VC-DR-0003",
    hospitalCode: "VC-HN-001",
    clinicCode: "VC-CLINIC-003",
    slots: [
      { dayOffset: 2, startHour: 10, durationMinutes: 45 },
      { dayOffset: 3, startHour: 11, durationMinutes: 45 },
      { dayOffset: 5, startHour: 16, durationMinutes: 45 },
    ],
  },
];

const doctors: SeedDoctor[] = doctorSeeds.map((doctorSeed, index) => {
  const randomDoctor = createRandomDoctorProfile(`seed-doctor-${index + 1}`);
  const averageRating = Number(randomDoctor.ratingScore.toFixed(1));

  return {
    ...doctorSeed,
    fullName: randomDoctor.fullName,
    specialty: randomDoctor.specialty,
    doctorInformation: randomDoctor.doctorInformation,
    consultationFeeNote: randomDoctor.consultationFeeNote,
    profileImageUrl: randomDoctor.profileImageUrl,
    yearsOfExperience: randomDoctor.yearsOfExperience,
    reviewSummary: {
      averageRating,
      reviewCount: randomDoctor.reviewCount,
      punctuality: Math.max(3.8, Number((averageRating - 0.2).toFixed(1))),
      communication: Math.min(5, Number((averageRating + 0.1).toFixed(1))),
      supportiveness: averageRating,
    },
  };
});

function createSlotDate(dayOffset: number, hour: number, minute = 0): Date {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, minute, 0, 0);
  return date;
}

async function upsertInsuranceRecordByNumber(params: {
  patientUserId: string;
  insuranceNumber: string;
  insuranceProviderName: string;
  cardholderName: string;
  registeredHospitalName?: string;
  insuranceExpiryDate?: Date;
  insuranceVerificationStatus: "SUBMITTED" | "VERIFIED" | "REJECTED";
  reviewedByStaffId?: string;
  verifiedByStaffId?: string;
  submittedAt: Date;
  reviewedAt?: Date;
  verifiedAt?: Date;
}) {
  const existing = await prisma.insuranceRecord.findFirst({
    where: {
      patientUserId: params.patientUserId,
      insuranceNumber: params.insuranceNumber,
    },
    select: { id: true },
  });

  const baseData = {
    patientUserId: params.patientUserId,
    insuranceProviderName: params.insuranceProviderName,
    cardholderName: params.cardholderName,
    insuranceNumber: params.insuranceNumber,
    registeredHospitalName: params.registeredHospitalName ?? null,
    insuranceExpiryDate: params.insuranceExpiryDate ?? null,
    insuranceVerificationStatus: params.insuranceVerificationStatus,
    reviewedByStaffId: params.reviewedByStaffId ?? null,
    verifiedByStaffId: params.verifiedByStaffId ?? null,
    submittedAt: params.submittedAt,
    reviewedAt: params.reviewedAt ?? null,
    verifiedAt: params.verifiedAt ?? null,
  };

  if (!existing) {
    return prisma.insuranceRecord.create({ data: baseData });
  }

  return prisma.insuranceRecord.update({
    where: { id: existing.id },
    data: baseData,
  });
}

async function ensureInsuranceDocument(params: {
  insuranceRecordId: string;
  uploadedByUserId: string;
  documentType: "CARD_FRONT" | "CARD_BACK" | "SUPPORTING_DOCUMENT";
  fileName: string;
  fileUrl: string;
}) {
  const existing = await prisma.insuranceDocument.findFirst({
    where: {
      insuranceRecordId: params.insuranceRecordId,
      fileName: params.fileName,
    },
    select: { id: true },
  });

  if (!existing) {
    await prisma.insuranceDocument.create({
      data: {
        insuranceRecordId: params.insuranceRecordId,
        uploadedByUserId: params.uploadedByUserId,
        documentType: params.documentType,
        fileName: params.fileName,
        fileUrl: params.fileUrl,
      },
    });
    return;
  }

  await prisma.insuranceDocument.update({
    where: { id: existing.id },
    data: {
      documentType: params.documentType,
      fileUrl: params.fileUrl,
    },
  });
}

async function ensurePrescriptionImage(params: {
  prescriptionId: string;
  uploadedByUserId: string;
  imageLabel: string;
  imageUrl: string;
}) {
  const existing = await prisma.prescriptionImage.findFirst({
    where: {
      prescriptionId: params.prescriptionId,
      imageLabel: params.imageLabel,
    },
    select: { id: true },
  });

  if (!existing) {
    await prisma.prescriptionImage.create({
      data: {
        prescriptionId: params.prescriptionId,
        uploadedByUserId: params.uploadedByUserId,
        imageLabel: params.imageLabel,
        imageUrl: params.imageUrl,
      },
    });
    return;
  }

  await prisma.prescriptionImage.update({
    where: { id: existing.id },
    data: {
      imageUrl: params.imageUrl,
    },
  });
}

async function ensureVerificationNote(params: {
  insuranceRecordId: string;
  createdByStaffId: string;
  note: string;
  isPatientVisible: boolean;
}) {
  const existing = await prisma.insuranceVerificationNote.findFirst({
    where: {
      insuranceRecordId: params.insuranceRecordId,
      note: params.note,
    },
    select: { id: true },
  });

  if (existing) {
    await prisma.insuranceVerificationNote.update({
      where: { id: existing.id },
      data: {
        isPatientVisible: params.isPatientVisible,
      },
    });
    return;
  }

  await prisma.insuranceVerificationNote.create({
    data: {
      insuranceRecordId: params.insuranceRecordId,
      createdByStaffId: params.createdByStaffId,
      note: params.note,
      isPatientVisible: params.isPatientVisible,
    },
  });
}

async function ensureNotification(params: {
  userId: string;
  title: string;
  body: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
}) {
  const existing = await prisma.notification.findFirst({
    where: {
      userId: params.userId,
      title: params.title,
      relatedEntityType: params.relatedEntityType ?? null,
      relatedEntityId: params.relatedEntityId ?? null,
    },
    select: { id: true },
  });

  if (existing) {
    await prisma.notification.update({
      where: { id: existing.id },
      data: {
        body: params.body,
        channel: "IN_APP",
        status: "SENT",
        sentAt: new Date(),
      },
    });
    return;
  }

  await prisma.notification.create({
    data: {
      userId: params.userId,
      title: params.title,
      body: params.body,
      channel: "IN_APP",
      status: "SENT",
      sentAt: new Date(),
      relatedEntityType: params.relatedEntityType ?? null,
      relatedEntityId: params.relatedEntityId ?? null,
    },
  });
}

async function main() {
  const defaultPassword = process.env.SEED_DEFAULT_PASSWORD ?? "ChangeMe123!";
  const passwordHash = await hash(defaultPassword, 12);

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@vcare.vn" },
    update: {
      fullName: "VCare Admin",
      role: "ADMIN",
      status: "ACTIVE",
      passwordHash,
    },
    create: {
      email: "admin@vcare.vn",
      fullName: "VCare Admin",
      role: "ADMIN",
      status: "ACTIVE",
      passwordHash,
    },
  });

  const staffUser = await prisma.user.upsert({
    where: { email: "staff@vcare.vn" },
    update: {
      fullName: "VCare Staff",
      role: "STAFF",
      status: "ACTIVE",
      passwordHash,
    },
    create: {
      email: "staff@vcare.vn",
      fullName: "VCare Staff",
      role: "STAFF",
      status: "ACTIVE",
      passwordHash,
    },
  });

  const patientUser = await prisma.user.upsert({
    where: { email: "patient@vcare.vn" },
    update: {
      fullName: "VCare Patient",
      role: "PATIENT",
      status: "ACTIVE",
      passwordHash,
    },
    create: {
      email: "patient@vcare.vn",
      fullName: "VCare Patient",
      role: "PATIENT",
      status: "ACTIVE",
      passwordHash,
    },
  });

  const additionalPatientUsers = await Promise.all([
    prisma.user.upsert({
      where: { email: "patient2@vcare.vn" },
      update: {
        fullName: "Nguyen Van A",
        role: "PATIENT",
        status: "ACTIVE",
        passwordHash,
      },
      create: {
        email: "patient2@vcare.vn",
        fullName: "Nguyen Van A",
        role: "PATIENT",
        status: "ACTIVE",
        passwordHash,
      },
    }),
    prisma.user.upsert({
      where: { email: "patient3@vcare.vn" },
      update: {
        fullName: "Tran Thi B",
        role: "PATIENT",
        status: "ACTIVE",
        passwordHash,
      },
      create: {
        email: "patient3@vcare.vn",
        fullName: "Tran Thi B",
        role: "PATIENT",
        status: "ACTIVE",
        passwordHash,
      },
    }),
  ]);

  await prisma.staffUser.upsert({
    where: { userId: adminUser.id },
    update: {
      staffRole: "ADMINISTRATOR",
      department: "Operations",
      isActive: true,
    },
    create: {
      userId: adminUser.id,
      staffCode: "VC-ADM-001",
      staffRole: "ADMINISTRATOR",
      department: "Operations",
      isActive: true,
    },
  });

  await prisma.staffUser.upsert({
    where: { userId: staffUser.id },
    update: {
      staffRole: "CARE_COORDINATOR",
      department: "Patient Support",
      isActive: true,
    },
    create: {
      userId: staffUser.id,
      staffCode: "VC-STF-001",
      staffRole: "CARE_COORDINATOR",
      department: "Patient Support",
      isActive: true,
    },
  });

  const hospitalByCode = new Map<string, { id: string; name: string }>();

  for (const hospitalSeed of hospitals) {
    const hospital = await prisma.hospital.upsert({
      where: { code: hospitalSeed.code },
      update: {
        name: hospitalSeed.name,
        city: hospitalSeed.city,
        addressLine: hospitalSeed.addressLine,
        status: "ACTIVE",
        isBookingVisible: true,
      },
      create: {
        code: hospitalSeed.code,
        name: hospitalSeed.name,
        city: hospitalSeed.city,
        addressLine: hospitalSeed.addressLine,
        status: "ACTIVE",
        isBookingVisible: true,
      },
    });

    hospitalByCode.set(hospitalSeed.code, { id: hospital.id, name: hospital.name });
  }

  const clinicByCode = new Map<string, { id: string; name: string; hospitalId: string | null }>();

  for (const clinicSeed of clinics) {
    const linkedHospital = hospitalByCode.get(clinicSeed.hospitalCode);

    const clinic = await prisma.clinic.upsert({
      where: { code: clinicSeed.code },
      update: {
        name: clinicSeed.name,
        city: clinicSeed.city,
        addressLine: clinicSeed.addressLine,
        hospitalId: linkedHospital?.id ?? null,
        status: "ACTIVE",
        isBookingVisible: true,
      },
      create: {
        code: clinicSeed.code,
        name: clinicSeed.name,
        city: clinicSeed.city,
        addressLine: clinicSeed.addressLine,
        hospitalId: linkedHospital?.id ?? null,
        status: "ACTIVE",
        isBookingVisible: true,
      },
    });

    clinicByCode.set(clinicSeed.code, {
      id: clinic.id,
      name: clinic.name,
      hospitalId: clinic.hospitalId,
    });
  }

  const seededDoctors = await Promise.all(
    doctors.map(async (doctorSeed) => {
      const hospital = hospitalByCode.get(doctorSeed.hospitalCode);
      const clinic = clinicByCode.get(doctorSeed.clinicCode);

      const doctor = await prisma.doctor.upsert({
        where: { licenseNumber: doctorSeed.licenseNumber },
        update: {
          fullName: doctorSeed.fullName,
          specialty: doctorSeed.specialty,
          clinicId: clinic?.id ?? null,
          hospitalId: hospital?.id ?? null,
          status: "ACTIVE",
          doctorInformation: doctorSeed.doctorInformation,
          consultationFeeNote: doctorSeed.consultationFeeNote,
          profileImageUrl: doctorSeed.profileImageUrl,
          yearsOfExperience: doctorSeed.yearsOfExperience,
        },
        create: {
          licenseNumber: doctorSeed.licenseNumber,
          fullName: doctorSeed.fullName,
          specialty: doctorSeed.specialty,
          clinicId: clinic?.id ?? null,
          hospitalId: hospital?.id ?? null,
          status: "ACTIVE",
          doctorInformation: doctorSeed.doctorInformation,
          consultationFeeNote: doctorSeed.consultationFeeNote,
          profileImageUrl: doctorSeed.profileImageUrl,
          yearsOfExperience: doctorSeed.yearsOfExperience,
        },
      });

      await prisma.doctorReviewSummary.upsert({
        where: { doctorId: doctor.id },
        update: doctorSeed.reviewSummary,
        create: {
          doctorId: doctor.id,
          ...doctorSeed.reviewSummary,
        },
      });

      for (const slotSeed of doctorSeed.slots) {
        const startsAt = createSlotDate(
          slotSeed.dayOffset,
          slotSeed.startHour,
          slotSeed.startMinute ?? 0,
        );

        const endsAt = new Date(
          startsAt.getTime() + (slotSeed.durationMinutes ?? 45) * 60 * 1000,
        );

        await prisma.doctorAvailabilitySlot.upsert({
          where: {
            doctorId_startsAt: {
              doctorId: doctor.id,
              startsAt,
            },
          },
          update: {
            clinicId: doctor.clinicId,
            endsAt,
            status: "OPEN",
          },
          create: {
            doctorId: doctor.id,
            clinicId: doctor.clinicId,
            startsAt,
            endsAt,
            status: "OPEN",
          },
        });
      }

      return doctor;
    }),
  );

  const medicine = await prisma.medicine.upsert({
    where: { code: "VC-MED-001" },
    update: {
      name: "Metformin 500mg",
      dosageForm: "Tablet",
      status: "ACTIVE",
    },
    create: {
      code: "VC-MED-001",
      name: "Metformin 500mg",
      dosageForm: "Tablet",
      status: "ACTIVE",
    },
  });

  const fallbackHospitalId = hospitalByCode.get("VC-HCM-001")?.id ?? null;
  const fallbackClinicId = clinicByCode.get("VC-CLINIC-001")?.id ?? null;
  const fallbackDoctorId = seededDoctors[0]?.id ?? null;

  const prescription = await prisma.prescription.upsert({
    where: { prescriptionReference: "VC-RX-0001" },
    update: {
      patientUserId: patientUser.id,
      uploadedByUserId: patientUser.id,
      reviewedByStaffId: staffUser.id,
      clinicId: fallbackClinicId,
      hospitalId: fallbackHospitalId,
      doctorId: fallbackDoctorId,
      status: "REVIEW_IN_PROGRESS",
      insuranceVerificationStatus: "SUBMITTED",
      reviewedAt: new Date(),
      notes: "Seed placeholder uploaded prescription record.",
    },
    create: {
      prescriptionReference: "VC-RX-0001",
      patientUserId: patientUser.id,
      uploadedByUserId: patientUser.id,
      reviewedByStaffId: staffUser.id,
      clinicId: fallbackClinicId,
      hospitalId: fallbackHospitalId,
      doctorId: fallbackDoctorId,
      status: "REVIEW_IN_PROGRESS",
      insuranceVerificationStatus: "SUBMITTED",
      reviewedAt: new Date(),
      notes: "Seed placeholder uploaded prescription record.",
    },
  });

  await ensurePrescriptionImage({
    prescriptionId: prescription.id,
    uploadedByUserId: patientUser.id,
    imageLabel: "seed-prescription-main.jpg",
    imageUrl: seededImageUrl(`prescription-${prescription.id}-main`, 1200, 760),
  });

  await prisma.dosageSchedule.upsert({
    where: {
      prescriptionId_medicineId: {
        prescriptionId: prescription.id,
        medicineId: medicine.id,
      },
    },
    update: {
      dosageInstruction: "Take after meals.",
      timesPerDay: 2,
      timingLabel: "Morning and Evening",
      status: "ACTIVE",
    },
    create: {
      prescriptionId: prescription.id,
      medicineId: medicine.id,
      dosageInstruction: "Take after meals.",
      timesPerDay: 2,
      timingLabel: "Morning and Evening",
      status: "ACTIVE",
    },
  });

  await prisma.refillCycle.upsert({
    where: {
      prescriptionId_medicineId: {
        prescriptionId: prescription.id,
        medicineId: medicine.id,
      },
    },
    update: {
      reviewedByStaffId: staffUser.id,
      cycleDays: 30,
      status: "TRACKING",
      nextRefillAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    },
    create: {
      prescriptionId: prescription.id,
      medicineId: medicine.id,
      reviewedByStaffId: staffUser.id,
      cycleDays: 30,
      status: "TRACKING",
      nextRefillAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    },
  });

  const pendingInsurance = await upsertInsuranceRecordByNumber({
    patientUserId: patientUser.id,
    insuranceProviderName: "Vietnam Social Insurance",
    cardholderName: "VCare Patient",
    insuranceNumber: "VN-BHYT-2026-0001",
    registeredHospitalName: hospitalByCode.get("VC-HCM-001")?.name,
    insuranceExpiryDate: new Date(new Date().getFullYear() + 1, 11, 31),
    insuranceVerificationStatus: "SUBMITTED",
    submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  });

  const verifiedInsurance = await upsertInsuranceRecordByNumber({
    patientUserId: patientUser.id,
    insuranceProviderName: "Vietnam Social Insurance",
    cardholderName: "VCare Patient",
    insuranceNumber: "VN-BHYT-2025-0099",
    registeredHospitalName: hospitalByCode.get("VC-HN-001")?.name,
    insuranceExpiryDate: new Date(new Date().getFullYear() + 1, 5, 30),
    insuranceVerificationStatus: "VERIFIED",
    reviewedByStaffId: staffUser.id,
    verifiedByStaffId: staffUser.id,
    submittedAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
    reviewedAt: new Date(Date.now() - 26 * 24 * 60 * 60 * 1000),
    verifiedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
  });

  const rejectedInsurance = await upsertInsuranceRecordByNumber({
    patientUserId: patientUser.id,
    insuranceProviderName: "Regional Hospital Insurance",
    cardholderName: "VCare Patient",
    insuranceNumber: "VN-HOSP-2025-0021",
    registeredHospitalName: hospitalByCode.get("VC-HCM-001")?.name,
    insuranceExpiryDate: new Date(new Date().getFullYear() + 1, 2, 31),
    insuranceVerificationStatus: "REJECTED",
    reviewedByStaffId: staffUser.id,
    submittedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
    reviewedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
  });

  await ensureInsuranceDocument({
    insuranceRecordId: pendingInsurance.id,
    uploadedByUserId: patientUser.id,
    documentType: "CARD_FRONT",
    fileName: "insurance-front.jpg",
    fileUrl: seededImageUrl(`insurance-${pendingInsurance.id}-front`, 1200, 760),
  });

  await ensureInsuranceDocument({
    insuranceRecordId: pendingInsurance.id,
    uploadedByUserId: patientUser.id,
    documentType: "CARD_BACK",
    fileName: "insurance-back.jpg",
    fileUrl: seededImageUrl(`insurance-${pendingInsurance.id}-back`, 1200, 760),
  });

  await ensureInsuranceDocument({
    insuranceRecordId: verifiedInsurance.id,
    uploadedByUserId: patientUser.id,
    documentType: "SUPPORTING_DOCUMENT",
    fileName: "insurance-verification-note.pdf",
    fileUrl: `uploaded://insurance/${verifiedInsurance.id}/insurance-verification-note.pdf`,
  });

  await ensureInsuranceDocument({
    insuranceRecordId: rejectedInsurance.id,
    uploadedByUserId: patientUser.id,
    documentType: "CARD_FRONT",
    fileName: "insurance-rejected-front.jpg",
    fileUrl: seededImageUrl(`insurance-${rejectedInsurance.id}-front`, 1200, 760),
  });

  await ensureVerificationNote({
    insuranceRecordId: verifiedInsurance.id,
    createdByStaffId: staffUser.id,
    note: "Verification completed based on uploaded insurance details.",
    isPatientVisible: true,
  });

  await ensureVerificationNote({
    insuranceRecordId: rejectedInsurance.id,
    createdByStaffId: staffUser.id,
    note: "Insurance information mismatch. Please upload a clearer front/back image.",
    isPatientVisible: true,
  });

  const patientA = additionalPatientUsers[0];
  const patientB = additionalPatientUsers[1];
  const secondDoctorId = seededDoctors[1]?.id ?? fallbackDoctorId;
  const thirdDoctorId = seededDoctors[2]?.id ?? fallbackDoctorId;
  const secondClinicId = clinicByCode.get("VC-CLINIC-002")?.id ?? fallbackClinicId;
  const thirdClinicId = clinicByCode.get("VC-CLINIC-003")?.id ?? fallbackClinicId;
  const secondHospitalId = hospitalByCode.get("VC-HCM-001")?.id ?? fallbackHospitalId;
  const thirdHospitalId = hospitalByCode.get("VC-HN-001")?.id ?? fallbackHospitalId;

  const secondMedicine = await prisma.medicine.upsert({
    where: { code: "VC-MED-002" },
    update: {
      name: "Losartan 50mg",
      dosageForm: "Tablet",
      status: "ACTIVE",
    },
    create: {
      code: "VC-MED-002",
      name: "Losartan 50mg",
      dosageForm: "Tablet",
      status: "ACTIVE",
    },
  });

  const thirdMedicine = await prisma.medicine.upsert({
    where: { code: "VC-MED-003" },
    update: {
      name: "Atorvastatin 10mg",
      dosageForm: "Tablet",
      status: "ACTIVE",
    },
    create: {
      code: "VC-MED-003",
      name: "Atorvastatin 10mg",
      dosageForm: "Tablet",
      status: "ACTIVE",
    },
  });

  const existingFamilyA = await prisma.familyMember.findFirst({
    where: {
      patientUserId: patientA.id,
      fullName: "Le Thi C",
    },
    select: { id: true },
  });

  if (!existingFamilyA) {
    await prisma.familyMember.create({
      data: {
        patientUserId: patientA.id,
        fullName: "Le Thi C",
        relationship: "PARENT",
        phone: "+84 933 000 111",
      },
    });
  }

  const existingFamilyB = await prisma.familyMember.findFirst({
    where: {
      patientUserId: patientB.id,
      fullName: "Pham Van D",
    },
    select: { id: true },
  });

  if (!existingFamilyB) {
    await prisma.familyMember.create({
      data: {
        patientUserId: patientB.id,
        fullName: "Pham Van D",
        relationship: "SPOUSE",
        phone: "+84 900 222 333",
      },
    });
  }

  const prescriptionAUploaded = await prisma.prescription.upsert({
    where: { prescriptionReference: "VC-RX-1001" },
    update: {
      patientUserId: patientA.id,
      uploadedByUserId: patientA.id,
      clinicId: secondClinicId,
      hospitalId: secondHospitalId,
      doctorId: secondDoctorId,
      status: "UPLOADED",
      insuranceVerificationStatus: "SUBMITTED",
      reviewedByStaffId: null,
      reviewedAt: null,
      notes: "Seed uploaded prescription waiting for staff review.",
    },
    create: {
      prescriptionReference: "VC-RX-1001",
      patientUserId: patientA.id,
      uploadedByUserId: patientA.id,
      clinicId: secondClinicId,
      hospitalId: secondHospitalId,
      doctorId: secondDoctorId,
      status: "UPLOADED",
      insuranceVerificationStatus: "SUBMITTED",
      notes: "Seed uploaded prescription waiting for staff review.",
    },
  });

  const prescriptionARejected = await prisma.prescription.upsert({
    where: { prescriptionReference: "VC-RX-1003" },
    update: {
      patientUserId: patientA.id,
      uploadedByUserId: patientA.id,
      reviewedByStaffId: staffUser.id,
      clinicId: secondClinicId,
      hospitalId: secondHospitalId,
      doctorId: secondDoctorId,
      status: "REJECTED",
      insuranceVerificationStatus: "REJECTED",
      reviewedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      notes: "Seed review rejected due to incomplete uploaded prescription image.",
    },
    create: {
      prescriptionReference: "VC-RX-1003",
      patientUserId: patientA.id,
      uploadedByUserId: patientA.id,
      reviewedByStaffId: staffUser.id,
      clinicId: secondClinicId,
      hospitalId: secondHospitalId,
      doctorId: secondDoctorId,
      status: "REJECTED",
      insuranceVerificationStatus: "REJECTED",
      reviewedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      notes: "Seed review rejected due to incomplete uploaded prescription image.",
    },
  });

  const prescriptionBActive = await prisma.prescription.upsert({
    where: { prescriptionReference: "VC-RX-1002" },
    update: {
      patientUserId: patientB.id,
      uploadedByUserId: patientB.id,
      reviewedByStaffId: staffUser.id,
      clinicId: thirdClinicId,
      hospitalId: thirdHospitalId,
      doctorId: thirdDoctorId,
      status: "ACTIVE",
      insuranceVerificationStatus: "VERIFIED",
      reviewedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      notes: "Seed active prescription with staff-created schedule.",
    },
    create: {
      prescriptionReference: "VC-RX-1002",
      patientUserId: patientB.id,
      uploadedByUserId: patientB.id,
      reviewedByStaffId: staffUser.id,
      clinicId: thirdClinicId,
      hospitalId: thirdHospitalId,
      doctorId: thirdDoctorId,
      status: "ACTIVE",
      insuranceVerificationStatus: "VERIFIED",
      reviewedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      notes: "Seed active prescription with staff-created schedule.",
    },
  });

  await ensurePrescriptionImage({
    prescriptionId: prescriptionAUploaded.id,
    uploadedByUserId: patientA.id,
    imageLabel: "seed-prescription-a-uploaded.jpg",
    imageUrl: seededImageUrl(`prescription-${prescriptionAUploaded.id}-uploaded`, 1200, 760),
  });

  await ensurePrescriptionImage({
    prescriptionId: prescriptionARejected.id,
    uploadedByUserId: patientA.id,
    imageLabel: "seed-prescription-a-rejected.jpg",
    imageUrl: seededImageUrl(`prescription-${prescriptionARejected.id}-rejected`, 1200, 760),
  });

  await ensurePrescriptionImage({
    prescriptionId: prescriptionBActive.id,
    uploadedByUserId: patientB.id,
    imageLabel: "seed-prescription-b-active.jpg",
    imageUrl: seededImageUrl(`prescription-${prescriptionBActive.id}-active`, 1200, 760),
  });

  await prisma.dosageSchedule.upsert({
    where: {
      prescriptionId_medicineId: {
        prescriptionId: prescriptionAUploaded.id,
        medicineId: secondMedicine.id,
      },
    },
    update: {
      dosageInstruction: "Take after breakfast.",
      timingLabel: "08:00",
      timesPerDay: 1,
      startDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      status: "ACTIVE",
    },
    create: {
      prescriptionId: prescriptionAUploaded.id,
      medicineId: secondMedicine.id,
      dosageInstruction: "Take after breakfast.",
      timingLabel: "08:00",
      timesPerDay: 1,
      startDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      status: "ACTIVE",
    },
  });

  await prisma.refillCycle.upsert({
    where: {
      prescriptionId_medicineId: {
        prescriptionId: prescriptionAUploaded.id,
        medicineId: secondMedicine.id,
      },
    },
    update: {
      reviewedByStaffId: staffUser.id,
      reviewedAt: new Date(),
      cycleDays: 21,
      status: "TRACKING",
      nextRefillAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    },
    create: {
      prescriptionId: prescriptionAUploaded.id,
      medicineId: secondMedicine.id,
      reviewedByStaffId: staffUser.id,
      reviewedAt: new Date(),
      cycleDays: 21,
      status: "TRACKING",
      nextRefillAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.dosageSchedule.upsert({
    where: {
      prescriptionId_medicineId: {
        prescriptionId: prescriptionBActive.id,
        medicineId: thirdMedicine.id,
      },
    },
    update: {
      dosageInstruction: "Take before sleeping.",
      timingLabel: "21:00",
      timesPerDay: 1,
      startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      status: "ACTIVE",
    },
    create: {
      prescriptionId: prescriptionBActive.id,
      medicineId: thirdMedicine.id,
      dosageInstruction: "Take before sleeping.",
      timingLabel: "21:00",
      timesPerDay: 1,
      startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      status: "ACTIVE",
    },
  });

  await prisma.refillCycle.upsert({
    where: {
      prescriptionId_medicineId: {
        prescriptionId: prescriptionBActive.id,
        medicineId: thirdMedicine.id,
      },
    },
    update: {
      reviewedByStaffId: staffUser.id,
      reviewedAt: new Date(),
      cycleDays: 30,
      status: "DUE",
      nextRefillAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    },
    create: {
      prescriptionId: prescriptionBActive.id,
      medicineId: thirdMedicine.id,
      reviewedByStaffId: staffUser.id,
      reviewedAt: new Date(),
      cycleDays: 30,
      status: "DUE",
      nextRefillAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    },
  });

  const insuranceA = await upsertInsuranceRecordByNumber({
    patientUserId: patientA.id,
    insuranceProviderName: "Vietnam Social Insurance",
    cardholderName: "Nguyen Van A",
    insuranceNumber: "VN-BHYT-2026-1050",
    registeredHospitalName: hospitalByCode.get("VC-HCM-001")?.name,
    insuranceExpiryDate: new Date(new Date().getFullYear() + 1, 9, 30),
    insuranceVerificationStatus: "SUBMITTED",
    submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  });

  const insuranceB = await upsertInsuranceRecordByNumber({
    patientUserId: patientB.id,
    insuranceProviderName: "Vietnam Social Insurance",
    cardholderName: "Tran Thi B",
    insuranceNumber: "VN-BHYT-2026-2080",
    registeredHospitalName: hospitalByCode.get("VC-HN-001")?.name,
    insuranceExpiryDate: new Date(new Date().getFullYear() + 1, 7, 15),
    insuranceVerificationStatus: "VERIFIED",
    reviewedByStaffId: staffUser.id,
    verifiedByStaffId: staffUser.id,
    submittedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    reviewedAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000),
    verifiedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
  });

  await ensureInsuranceDocument({
    insuranceRecordId: insuranceA.id,
    uploadedByUserId: patientA.id,
    documentType: "CARD_FRONT",
    fileName: "patient-a-insurance-front.jpg",
    fileUrl: seededImageUrl(`insurance-${insuranceA.id}-front`, 1200, 760),
  });

  await ensureInsuranceDocument({
    insuranceRecordId: insuranceB.id,
    uploadedByUserId: patientB.id,
    documentType: "CARD_BACK",
    fileName: "patient-b-insurance-back.jpg",
    fileUrl: seededImageUrl(`insurance-${insuranceB.id}-back`, 1200, 760),
  });

  await ensureVerificationNote({
    insuranceRecordId: insuranceB.id,
    createdByStaffId: staffUser.id,
    note: "Insurance record verified in seed data.",
    isPatientVisible: true,
  });

  await prisma.order.upsert({
    where: { orderNumber: "VC-ORD-1001" },
    update: {
      patientUserId: patientA.id,
      prescriptionId: prescriptionAUploaded.id,
      medicineId: secondMedicine.id,
      quantity: 1,
      fulfillmentMethod: "PICKUP",
      status: "SUBMITTED",
      submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      reviewedByStaffId: null,
      reviewedAt: null,
      fulfilledAt: null,
    },
    create: {
      orderNumber: "VC-ORD-1001",
      patientUserId: patientA.id,
      prescriptionId: prescriptionAUploaded.id,
      medicineId: secondMedicine.id,
      quantity: 1,
      fulfillmentMethod: "PICKUP",
      status: "SUBMITTED",
      submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.order.upsert({
    where: { orderNumber: "VC-ORD-1002" },
    update: {
      patientUserId: patientB.id,
      prescriptionId: prescriptionBActive.id,
      medicineId: thirdMedicine.id,
      reviewedByStaffId: staffUser.id,
      quantity: 2,
      fulfillmentMethod: "DELIVERY",
      deliveryAddress: "88 Tran Hung Dao, Hoan Kiem, Hanoi",
      status: "REVIEWED_BY_STAFF",
      submittedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      reviewedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
    create: {
      orderNumber: "VC-ORD-1002",
      patientUserId: patientB.id,
      prescriptionId: prescriptionBActive.id,
      medicineId: thirdMedicine.id,
      reviewedByStaffId: staffUser.id,
      quantity: 2,
      fulfillmentMethod: "DELIVERY",
      deliveryAddress: "88 Tran Hung Dao, Hoan Kiem, Hanoi",
      status: "REVIEWED_BY_STAFF",
      submittedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      reviewedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  });

  const existingAppointmentA = await prisma.appointmentRequest.findFirst({
    where: {
      patientUserId: patientA.id,
      appointmentRequestNote: "Seed appointment request for cardiology follow-up.",
    },
    select: { id: true },
  });

  if (!existingAppointmentA) {
    await prisma.appointmentRequest.create({
      data: {
        patientUserId: patientA.id,
        doctorId: secondDoctorId,
        hospitalId: secondHospitalId,
        clinicId: secondClinicId,
        status: "REQUESTED",
        requestedForAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        appointmentRequestNote: "Seed appointment request for cardiology follow-up.",
      },
    });
  }

  const existingAppointmentB = await prisma.appointmentRequest.findFirst({
    where: {
      patientUserId: patientB.id,
      appointmentRequestNote: "Seed reviewed booking request.",
    },
    select: { id: true },
  });

  if (!existingAppointmentB) {
    await prisma.appointmentRequest.create({
      data: {
        patientUserId: patientB.id,
        doctorId: thirdDoctorId,
        hospitalId: thirdHospitalId,
        clinicId: thirdClinicId,
        reviewedByStaffId: staffUser.id,
        status: "REVIEWED_BY_STAFF",
        requestedForAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        reviewedAt: new Date(),
        appointmentRequestNote: "Seed reviewed booking request.",
      },
    });
  }

  const existingConsultationA = await prisma.consultationNote.findFirst({
    where: {
      patientUserId: patientA.id,
      summary: "Seed consultation coordination note for patient A.",
    },
    select: { id: true },
  });

  if (!existingConsultationA) {
    await prisma.consultationNote.create({
      data: {
        patientUserId: patientA.id,
        doctorId: secondDoctorId,
        prescriptionId: prescriptionAUploaded.id,
        reviewedByStaffId: staffUser.id,
        summary: "Seed consultation coordination note for patient A.",
        doctorInformation: "Doctor information snapshot from seeded booking data.",
        reviewedAt: new Date(),
      },
    });
  }

  const existingConsultationB = await prisma.consultationNote.findFirst({
    where: {
      patientUserId: patientB.id,
      summary: "Seed follow-up note for patient B.",
    },
    select: { id: true },
  });

  if (!existingConsultationB) {
    await prisma.consultationNote.create({
      data: {
        patientUserId: patientB.id,
        doctorId: thirdDoctorId,
        prescriptionId: prescriptionBActive.id,
        reviewedByStaffId: staffUser.id,
        summary: "Seed follow-up note for patient B.",
        doctorInformation: "Doctor information snapshot from seeded booking data.",
        reviewedAt: new Date(),
      },
    });
  }

  await ensureNotification({
    userId: patientA.id,
    title: "Prescription uploaded",
    body: "Your uploaded prescription VC-RX-1001 is waiting for staff review.",
    relatedEntityType: "Prescription",
    relatedEntityId: prescriptionAUploaded.id,
  });

  await ensureNotification({
    userId: patientA.id,
    title: "Insurance uploaded",
    body: "Insurance uploaded. Verification pending clinic or hospital staff review.",
    relatedEntityType: "InsuranceRecord",
    relatedEntityId: insuranceA.id,
  });

  await ensureNotification({
    userId: patientB.id,
    title: "Insurance verification status updated",
    body: "Insurance verification status is verified.",
    relatedEntityType: "InsuranceRecord",
    relatedEntityId: insuranceB.id,
  });

  await ensureNotification({
    userId: patientB.id,
    title: "Medicine schedule available",
    body: "A staff-created or uploaded-prescription-based schedule is available.",
    relatedEntityType: "Prescription",
    relatedEntityId: prescriptionBActive.id,
  });

  const existingPartner = await prisma.partnerOrganization.findFirst({
    where: {
      name: "VCare Partner Pharmacy",
      contactEmail: "partner.pharmacy@vcare.vn",
    },
    select: { id: true },
  });

  if (!existingPartner) {
    await prisma.partnerOrganization.create({
      data: {
        name: "VCare Partner Pharmacy",
        organizationType: "PHARMACY",
        contactName: "Tran Van B",
        contactEmail: "partner.pharmacy@vcare.vn",
        inquiryMessage: "Seed placeholder partner inquiry.",
        inquiryStatus: "NEW",
        createdByUserId: staffUser.id,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    // eslint-disable-next-line no-console
    console.error("Seed failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
