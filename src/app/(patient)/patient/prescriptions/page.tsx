import Link from "next/link";

import { requirePatientUser } from "@/lib/session";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/date";
import { getPatientPrescriptions } from "@/server/services/patient/portal";
import { StatusChip } from "@/components/patient/status-chip";

export default async function PrescriptionsPage() {
  const user = await requirePatientUser();
  const prescriptions = await getPatientPrescriptions(user.id);

  if (!prescriptions.length) {
    return (
      <EmptyState
        title="No uploaded prescriptions yet"
        description="Upload your first prescription image to start schedule and refill tracking."
        action={{ label: "Upload prescription", href: "/patient/prescriptions/upload" }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Uploaded prescriptions</CardTitle>
            <CardDescription>
              Review status, schedule count, and refill timing from your account.
            </CardDescription>
          </div>
          <Link href="/patient/prescriptions/upload">
            <Button size="lg">Upload new</Button>
          </Link>
        </CardHeader>
      </Card>

      <div className="grid gap-4">
        {prescriptions.map((prescription) => (
          <Card key={prescription.id}>
            <CardContent className="space-y-3 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">
                    Prescription {prescription.reference}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Uploaded: {formatDateTime(prescription.uploadedAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusChip status={prescription.status} />
                  <StatusChip status={prescription.insuranceStatus} />
                </div>
              </div>

              <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
                <p>Images: {prescription.imageCount}</p>
                <p>Schedules: {prescription.scheduleCount}</p>
                <p>
                  Refill target: {prescription.refillDueAt ? formatDateTime(prescription.refillDueAt) : "-"}
                </p>
              </div>

              <Link href={`/patient/prescriptions/${prescription.id}`}>
                <Button variant="outline" size="lg">
                  View details
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
