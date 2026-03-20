import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireStaffOrAdminUser } from "@/lib/session";
import { getAdminAnalyticsSummary } from "@/server/services/admin/operations";

const adminModules = [
  { label: "Prescription Queue", href: "/admin/prescriptions" },
  { label: "Insurance Queue", href: "/admin/insurance-verifications" },
  { label: "Patients", href: "/admin/patients" },
  { label: "Medicine Plan Creator", href: "/admin/medicine-plan-creator" },
  { label: "Orders", href: "/admin/orders" },
  { label: "Reminders", href: "/admin/reminders" },
  { label: "Doctors", href: "/admin/doctors" },
  { label: "Hospitals/Clinics", href: "/admin/facilities" },
  { label: "Consultation Notes", href: "/admin/consultation-notes" },
  { label: "Analytics", href: "/admin/analytics" },
];

export default async function AdminDashboardPage() {
  await requireStaffOrAdminUser();
  const summary = await getAdminAnalyticsSummary();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <Badge className="mb-2 w-fit" variant="neutral">
            Staff / Admin Operations
          </Badge>
          <CardTitle>VCare Operations Dashboard</CardTitle>
          <CardDescription>
            Review uploaded prescriptions and insurance documents, manage schedules,
            booking data, and operational records.
          </CardDescription>
        </CardHeader>
      </Card>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total Prescriptions</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-primary">
            {summary.totalPrescriptions}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pending Prescription Reviews</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-primary">
            {summary.pendingPrescriptionReviews}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pending Insurance Verifications</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-primary">
            {summary.pendingInsuranceVerifications}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total Bookings</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-primary">
            {summary.totalBookings}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total Reorder Requests</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-primary">
            {summary.totalReorderRequests}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Patients</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-primary">
            {summary.patientCount}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Doctors</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-primary">
            {summary.doctorCount}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Workflow Modules</CardTitle>
          <CardDescription>
            Open each queue or management area to continue review workflows.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {adminModules.map((module) => (
            <Link key={module.href} href={module.href}>
              <Button size="lg" variant="outline">
                {module.label}
              </Button>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
