import Link from "next/link";

import { MarkAsTakenButton } from "@/components/patient/mark-as-taken-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/date";
import { requirePatientUser } from "@/lib/session";
import { getPatientMedicineSchedule } from "@/server/services/patient/portal";

export default async function MedicineSchedulePage() {
  const user = await requirePatientUser();
  const schedules = await getPatientMedicineSchedule(user.id);

  if (!schedules.length) {
    return (
      <EmptyState
        title="No schedule available"
        description="Upload a prescription first. Schedule entries are staff-created or uploaded-prescription-based."
        action={{
          label: "Upload prescription",
          href: "/patient/prescriptions/upload",
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Medicine schedule</CardTitle>
          <CardDescription>
            Large timing display for quick daily tracking.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4">
        {schedules.map((schedule) => (
          <Card key={schedule.scheduleId}>
            <CardContent className="space-y-3 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-slate-900">{schedule.medicineName}</p>
                  <p className="text-xs text-muted-foreground">
                    Prescription {schedule.prescriptionReference}
                  </p>
                </div>
                <MarkAsTakenButton
                  scheduleId={schedule.scheduleId}
                  prescriptionId={schedule.prescriptionId}
                  takenToday={schedule.takenToday}
                />
              </div>

              <p className="text-3xl font-semibold leading-tight text-primary">
                {schedule.timingLabel}
              </p>
              <p className="text-sm text-muted-foreground">
                {schedule.dosageInstruction ?? "No dosage note"}
              </p>
              <p className="text-xs text-muted-foreground">
                Last marked taken: {formatDateTime(schedule.lastTakenAt)}
              </p>

              <Link href={`/patient/prescriptions/${schedule.prescriptionId}`}>
                <span className="text-sm font-medium text-primary hover:underline">
                  View prescription detail
                </span>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
