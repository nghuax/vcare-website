export type NavItem = {
  title: string;
  href: string;
  description?: string;
};

export const publicNavItems: NavItem[] = [
  {
    title: "How It Works",
    href: "/how-it-works",
    description: "See the VCare workflow from upload to follow-up",
  },
  {
    title: "For Patients",
    href: "/for-patients",
    description: "Patient-first medication and appointment support",
  },
  {
    title: "For Pharmacies/Clinics",
    href: "/for-pharmacies-clinics",
    description: "Partnership model for care teams and pharmacies",
  },
  {
    title: "FAQ",
    href: "/faq",
  },
  {
    title: "Contact",
    href: "/contact",
  },
  {
    title: "Patient Portal",
    href: "/patient",
  },
  {
    title: "Staff Dashboard",
    href: "/admin",
  },
];

export const patientSidebarNav: NavItem[] = [
  { title: "Dashboard", href: "/patient" },
  { title: "Upload Prescription", href: "/patient/prescriptions/upload" },
  { title: "Prescriptions", href: "/patient/prescriptions" },
  { title: "Insurance", href: "/patient/insurance" },
  { title: "Appointments", href: "/patient/appointments" },
  { title: "Medicine Schedule", href: "/patient/medicine-schedule" },
  { title: "Refill Alerts", href: "/patient/refill-alerts" },
  { title: "Orders", href: "/patient/orders" },
  { title: "Family Profiles", href: "/patient/family-profiles" },
  { title: "Notifications", href: "/patient/notifications" },
  { title: "Account Settings", href: "/patient/account-settings" },
];

export const adminSidebarNav: NavItem[] = [
  { title: "Dashboard", href: "/admin" },
  { title: "Analytics", href: "/admin/analytics" },
  { title: "Prescription Queue", href: "/admin/prescriptions" },
  { title: "Insurance Queue", href: "/admin/insurance-verifications" },
  { title: "Patients", href: "/admin/patients" },
  { title: "Medicine Plans", href: "/admin/medicine-plan-creator" },
  { title: "Orders", href: "/admin/orders" },
  { title: "Reminders", href: "/admin/reminders" },
  { title: "Doctors", href: "/admin/doctors" },
  { title: "Hospitals/Clinics", href: "/admin/facilities" },
  { title: "Consultation Notes", href: "/admin/consultation-notes" },
];
