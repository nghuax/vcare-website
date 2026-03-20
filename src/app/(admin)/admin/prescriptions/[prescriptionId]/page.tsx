import Link from "next/link";
import { notFound } from "next/navigation";

import { PrescriptionReviewForm } from "@/components/admin/prescription-review-form";
import { StatusChip } from "@/components/patient/status-chip";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/date";
import { requireStaffOrAdminUser } from "@/lib/session";
import { getPrescriptionReviewDetail } from "@/server/services/admin/operations";

type PageProps = {
  params: Promise<{
    prescriptionId: string;
  }>;
};

export default async function PrescriptionReviewDetailPage({ params }: PageProps) {
  await requireStaffOrAdminUser();
  const { prescriptionId } = await params;

  const detail = await getPrescriptionReviewDetail(prescriptionId);

  if (!detail) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Prescription {detail.reference}</CardTitle>
          <CardDescription>
            Patient: {detail.patientName} · Uploaded {formatDateTime(detail.uploadedAt)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <StatusChip status={detail.status} />
            <StatusChip status={detail.insuranceStatus} />
          </div>
          <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            <p>Email: {detail.patientEmail}</p>
            <p>Phone: {detail.patientPhone ?? "-"}</p>
            <p>Reviewed by: {detail.reviewedByStaffName ?? "-"}</p>
            <p>Reviewed at: {formatDateTime(detail.reviewedAt)}</p>
          </div>
          <p className="text-sm text-muted-foreground">
            {detail.notes ?? "No notes yet."}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Uploaded images</CardTitle>
          <CardDescription>
            Uploaded prescription image submissions.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {detail.images.map((image) => (
            <div key={image.id} className="rounded-xl border border-border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">{image.imageLabel ?? "image"}</p>
              {image.imageUrl.startsWith("uploaded://") ? (
                <div className="mt-2 flex h-40 items-center justify-center rounded-lg border border-dashed border-border bg-background text-xs text-muted-foreground">
                  Secure uploaded image placeholder
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={image.imageUrl}
                  alt={image.imageLabel ?? "Prescription image"}
                  className="mt-2 h-40 w-full rounded-lg object-cover"
                />
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current medicine schedules</CardTitle>
          <CardDescription>
            Staff-created or uploaded-prescription-based schedule entries.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {detail.schedules.length ? (
            detail.schedules.map((schedule) => (
              <div key={schedule.id} className="rounded-xl border border-border p-4">
                <p className="font-semibold text-slate-900">{schedule.medicineName}</p>
                <p className="text-sm text-muted-foreground">{schedule.timingLabel ?? "-"}</p>
                <p className="text-sm text-muted-foreground">
                  {schedule.dosageInstruction ?? "No dosage note"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(schedule.startDate)} to {formatDateTime(schedule.endDate)}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No schedule entries yet.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Review action</CardTitle>
          <CardDescription>
            Approve or reject this uploaded prescription and optionally add medicine
            schedule data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PrescriptionReviewForm
            prescriptionId={detail.id}
            initialStatus={detail.status}
            defaultNote={detail.notes}
          />
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Link href="/admin/prescriptions">
          <Button size="lg" variant="outline">
            Back to queue
          </Button>
        </Link>
        <Link href={`/admin/patients/${detail.patientUserId}`}>
          <Button size="lg" variant="secondary">
            Open patient detail
          </Button>
        </Link>
      </div>
    </div>
  );
}
