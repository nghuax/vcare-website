import Link from "next/link";

import { SectionIntro } from "@/components/marketing/section-intro";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const steps = [
  {
    title: "1. Upload prescription",
    detail:
      "Patients add an uploaded prescription image and basic medicine details. The system keeps records structured for support follow-up.",
  },
  {
    title: "2. Staff review and verification support",
    detail:
      "Operations teams can mark items as reviewed by staff and update insurance verification status with neutral notes.",
  },
  {
    title: "3. Reminder and refill support",
    detail:
      "Dosage schedules power medicine reminders while refill cycles trigger refill alerts before expected depletion.",
  },
  {
    title: "4. Doctor information and appointment request",
    detail:
      "Patients browse doctor information, submit an appointment request, and track confirmation progress.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="space-y-8">
      <SectionIntro
        eyebrow="How It Works"
        title="A simple flow for coordinated healthcare support"
        description="VCare is designed around practical operations: uploaded prescription records, insurance verification status tracking, and appointment request coordination."
      />

      <section className="grid gap-4 md:grid-cols-2">
        {steps.map((step) => (
          <Card key={step.title}>
            <CardHeader>
              <CardTitle>{step.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{step.detail}</CardContent>
          </Card>
        ))}
      </section>

      <section className="rounded-3xl border border-border bg-card p-7">
        <h2 className="text-xl font-semibold text-slate-900">Ready to get started?</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Open the portal directly and continue with guest access.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/patient">
            <Button size="lg">Open patient portal</Button>
          </Link>
          <Link href="/admin">
            <Button size="lg" variant="secondary">
              Open staff dashboard
            </Button>
          </Link>
          <Link href="/for-patients">
            <Button size="lg" variant="outline">
              Explore patient features
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
