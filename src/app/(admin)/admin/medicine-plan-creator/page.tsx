import { MedicinePlanForm } from "@/components/admin/medicine-plan-form";
import { StatusChip } from "@/components/patient/status-chip";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/date";
import { requireStaffOrAdminUser } from "@/lib/session";
import { getMedicinePlanCreatorData } from "@/server/services/admin/operations";

export default async function MedicinePlanCreatorPage() {
  await requireStaffOrAdminUser();
  const data = await getMedicinePlanCreatorData();

  const prescriptionOptions = data.reviewablePrescriptions.map((item) => ({
    id: item.id,
    label: `${item.reference} · ${item.patientName}`,
  }));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Medicine plan creator</CardTitle>
          <CardDescription>
            Create or update medicine schedules for uploaded prescription records.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="p-5">
          {prescriptionOptions.length ? (
            <MedicinePlanForm prescriptions={prescriptionOptions} />
          ) : (
            <EmptyState
              title="No reviewable prescriptions"
              description="Upload prescription records first, then create medicine schedules."
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current schedules</CardTitle>
          <CardDescription>
            Review schedule entries that drive reminder and refill tracking logic.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.schedules.length ? (
            data.schedules.map((schedule) => (
              <div key={schedule.id} className="rounded-xl border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">{schedule.medicineName}</p>
                    <p className="text-xs text-muted-foreground">
                      {schedule.prescriptionReference} · {schedule.patientName}
                    </p>
                  </div>
                  <StatusChip status={schedule.status} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{schedule.timingLabel}</p>
                <p className="text-xs text-muted-foreground">
                  Times/day: {schedule.timesPerDay} · {formatDateTime(schedule.startDate)} to {" "}
                  {formatDateTime(schedule.endDate)}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No schedules available.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
