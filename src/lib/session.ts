import { prisma } from "@/lib/prisma";
import { isAppRole, type AppRole } from "@/lib/roles";

type SessionUser = {
  id: string;
  role: AppRole;
  email: string;
  name: string;
};

const GUEST_PASSWORD_HASH = "guest-mode-no-login";
const GUEST_PATIENT_EMAIL = "guest.patient@vcare.local";
const GUEST_STAFF_EMAIL = "guest.staff@vcare.local";

async function ensureGuestUser(role: "PATIENT" | "STAFF"): Promise<SessionUser> {
  const email = role === "PATIENT" ? GUEST_PATIENT_EMAIL : GUEST_STAFF_EMAIL;
  const fullName = role === "PATIENT" ? "VCare Guest Patient" : "VCare Guest Staff";

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      role: true,
      email: true,
      fullName: true,
    },
  });

  const user =
    existingUser ??
    (await prisma.user.create({
      data: {
        email,
        fullName,
        role,
        status: "ACTIVE",
        passwordHash: GUEST_PASSWORD_HASH,
      },
      select: {
        id: true,
        role: true,
        email: true,
        fullName: true,
      },
    }));

  if (role === "STAFF") {
    const existingStaff = await prisma.staffUser.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!existingStaff) {
      await prisma.staffUser.create({
        data: {
          userId: user.id,
          staffCode: `VC-GUEST-${user.id.slice(0, 6).toUpperCase()}`,
          staffRole: "CARE_COORDINATOR",
          department: "Guest Access",
          isActive: true,
        },
      });
    }
  }

  return {
    id: user.id,
    role: isAppRole(user.role) ? user.role : "PATIENT",
    email: user.email,
    name: user.fullName,
  };
}

function fallbackGuestUser(role: "PATIENT" | "STAFF"): SessionUser {
  return {
    id: role === "PATIENT" ? "guest-patient-session" : "guest-staff-session",
    role,
    email: role === "PATIENT" ? GUEST_PATIENT_EMAIL : GUEST_STAFF_EMAIL,
    name: role === "PATIENT" ? "VCare Guest Patient" : "VCare Guest Staff",
  };
}

async function resolveGuestUser(role: "PATIENT" | "STAFF"): Promise<SessionUser> {
  try {
    return await ensureGuestUser(role);
  } catch {
    return fallbackGuestUser(role);
  }
}

export async function getSessionUser() {
  return resolveGuestUser("PATIENT");
}

export async function requirePatientUser() {
  return resolveGuestUser("PATIENT");
}

export async function requireStaffOrAdminUser() {
  return resolveGuestUser("STAFF");
}
