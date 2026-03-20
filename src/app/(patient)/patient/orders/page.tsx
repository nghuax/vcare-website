import { StatusChip } from "@/components/patient/status-chip";
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
import { getPatientOrders } from "@/server/services/patient/portal";

export default async function OrdersPage() {
  const user = await requirePatientUser();
  const orders = await getPatientOrders(user.id);

  if (!orders.length) {
    return (
      <EmptyState
        title="No orders yet"
        description="Use refill alerts to submit your first reorder request."
      />
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
          <CardDescription>
            Track reorder status and fulfillment method for pickup or delivery.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4">
        {orders.map((order) => (
          <Card key={order.id}>
            <CardContent className="space-y-2 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-slate-900">Order {order.id.slice(0, 8)}</p>
                <StatusChip status={order.status} />
              </div>
              <p className="text-sm text-muted-foreground">Medicine: {order.medicineName}</p>
              <p className="text-sm text-muted-foreground">
                Prescription: {order.prescriptionReference}
              </p>
              <p className="text-sm text-muted-foreground">
                Fulfillment: {order.fulfillmentMethod.toLowerCase()}
              </p>
              <p className="text-sm text-muted-foreground">Quantity: {order.quantity ?? "-"}</p>
              <p className="text-xs text-muted-foreground">
                Submitted: {formatDateTime(order.submittedAt)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
