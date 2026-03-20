export const siteConfig = {
  name: "VCare",
  tagline: "Healthcare support and pharmacy coordination for Vietnam",
  description:
    "VCare helps with uploaded prescription tracking, insurance verification status updates, medicine reminders, refill alerts, and appointment request coordination.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
} as const;
