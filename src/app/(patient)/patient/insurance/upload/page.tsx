import Link from "next/link";

import { InsuranceUploadForm } from "@/components/patient/insurance-upload-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requirePatientUser } from "@/lib/session";

export default async function InsuranceUploadPage() {
  await requirePatientUser();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Upload insurance information</CardTitle>
          <CardDescription>
            Add insurance cardholder details and upload front/back card images or supporting
            documents.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Uploaded insurance will be reviewed by clinic or hospital staff. Verification
            status may remain pending until review is complete.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <InsuranceUploadForm />
        </CardContent>
      </Card>

      <Link href="/patient/insurance">
        <Button size="lg" variant="outline">
          Back to insurance status
        </Button>
      </Link>
    </div>
  );
}
