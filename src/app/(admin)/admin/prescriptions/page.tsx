import Link from "next/link";

import { StatusChip } from "@/components/patient/status-chip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/date";
import { requireStaffOrAdminUser } from "@/lib/session";
import { getPrescriptionReviewQueue } from "@/server/services/admin/operations";

type PageProps = {
  searchParams: Promise<{
    status?: string;
  }>;
};

const filters = ["ALL", "UPLOADED", "REVIEW_IN_PROGRESS", "ACTIVE", "REJECTED"];

export default async function PrescriptionReviewQueuePage({ searchParams }: PageProps) {
  await requireStaffOrAdminUser();
  const { status } = await searchParams;
  const activeFilter = status?.toUpperCase() || "ALL";
  const items = await getPrescriptionReviewQueue(activeFilter);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <Badge variant="neutral" className="mb-2 w-fit">
            Prescription Review Queue
          </Badge>
          <CardTitle>Uploaded prescription submissions</CardTitle>
          <CardDescription>
            Open submissions, approve or reject records, and set staff review notes plus
            medicine schedule entries.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <Link key={filter} href={`/admin/prescriptions?status=${filter}`}>
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

      {!items.length ? (
        <EmptyState
          title="No prescription submissions"
          description="No uploaded prescription submissions match the selected filter."
        />
      ) : (
        <div className="grid gap-4">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="space-y-3 p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">Prescription {item.reference}</p>
                    <p className="text-xs text-muted-foreground">Patient: {item.patientName}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusChip status={item.status} />
                    <StatusChip status={item.insuranceStatus} />
                  </div>
                </div>

                <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
                  <p>Uploaded: {formatDateTime(item.uploadedAt)}</p>
                  <p>Reviewed: {formatDateTime(item.reviewedAt)}</p>
                  <p>Reviewed by: {item.reviewedByStaffName ?? "-"}</p>
                  <p>Images: {item.imageCount}</p>
                  <p>Schedules: {item.scheduleCount}</p>
                </div>

                <p className="text-sm text-muted-foreground">
                  {item.notes ?? "No review notes yet."}
                </p>

                <Link href={`/admin/prescriptions/${item.id}`}>
                  <Button size="lg" variant="outline">
                    Open review
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
