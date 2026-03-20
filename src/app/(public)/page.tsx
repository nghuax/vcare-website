import Link from "next/link";
import { Bell, CalendarClock, FileText, HeartPulse, Pill, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const flowCards = [
  {
    icon: FileText,
    title: "Uploaded prescription",
    description: "Upload an existing prescription image and track review status.",
  },
  {
    icon: ShieldCheck,
    title: "Insurance verification status",
    description: "Insurance uploads are reviewed by clinic or hospital staff.",
  },
  {
    icon: Pill,
    title: "Medicine reminders",
    description: "Schedules are staff-created or uploaded-prescription-based.",
  },
  {
    icon: CalendarClock,
    title: "Appointment request",
    description: "Choose hospital/clinic, optional doctor, then submit request.",
  },
];

const monthTimeline = [
  {
    month: "January",
    items: ["Prescription uploaded", "Insurance uploaded"],
  },
  {
    month: "February",
    items: ["Verification pending", "Schedule available"],
  },
  {
    month: "March",
    items: ["Refill due soon", "Appointment request"],
  },
  {
    month: "April",
    items: ["Order submitted"],
  },
  {
    month: "May",
    items: ["Follow-up reminder"],
  },
  {
    month: "June",
    items: ["Status updated"],
  },
];

export default function PublicHomePage() {
  return (
    <div className="space-y-8">
      <section className="grid gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <HeartPulse className="h-4 w-4 text-primary" />
              VCare Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl bg-muted p-4">
              <p className="text-sm font-semibold text-foreground">Patient Workspace</p>
              <p className="text-xs text-muted-foreground">
                Prescription, reminders, refill alerts, and booking in one view.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-2xl border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="text-sm font-semibold text-foreground">Reviewed by staff</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground">Insurance</p>
                <p className="text-sm font-semibold text-foreground">Verification pending</p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-muted p-4">
              <p className="text-sm font-semibold text-foreground">Notifications</p>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Bell className="h-3.5 w-3.5 text-primary" />
                  Refill due in 4 days
                </li>
                <li className="flex items-center gap-2">
                  <Bell className="h-3.5 w-3.5 text-primary" />
                  Appointment request received
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-5">
          <CardContent className="space-y-5 pt-6">
            <Badge variant="neutral" className="w-fit">
              Healthcare Support Platform
            </Badge>

            <div className="space-y-2">
              <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                Overview Patient Workflow
              </h1>
              <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
                VCare helps Vietnamese patients coordinate uploaded prescriptions,
                insurance document review, medicine reminder schedules, refill alerts, and
                doctor-based appointment requests.
              </p>
            </div>

            <div className="rounded-[26px] bg-primary p-5 text-primary-foreground">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary-foreground/70">
                Core Flow
              </p>
              <p className="mt-2 text-3xl font-semibold">Simple. Clear. Trusted.</p>
              <p className="mt-2 max-w-md text-sm text-primary-foreground/85">
                This platform is for coordination support only. It does not provide
                diagnosis or treatment decisions.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href="/patient">
                  <Button size="lg" variant="secondary">
                    Open patient portal
                  </Button>
                </Link>
                <Link href="/how-it-works">
                  <Button size="lg" variant="outline" className="border-white/35 bg-white/10 text-white hover:bg-white/20">
                    See workflow
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {flowCards.map((card) => (
                <div
                  key={card.title}
                  className="rounded-2xl border border-border bg-muted p-4"
                >
                  <card.icon className="h-4 w-4 text-primary" />
                  <p className="mt-2 text-sm font-semibold text-foreground">{card.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{card.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-base">Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {monthTimeline.map((row) => (
                <div key={row.month} className="grid grid-cols-[88px_1fr] gap-2">
                  <p className="text-sm font-medium text-foreground/70">{row.month}</p>
                  <div className="flex flex-wrap gap-2">
                    {row.items.map((item) => (
                      <span
                        key={`${row.month}-${item}`}
                        className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="rounded-[28px] border border-border bg-muted p-6 sm:p-8">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Get started with the right workspace
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
          Patients can manage personal coordination flows. Staff and admin users can
          review documents, update statuses, and manage operations queues.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/patient">
            <Button size="lg">Open patient portal</Button>
          </Link>
          <Link href="/admin">
            <Button size="lg" variant="outline">
              Open staff dashboard
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
