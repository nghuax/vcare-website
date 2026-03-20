export type RandomDoctorProfile = {
  fullName: string;
  specialty: string;
  doctorInformation: string;
  yearsOfExperience: number;
  ratingScore: number;
  reviewCount: number;
  consultationFeeNote: string;
  profileImageUrl: string;
};

const DOCTOR_NAMES = [
  "Dr. Nguyen Tuan Minh",
  "Dr. Tran Bao Linh",
  "Dr. Le Quang Huy",
  "Dr. Pham Thuy An",
  "Dr. Vo Gia Bao",
  "Dr. Hoang Kim Ngan",
  "Dr. Bui Quoc Khanh",
  "Dr. Dang Anh Thu",
  "Dr. Do Thanh Son",
  "Dr. Truong Minh Chau",
  "Dr. Phan Hai Yen",
  "Dr. Duong Khai Nguyen",
];

const SPECIALTIES = [
  "Internal Medicine",
  "Cardiology",
  "Endocrinology",
  "Pediatrics",
  "Respiratory Medicine",
  "Neurology",
  "Family Medicine",
  "General Practice",
];

const PROFILE_SNIPPETS = [
  "Supports medication follow-up and chronic-care coordination.",
  "Coordinates outpatient review and referral-based care workflow.",
  "Focuses on clear patient communication for medication schedules.",
  "Supports clinic-based follow-up and care coordination tasks.",
  "Works with partner facilities on schedule and status tracking.",
  "Provides doctor information for appointment-request planning.",
];

const CONSULTATION_FEE_NOTES = [
  "Consultation fee information will be confirmed by staff.",
  "Fee details are shared during booking confirmation.",
  "Consultation fee placeholder, final value confirmed by partner facility.",
];

function hashSeed(seed: string): number {
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function pickSeeded<T>(seed: string, values: T[]): T {
  return values[hashSeed(seed) % values.length];
}

function seededNumber(seed: string, min: number, max: number): number {
  const value = hashSeed(seed);
  return min + (value % (max - min + 1));
}

export function seededAvatarUrl(seed: string, size = 300): string {
  const avatarIndex = seededNumber(`${seed}-avatar`, 1, 70);
  return `https://i.pravatar.cc/${size}?img=${avatarIndex}`;
}

export function seededImageUrl(seed: string, width = 900, height = 600): string {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${width}/${height}`;
}

export function createRandomDoctorProfile(seed: string): RandomDoctorProfile {
  const fullName = pickSeeded(`${seed}-name`, DOCTOR_NAMES);
  const specialty = pickSeeded(`${seed}-specialty`, SPECIALTIES);
  const information = pickSeeded(`${seed}-profile`, PROFILE_SNIPPETS);

  return {
    fullName,
    specialty,
    doctorInformation: `${information}`,
    yearsOfExperience: seededNumber(`${seed}-years`, 6, 21),
    ratingScore: seededNumber(`${seed}-rating`, 42, 50) / 10,
    reviewCount: seededNumber(`${seed}-reviews`, 18, 240),
    consultationFeeNote: pickSeeded(`${seed}-fee`, CONSULTATION_FEE_NOTES),
    profileImageUrl: seededAvatarUrl(seed),
  };
}
