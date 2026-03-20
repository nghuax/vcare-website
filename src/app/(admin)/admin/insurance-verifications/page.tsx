import Link from "next/link";

import { InsuranceReviewForm } from "@/components/admin/insurance-review-form";
import { StatusChip } from "@/components/patient/status-chip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/date";
import { requireStaffOrAdminUser } from "@/lib/session";
import { getInsuranceVerificationQueue } from "@/server/services/admin/operations";

type PageProps = {
  searchParams: Promise<{
    status?: string;
  }>;
};

const filters = [
  "ALL",
  "SUBMITTED",
  "IN_REVIEW",
  "NEEDS_INFORMATION",
  "VERIFIED",
  "REJECTED",
];

export default async function InsuranceVerificationPage({ searchParams }: PageProps) {
  await requireStaffOrAdminUser();
  const { status } = await searchParams;
  const activeFilter = status?.toUpperCase() ?? "ALL";

  const records = await getInsuranceVerificationQueue(activeFilter);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <Badge variant="neutral" className="mb-2 w-fit">
            Insurance Verification Queue
          </Badge>
          <CardTitle>Insurance upload review</CardTitle>
          <CardDescription>
            Review uploaded insurance documents, mark verified or rejected, and add
            verification notes.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <Link key={filter} href={`/admin/insurance-verifications?status=${filter}`}>
              <Button
                size="lg"
                variant={activeFilter === filter ? "secondary" : "outline"}
              >
                {filter.toLowerCase().replaceAll("_", " ")}
              </Button>
            </Link>
          ))}
        </CardContent>
      </Card>

      {!records.length ? (
        <EmptyState
          title="No insurance records"
          description="No insurance uploads match the selected status filter."
        />
      ) : (
        <div className="grid gap-4">
          {records.map((record) => (
            <Card key={record.id}>
              <CardContent className="space-y-4 p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">{record.cardholderName}</p>
                    <p className="text-xs text-muted-foreground">Patient: {record.patientName}</p>
                    <p className="text-xs text-muted-foreground">
                      {record.insuranceProviderName} · {record.insuranceNumber}
                    </p>
                  </div>
                  <StatusChip status={record.status} />
                </div>

                <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
                  <p>Submitted: {formatDateTime(record.submittedAt)}</p>
                  <p>Reviewed: {formatDateTime(record.reviewedAt)}</p>
                  <p>Verified: {formatDateTime(record.verifiedAt)}</p>
                  <p>Documents: {record.documentCount}</p>
                  <p>Notes: {record.noteCount}</p>
                  <p>Verified by: {record.verifiedByStaffName ?? "-"}</p>
                </div>

                <InsuranceReviewForm insuranceRecordId={record.id} initialStatus={record.status} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
