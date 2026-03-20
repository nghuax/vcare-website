import { ReminderRecomputeButton } from "@/components/admin/reminder-recompute-button";
import { StatusChip } from "@/components/patient/status-chip";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/date";
import { requireStaffOrAdminUser } from "@/lib/session";
import { getReminderManagementData } from "@/server/services/admin/operations";

export default async function AdminReminderManagementPage() {
  await requireStaffOrAdminUser();
  const reminders = await getReminderManagementData();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <Badge variant="neutral" className="mb-2 w-fit">
            Reminder Management
          </Badge>
          <CardTitle>Medication schedule and refill timing review</CardTitle>
          <CardDescription>
            Review refill cycle states and run a reminder-state recompute pass.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReminderRecomputeButton />
        </CardContent>
      </Card>

      {!reminders.length ? (
        <EmptyState
          title="No refill cycles"
          description="No refill cycle records are currently available for reminder management."
        />
      ) : (
        <div className="grid gap-4">
          {reminders.map((item) => (
            <Card key={item.refillCycleId}>
              <CardContent className="space-y-3 p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">{item.medicineName}</p>
                    <p className="text-xs text-muted-foreground">Patient: {item.patientName}</p>
                    <p className="text-xs text-muted-foreground">
                      Prescription {item.prescriptionReference}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <StatusChip status={item.status} />
                    <StatusChip status={item.reminderState} />
                  </div>
                </div>

                <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
                  <p>Cycle days: {item.cycleDays}</p>
                  <p>Next refill: {formatDateTime(item.nextRefillAt)}</p>
                  <p>
                    Days remaining: {item.daysRemaining !== null ? item.daysRemaining : "-"}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
