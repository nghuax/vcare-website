import { AccountSettingsForm } from "@/components/patient/account-settings-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requirePatientUser } from "@/lib/session";
import { getPatientSettings } from "@/server/services/patient/portal";

export default async function AccountSettingsPage() {
  const user = await requirePatientUser();
  const settings = await getPatientSettings(user.id);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account settings</CardTitle>
        <CardDescription>
          Update profile preferences used in your patient portal.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AccountSettingsForm initialValues={settings} />
      </CardContent>
    </Card>
  );
}
