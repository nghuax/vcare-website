import { redirect } from "next/navigation";

export default function LegacyRefillsPage() {
  redirect("/patient/refill-alerts");
}
