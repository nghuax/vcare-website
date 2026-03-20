import Link from "next/link";
import { Bell, CalendarClock, FileText, Pill } from "lucide-react";

import { requirePatientUser } from "@/lib/session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getPatientDashboardSummary,
  getPatientNotifications,
  getPatientRefillAlerts,
} from "@/server/services/patient/portal";
import { formatDateTime } from "@/lib/date";
import { StatusChip } from "@/components/patient/status-chip";

export default async function PatientOverviewPage() {
  const user = await requirePatientUser();
  const [summary, refillAlerts, notifications] = await Promise.all([
    getPatientDashboardSummary(user.id),
    getPatientRefillAlerts(user.id),
    getPatientNotifications(user.id),
  ]);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Patient workspace</CardTitle>
            <CardDescription>Welcome back, {user.name ?? "Patient"}.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl bg-muted p-4">
              <p className="text-xs text-muted-foreground">Uploaded prescriptions</p>
              <p className="text-3xl font-semibold text-foreground">{summary.prescriptionCount}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-2xl border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground">Schedules</p>
                <p className="text-lg font-semibold text-foreground">{summary.activeScheduleCount}</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground">Refill alerts</p>
                <p className="text-lg font-semibold text-foreground">{summary.refillDueCount}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-muted p-4">
              <p className="text-xs text-muted-foreground">Unread notifications</p>
              <p className="text-xl font-semibold text-foreground">
                {summary.notificationUnreadCount}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-5">
          <CardContent className="space-y-5 pt-6">
            <Badge variant="neutral" className="w-fit">
              Overview
            </Badge>
            <div>
              <h1 className="text-4xl font-semibold tracking-tight text-foreground">
                Patient Health Support
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Keep uploaded prescription records, medicine schedule, refill alerts, insurance
                status, and appointment requests in one flow.
              </p>
            </div>

            <div className="rounded-[26px] bg-primary p-5 text-primary-foreground">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary-foreground/70">
                Coordination Card
              </p>
              <p className="mt-2 text-3xl font-semibold">Medication workflow</p>
              <p className="mt-2 text-sm text-primary-foreground/85">
                Schedule data is staff-created or uploaded-prescription-based. This portal
                does not provide diagnosis or treatment decisions.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href="/patient/prescriptions/upload">
                  <Button size="lg" variant="secondary">
                    <FileText className="mr-2 h-4 w-4" />
                    Upload prescription
                  </Button>
                </Link>
                <Link href="/patient/medicine-schedule">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/35 bg-white/10 text-white hover:bg-white/20"
                  >
                    <Pill className="mr-2 h-4 w-4" />
                    Open schedule
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <Link href="/patient/insurance" className="rounded-2xl border border-border bg-muted p-4">
                <p className="text-sm font-semibold text-foreground">Insurance status</p>
                <p className="text-xs text-muted-foreground">Track verification progress</p>
              </Link>
              <Link href="/patient/appointments" className="rounded-2xl border border-border bg-muted p-4">
                <p className="text-sm font-semibold text-foreground">Appointment booking</p>
                <p className="text-xs text-muted-foreground">Choose doctor and request slot</p>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-4">
          <CardHeader>
            <CardTitle className="text-base">Timeline</CardTitle>
            <CardDescription>Recent status updates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {notifications.slice(0, 6).map((item) => (
              <div key={item.id} className="rounded-2xl border border-border bg-muted p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  <StatusChip status={item.status} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{item.body}</p>
                <p className="mt-2 text-[11px] text-muted-foreground">{formatDateTime(item.createdAt)}</p>
              </div>
            ))}

            {refillAlerts.slice(0, 2).map((alert) => (
              <div key={alert.refillCycleId} className="rounded-2xl border border-border bg-card p-3">
                <p className="text-sm font-semibold text-foreground">{alert.medicineName}</p>
                <p className="text-xs text-muted-foreground">
                  Refill target {formatDateTime(alert.nextRefillAt)}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <CalendarClock className="h-3.5 w-3.5 text-primary" />
                  <StatusChip status={alert.alertState} />
                </div>
              </div>
            ))}

            <Link href="/patient/notifications">
              <Button size="lg" variant="outline" className="w-full">
                <Bell className="mr-2 h-4 w-4" />
                Open all notifications
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
