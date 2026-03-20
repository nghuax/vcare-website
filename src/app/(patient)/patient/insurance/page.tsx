import Link from "next/link";

import { StatusChip } from "@/components/patient/status-chip";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/date";
import { requirePatientUser } from "@/lib/session";
import {
  getPatientInsuranceRecords,
  getPatientInsuranceStatusSnapshot,
} from "@/server/services/patient/insurance";

function statusLabelToChip(statusLabel: string): string {
  return statusLabel.replaceAll(" ", "_").toUpperCase();
}

export default async function InsurancePage() {
  const user = await requirePatientUser();
  const [insuranceStatus, insuranceRecords] = await Promise.all([
    getPatientInsuranceStatusSnapshot(user.id),
    getPatientInsuranceRecords(user.id),
  ]);

  if (!insuranceRecords.length) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-4">
            <div>
              <CardTitle>Insurance details</CardTitle>
              <CardDescription>
                Upload existing Vietnamese health or hospital insurance information.
              </CardDescription>
            </div>
            <Link href="/patient/insurance/upload">
              <Button size="lg">Upload insurance</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Insurance status: {insuranceStatus.statusLabel}. Uploaded insurance will be
              reviewed by clinic or hospital staff.
            </p>
          </CardContent>
        </Card>

        <EmptyState
          title="Insurance not uploaded"
          description="Upload insurance card images or a supporting document to start verification status tracking."
          action={{ label: "Upload insurance", href: "/patient/insurance/upload" }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Insurance verification status</CardTitle>
            <CardDescription>
              Track uploaded insurance details and staff-reviewed verification status.
            </CardDescription>
          </div>
          <Link href="/patient/insurance/upload">
            <Button size="lg">Upload new insurance</Button>
          </Link>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Disclaimer: Uploaded insurance will be reviewed by clinic or hospital staff.
            No automatic insurance approval is provided in this portal.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {insuranceRecords.map((record) => (
          <Card key={record.id}>
            <CardContent className="space-y-3 p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">{record.cardholderName}</p>
                  <p className="text-xs text-muted-foreground">
                    {record.insuranceProviderName} · {record.insuranceNumber}
                  </p>
                </div>
                <StatusChip status={statusLabelToChip(record.statusLabel)} />
              </div>

              <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                <p>Registered hospital: {record.registeredHospitalName ?? "-"}</p>
                <p>Expiry date: {formatDate(record.insuranceExpiryDate)}</p>
                <p>Uploaded: {formatDate(record.submittedAt)}</p>
                <p>Documents: {record.documentCount}</p>
              </div>

              <p className="text-sm text-muted-foreground">{record.statusDescription}</p>

              <Link href={`/patient/insurance/${record.id}`}>
                <Button size="lg" variant="outline">
                  View insurance detail
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
