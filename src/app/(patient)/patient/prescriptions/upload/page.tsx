import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requirePatientUser } from "@/lib/session";
import { getPatientFamilyMembers } from "@/server/services/patient/portal";
import { PrescriptionUploadForm } from "@/components/patient/prescription-upload-form";

export default async function UploadPrescriptionPage() {
  const user = await requirePatientUser();
  const familyMembers = await getPatientFamilyMembers(user.id);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload prescription image</CardTitle>
        <CardDescription>
          Upload an image from your prescription. A schedule placeholder will be created from uploaded prescription data.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <PrescriptionUploadForm
          familyMembers={familyMembers.map((member) => ({
            id: member.id,
            label: `${member.fullName} (${member.relationship.toLowerCase()})`,
          }))}
        />
      </CardContent>
    </Card>
  );
}
