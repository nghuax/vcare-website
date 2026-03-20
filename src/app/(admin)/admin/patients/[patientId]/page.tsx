import Link from "next/link";
import { notFound } from "next/navigation";

import { StatusChip } from "@/components/patient/status-chip";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatDateTime } from "@/lib/date";
import { requireStaffOrAdminUser } from "@/lib/session";
import { getPatientDetail } from "@/server/services/admin/operations";

type PageProps = {
  params: Promise<{
    patientId: string;
  }>;
};

export default async function AdminPatientDetailPage({ params }: PageProps) {
  await requireStaffOrAdminUser();
  const { patientId } = await params;

  const patient = await getPatientDetail(patientId);

  if (!patient) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{patient.fullName}</CardTitle>
          <CardDescription>
            {patient.email} · Joined {formatDate(patient.createdAt)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <StatusChip status={patient.status} />
          <p className="text-sm text-muted-foreground">Phone: {patient.phone ?? "-"}</p>
        </CardContent>
      </Card>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Prescriptions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {patient.prescriptions.length ? (
              patient.prescriptions.map((item) => (
                <div key={item.id} className="rounded-xl border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-slate-900">{item.reference}</p>
                    <StatusChip status={item.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Uploaded {formatDateTime(item.uploadedAt)}
                  </p>
                  <Link href={`/admin/prescriptions/${item.id}`}>
                    <span className="text-xs font-medium text-primary hover:underline">
                      Open review
                    </span>
                  </Link>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No prescriptions.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Insurance records</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {patient.insuranceRecords.length ? (
              patient.insuranceRecords.map((item) => (
                <div key={item.id} className="rounded-xl border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-slate-900">{item.insuranceNumber}</p>
                    <StatusChip status={item.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Submitted {formatDateTime(item.submittedAt)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No insurance records.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appointment requests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {patient.appointmentRequests.length ? (
              patient.appointmentRequests.map((item) => (
                <div key={item.id} className="rounded-xl border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-slate-900">Request {item.id.slice(0, 8)}</p>
                    <StatusChip status={item.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {item.doctorName ?? "No selected doctor"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.clinicName ?? item.hospitalName ?? "Facility pending"}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No appointment requests.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Orders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {patient.orders.length ? (
              patient.orders.map((item) => (
                <div key={item.id} className="rounded-xl border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-slate-900">Order {item.id.slice(0, 8)}</p>
                    <StatusChip status={item.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {item.fulfillmentMethod.toLowerCase()} · {formatDateTime(item.createdAt)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No orders.</p>
            )}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Family profiles & notifications</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-900">Family profiles</p>
            {patient.familyMembers.length ? (
              patient.familyMembers.map((member) => (
                <p key={member.id} className="text-sm text-muted-foreground">
                  {member.fullName} ({member.relationship.toLowerCase()})
                </p>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No family profiles.</p>
            )}
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-900">Latest notifications</p>
            {patient.notifications.length ? (
              patient.notifications.map((notification) => (
                <p key={notification.id} className="text-sm text-muted-foreground">
                  {notification.title} ({notification.status.toLowerCase()})
                </p>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No notifications.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Link href="/admin/patients">
        <Button size="lg" variant="outline">
          Back to patient list
        </Button>
      </Link>
    </div>
  );
}
