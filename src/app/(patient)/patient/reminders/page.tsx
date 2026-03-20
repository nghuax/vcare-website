import { redirect } from "next/navigation";

export default function LegacyRemindersPage() {
  redirect("/patient/medicine-schedule");
}
