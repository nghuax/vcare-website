import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireStaffOrAdminUser } from "@/lib/session";
import { getAdminAnalyticsSummary } from "@/server/services/admin/operations";

export default async function AdminAnalyticsPage() {
  await requireStaffOrAdminUser();
  const summary = await getAdminAnalyticsSummary();

  const metricCards = [
    { label: "Total prescriptions", value: summary.totalPrescriptions },
    {
      label: "Pending prescription reviews",
      value: summary.pendingPrescriptionReviews,
    },
    {
      label: "Pending insurance verifications",
      value: summary.pendingInsuranceVerifications,
    },
    { label: "Total bookings", value: summary.totalBookings },
    { label: "Total reorder requests", value: summary.totalReorderRequests },
    { label: "Patient count", value: summary.patientCount },
    { label: "Doctor count", value: summary.doctorCount },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <Badge variant="neutral" className="mb-2 w-fit">
            Analytics Overview
          </Badge>
          <CardTitle>Operational Metrics</CardTitle>
          <CardDescription>
            Snapshot of current queue volumes for staff and admin operations.
          </CardDescription>
        </CardHeader>
      </Card>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metricCards.map((metric) => (
          <Card key={metric.label}>
            <CardHeader>
              <CardTitle className="text-base">{metric.label}</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-semibold text-primary">
              {metric.value}
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
