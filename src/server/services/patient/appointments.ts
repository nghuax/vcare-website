import { prisma } from "@/lib/prisma";
import { createRandomDoctorProfile, seededAvatarUrl } from "@/lib/random-data";
import {
  getPatientInsuranceStatusSnapshot,
  type InsuranceStatusSnapshot,
} from "@/server/services/patient/insurance";

export type AppointmentFacility = {
  id: string;
  type: "HOSPITAL" | "CLINIC";
  name: string;
  city: string | null;
  addressLine: string | null;
  linkedHospitalName: string | null;
};

export type AppointmentSlot = {
  id: string;
  doctorId: string;
  doctorName: string;
  hospitalId: string | null;
  clinicId: string | null;
  clinicName: string | null;
  hospitalName: string | null;
  startsAt: Date;
  endsAt: Date;
};

export type AppointmentDoctor = {
  id: string;
  fullName: string;
  specialty: string | null;
  doctorInformation: string | null;
  profileImageUrl: string | null;
  yearsOfExperience: number | null;
  hospitalId: string | null;
  clinicId: string | null;
  hospitalName: string | null;
  clinicName: string | null;
  ratingScore: number;
  reviewCount: number;
  consultationFeeLabel: string;
  availableSlots: AppointmentSlot[];
};

export type AppointmentFamilyMember = {
  id: string;
  fullName: string;
  relationship: string;
};

export type AppointmentBookingContext = {
  facilities: AppointmentFacility[];
  doctors: AppointmentDoctor[];
  familyMembers: AppointmentFamilyMember[];
  insuranceStatus: InsuranceStatusSnapshot;
};

function mockNowOffset(days = 0, hour = 9): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date;
}

function mockBookingContext(): AppointmentBookingContext {
  const slotOneStart = mockNowOffset(1, 9);
  const slotOneEnd = new Date(slotOneStart.getTime() + 45 * 60 * 1000);
  const slotTwoStart = mockNowOffset(2, 14);
  const slotTwoEnd = new Date(slotTwoStart.getTime() + 45 * 60 * 1000);
  const randomDoctor = createRandomDoctorProfile("mock-booking-doctor-1");

  return {
    facilities: [
      {
        id: "mock-hospital-1",
        type: "HOSPITAL",
        name: "VCare Partner Hospital",
        city: "Ho Chi Minh City",
        addressLine: "123 Nguyen Hue, District 1",
        linkedHospitalName: null,
      },
      {
        id: "mock-clinic-1",
        type: "CLINIC",
        name: "VCare Coordination Clinic",
        city: "Ho Chi Minh City",
        addressLine: "12 Le Loi, District 1",
        linkedHospitalName: "VCare Partner Hospital",
      },
    ],
    doctors: [
      {
        id: "mock-doctor-1",
        fullName: randomDoctor.fullName,
        specialty: randomDoctor.specialty,
        doctorInformation: randomDoctor.doctorInformation,
        profileImageUrl: randomDoctor.profileImageUrl,
        yearsOfExperience: randomDoctor.yearsOfExperience,
        hospitalId: "mock-hospital-1",
        clinicId: "mock-clinic-1",
        hospitalName: "VCare Partner Hospital",
        clinicName: "VCare Coordination Clinic",
        ratingScore: randomDoctor.ratingScore,
        reviewCount: randomDoctor.reviewCount,
        consultationFeeLabel: randomDoctor.consultationFeeNote,
        availableSlots: [
          {
            id: "mock-slot-1",
            doctorId: "mock-doctor-1",
            doctorName: randomDoctor.fullName,
            hospitalId: "mock-hospital-1",
            clinicId: "mock-clinic-1",
            clinicName: "VCare Coordination Clinic",
            hospitalName: "VCare Partner Hospital",
            startsAt: slotOneStart,
            endsAt: slotOneEnd,
          },
          {
            id: "mock-slot-2",
            doctorId: "mock-doctor-1",
            doctorName: randomDoctor.fullName,
            hospitalId: "mock-hospital-1",
            clinicId: "mock-clinic-1",
            clinicName: "VCare Coordination Clinic",
            hospitalName: "VCare Partner Hospital",
            startsAt: slotTwoStart,
            endsAt: slotTwoEnd,
          },
        ],
      },
    ],
    familyMembers: [],
    insuranceStatus: {
      insuranceRecordId: "mock-insurance-record-1",
      status: "SUBMITTED",
      uiStatus: "PENDING_VERIFICATION",
      statusLabel: "pending verification",
      statusDescription:
        "Insurance uploaded and waiting for clinic or hospital staff review.",
      submittedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
  };
}

async function safeQuery<T>(query: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await query();
  } catch {
    return fallback;
  }
}

export async function getAppointmentBookingContext(
  patientUserId: string,
): Promise<AppointmentBookingContext> {
  return safeQuery(
    async () => {
      const [hospitals, clinics, doctors, familyMembers, insuranceStatus] = await Promise.all([
        prisma.hospital.findMany({
          where: {
            status: "ACTIVE",
          },
          select: {
            id: true,
            name: true,
            city: true,
            addressLine: true,
          },
          orderBy: { name: "asc" },
        }),
        prisma.clinic.findMany({
          where: {
            status: "ACTIVE",
          },
          include: {
            hospital: {
              select: {
                name: true,
              },
            },
          },
          orderBy: { name: "asc" },
        }),
        prisma.doctor.findMany({
          where: {
            status: "ACTIVE",
          },
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
                status: "OPEN",
                startsAt: {
                  gte: new Date(),
                },
              },
              orderBy: { startsAt: "asc" },
              take: 8,
            },
          },
          orderBy: { fullName: "asc" },
        }),
        prisma.familyMember.findMany({
          where: { patientUserId },
          orderBy: { fullName: "asc" },
          select: {
            id: true,
            fullName: true,
            relationship: true,
          },
        }),
        getPatientInsuranceStatusSnapshot(patientUserId),
      ]);

      const facilityOptions: AppointmentFacility[] = [
        ...hospitals.map((hospital) => ({
          id: hospital.id,
          type: "HOSPITAL" as const,
          name: hospital.name,
          city: hospital.city,
          addressLine: hospital.addressLine,
          linkedHospitalName: null,
        })),
        ...clinics.map((clinic) => ({
          id: clinic.id,
          type: "CLINIC" as const,
          name: clinic.name,
          city: clinic.city,
          addressLine: clinic.addressLine,
          linkedHospitalName: clinic.hospital?.name ?? null,
        })),
      ];

      const doctorOptions: AppointmentDoctor[] = doctors.map((doctor) => ({
        id: doctor.id,
        fullName: doctor.fullName,
        specialty: doctor.specialty,
        doctorInformation: doctor.doctorInformation,
        profileImageUrl: doctor.profileImageUrl ?? seededAvatarUrl(`doctor-${doctor.id}`),
        yearsOfExperience: doctor.yearsOfExperience,
        hospitalId: doctor.hospital?.id ?? null,
        clinicId: doctor.clinic?.id ?? null,
        hospitalName: doctor.hospital?.name ?? null,
        clinicName: doctor.clinic?.name ?? null,
        ratingScore: doctor.reviewSummary?.averageRating ?? 0,
        reviewCount: doctor.reviewSummary?.reviewCount ?? 0,
        consultationFeeLabel:
          doctor.consultationFeeNote ??
          "Consultation fee information will be confirmed by staff.",
        availableSlots: doctor.availabilitySlots.map((slot) => ({
          id: slot.id,
          doctorId: doctor.id,
          doctorName: doctor.fullName,
          hospitalId: doctor.hospital?.id ?? null,
          clinicId: doctor.clinic?.id ?? null,
          clinicName: doctor.clinic?.name ?? null,
          hospitalName: doctor.hospital?.name ?? null,
          startsAt: slot.startsAt,
          endsAt: slot.endsAt,
        })),
      }));

      if (!facilityOptions.length || !doctorOptions.length) {
        const fallback = mockBookingContext();

        return {
          ...fallback,
          familyMembers,
          insuranceStatus,
        };
      }

      return {
        facilities: facilityOptions,
        doctors: doctorOptions,
        familyMembers,
        insuranceStatus,
      };
    },
    mockBookingContext(),
  );
}
