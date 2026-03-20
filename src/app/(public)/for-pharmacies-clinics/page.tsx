import Link from "next/link";

import { SectionIntro } from "@/components/marketing/section-intro";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const benefits = [
  {
    title: "Structured intake",
    body: "Receive uploaded prescription context and appointment request metadata in a consistent format.",
  },
  {
    title: "Staff review operations",
    body: "Use reviewed by staff workflows to keep coordination steps auditable and clear.",
  },
  {
    title: "Insurance verification support",
    body: "Track insurance verification status fields and supporting documents in one place.",
  },
  {
    title: "Partnership onboarding",
    body: "Submit a partner inquiry and align on operational responsibilities before activation.",
  },
];

export default function ForPharmaciesClinicsPage() {
  return (
    <div className="space-y-8">
      <SectionIntro
        eyebrow="For Pharmacies and Clinics"
        title="Built for reliable coordination with patient-facing teams"
        description="VCare provides a neutral and structured workflow for partner pharmacies and clinics supporting patient care journeys."
        actions={
          <Link href="/contact">
            <Button size="lg">Submit partner inquiry</Button>
          </Link>
        }
      />

      <section className="grid gap-4 md:grid-cols-2">
        {benefits.map((item) => (
          <Card key={item.title}>
            <CardHeader>
              <CardTitle>{item.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{item.body}</CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
