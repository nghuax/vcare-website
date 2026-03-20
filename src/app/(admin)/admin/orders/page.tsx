import Link from "next/link";

import { OrderStatusForm } from "@/components/admin/order-status-form";
import { StatusChip } from "@/components/patient/status-chip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/date";
import { requireStaffOrAdminUser } from "@/lib/session";
import { getOrdersManagement } from "@/server/services/admin/operations";

type PageProps = {
  searchParams: Promise<{
    status?: string;
  }>;
};

const filters = [
  "ALL",
  "DRAFT",
  "SUBMITTED",
  "REVIEWED_BY_STAFF",
  "READY_FOR_PICKUP",
  "DELIVERED",
  "CANCELED",
];

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  await requireStaffOrAdminUser();
  const { status } = await searchParams;
  const activeFilter = status?.toUpperCase() ?? "ALL";

  const orders = await getOrdersManagement(activeFilter);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <Badge variant="neutral" className="mb-2 w-fit">
            Orders Management
          </Badge>
          <CardTitle>Reorder request operations</CardTitle>
          <CardDescription>
            Review order records, update status, and keep audit fields clear.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <Link key={filter} href={`/admin/orders?status=${filter}`}>
              <Button
                size="lg"
                variant={filter === activeFilter ? "secondary" : "outline"}
              >
                {filter.toLowerCase().replaceAll("_", " ")}
              </Button>
            </Link>
          ))}
        </CardContent>
      </Card>

      {!orders.length ? (
        <EmptyState
          title="No orders"
          description="No reorder requests match the selected status filter."
        />
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardContent className="space-y-4 p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">Patient: {order.patientName}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.prescriptionReference} · {order.medicineName}
                    </p>
                  </div>
                  <StatusChip status={order.status} />
                </div>

                <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
                  <p>Fulfillment: {order.fulfillmentMethod.toLowerCase()}</p>
                  <p>Quantity: {order.quantity ?? "-"}</p>
                  <p>Created: {formatDateTime(order.createdAt)}</p>
                  <p>Reviewed by: {order.reviewedByStaffName ?? "-"}</p>
                </div>

                <OrderStatusForm
                  orderId={order.id}
                  initialStatus={order.status as
                    | "DRAFT"
                    | "SUBMITTED"
                    | "REVIEWED_BY_STAFF"
                    | "READY_FOR_PICKUP"
                    | "DELIVERED"
                    | "CANCELED"}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
