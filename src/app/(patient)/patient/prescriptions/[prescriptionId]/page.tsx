import Link from "next/link";
import { notFound } from "next/navigation";

import { MarkAsTakenButton } from "@/components/patient/mark-as-taken-button";
import { StatusChip } from "@/components/patient/status-chip";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDateTime } from "@/lib/date";
import { requirePatientUser } from "@/lib/session";
import { getPatientPrescriptionDetail } from "@/server/services/patient/portal";

type PageProps = {
  params: Promise<{
    prescriptionId: string;
  }>;
};

export default async function PrescriptionDetailPage({ params }: PageProps) {
  const user = await requirePatientUser();
  const { prescriptionId } = await params;

  const detail = await getPatientPrescriptionDetail(user.id, prescriptionId);

  if (!detail) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Prescription {detail.reference}</CardTitle>
          <CardDescription>
            Uploaded {formatDateTime(detail.uploadedAt)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <StatusChip status={detail.status} />
            <StatusChip status={detail.insuranceStatus} />
          </div>
          <p className="text-sm text-muted-foreground">{detail.notes ?? "No notes"}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Prescription images</CardTitle>
          <CardDescription>
            Uploaded images linked to this prescription.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {detail.images.map((image) => (
            <div key={image.id} className="rounded-xl border border-border bg-muted/30 p-3">
              <p className="mb-2 text-xs text-muted-foreground">
                {image.imageLabel ?? "prescription-image"}
              </p>
              {image.imageUrl.startsWith("uploaded://") ? (
                <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border bg-background text-center text-xs text-muted-foreground">
                  Secure uploaded image placeholder
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={image.imageUrl}
                  alt={image.imageLabel ?? "Prescription image"}
                  className="h-40 w-full rounded-lg object-cover"
                />
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Medicine schedule</CardTitle>
          <CardDescription>
            Staff-created or uploaded-prescription-based schedule items.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {detail.schedules.map((schedule) => (
            <div key={schedule.id} className="rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold text-slate-900">{schedule.medicineName}</h3>
                <MarkAsTakenButton
                  scheduleId={schedule.id}
                  prescriptionId={detail.id}
                  takenToday={schedule.takenToday}
                />
              </div>
              <p className="mt-2 text-2xl font-semibold text-primary">
                {schedule.timingLabel ?? "Timing pending"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {schedule.dosageInstruction ?? "No dosage note"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Last marked taken: {formatDateTime(schedule.lastTakenAt)}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Link href="/patient/refill-alerts">
          <Button size="lg" variant="secondary">
            Open refill alerts
          </Button>
        </Link>
        <Link href="/patient/prescriptions">
          <Button size="lg" variant="outline">
            Back to prescriptions
          </Button>
        </Link>
      </div>
    </div>
  );
}
