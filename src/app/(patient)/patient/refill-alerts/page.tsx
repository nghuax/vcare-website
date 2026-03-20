import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusChip } from "@/components/patient/status-chip";
import { ReorderRequestForm } from "@/components/patient/reorder-request-form";
import { formatDate } from "@/lib/date";
import { requirePatientUser } from "@/lib/session";
import { getPatientRefillAlerts } from "@/server/services/patient/portal";

export default async function RefillAlertsPage() {
  const user = await requirePatientUser();
  const alerts = await getPatientRefillAlerts(user.id);

  if (!alerts.length) {
    return (
      <EmptyState
        title="No refill alerts yet"
        description="Refill alerts are generated based on schedule duration and refill cycle tracking fields."
      />
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Refill alerts</CardTitle>
          <CardDescription>
            Monitor refill reminder state and submit reorder for pickup or delivery.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4">
        {alerts.map((alert) => (
          <Card key={alert.refillCycleId}>
            <CardContent className="space-y-3 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">{alert.medicineName}</p>
                  <p className="text-xs text-muted-foreground">
                    Prescription {alert.prescriptionReference}
                  </p>
                </div>
                <StatusChip status={alert.alertState} />
              </div>

              <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
                <p>Next refill target: {formatDate(alert.nextRefillAt)}</p>
                <p>Cycle: {alert.cycleDays} days</p>
                <p>
                  Days remaining: {alert.daysRemaining !== null ? alert.daysRemaining : "-"}
                </p>
              </div>

              <ReorderRequestForm
                prescriptionId={alert.prescriptionId}
                medicineId={alert.medicineId}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
