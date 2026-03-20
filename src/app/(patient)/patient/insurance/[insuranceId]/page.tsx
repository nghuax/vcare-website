import Link from "next/link";
import { notFound } from "next/navigation";

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
import { formatDate, formatDateTime } from "@/lib/date";
import { requirePatientUser } from "@/lib/session";
import { getPatientInsuranceDetail } from "@/server/services/patient/insurance";

type PageProps = {
  params: Promise<{
    insuranceId: string;
  }>;
};

function statusLabelToChip(statusLabel: string): string {
  return statusLabel.replaceAll(" ", "_").toUpperCase();
}

export default async function InsuranceDetailPage({ params }: PageProps) {
  const user = await requirePatientUser();
  const { insuranceId } = await params;

  const insuranceRecord = await getPatientInsuranceDetail(user.id, insuranceId);

  if (!insuranceRecord) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{insuranceRecord.cardholderName}</CardTitle>
          <CardDescription>
            {insuranceRecord.insuranceProviderName} · {insuranceRecord.insuranceNumber}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <StatusChip status={statusLabelToChip(insuranceRecord.statusLabel)} />
          </div>
          <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            <p>Registered hospital: {insuranceRecord.registeredHospitalName ?? "-"}</p>
            <p>Expiry date: {formatDate(insuranceRecord.insuranceExpiryDate)}</p>
            <p>Uploaded: {formatDateTime(insuranceRecord.submittedAt)}</p>
            <p>Reviewed: {formatDateTime(insuranceRecord.reviewedAt)}</p>
            <p>Verified: {formatDateTime(insuranceRecord.verifiedAt)}</p>
            <p>Reviewed by staff: {insuranceRecord.reviewedByStaffName ?? "Pending"}</p>
          </div>
          <p className="text-sm text-muted-foreground">{insuranceRecord.statusDescription}</p>
          <p className="text-xs text-muted-foreground">
            Disclaimer: Uploaded insurance is reviewed by clinic or hospital staff. This
            status is informational and does not guarantee eligibility or reimbursement.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Uploaded documents</CardTitle>
          <CardDescription>
            Front/back card image uploads and supporting documents.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {insuranceRecord.documents.length ? (
            insuranceRecord.documents.map((document) => (
              <div key={document.id} className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {document.documentType.replaceAll("_", " ")}
                </p>
                <p className="mt-1 text-sm font-medium text-slate-900">{document.fileName}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Uploaded {formatDateTime(document.createdAt)}
                </p>
                {document.fileUrl.startsWith("uploaded://") ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Secure uploaded file placeholder
                  </p>
                ) : (
                  <a
                    href={document.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
                  >
                    Open document
                  </a>
                )}
              </div>
            ))
          ) : (
            <EmptyState
              title="No documents available"
              description="Insurance document uploads will appear here once files are linked."
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Verification notes</CardTitle>
          <CardDescription>
            Notes entered by clinic or hospital staff during review.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {insuranceRecord.verificationNotes.length ? (
            insuranceRecord.verificationNotes.map((note) => (
              <div key={note.id} className="rounded-xl border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">{note.createdByStaffName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(note.createdAt)}
                  </p>
                </div>
                <p className="mt-2 text-sm text-slate-700">{note.note}</p>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">
                Verification notes placeholder. Staff notes will appear after review.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Link href="/patient/insurance">
          <Button size="lg" variant="outline">
            Back to insurance status
          </Button>
        </Link>
        <Link href="/patient/appointments">
          <Button size="lg" variant="secondary">
            Continue to appointment booking
          </Button>
        </Link>
      </div>
    </div>
  );
}
