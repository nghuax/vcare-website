import Link from "next/link";

import { SectionIntro } from "@/components/marketing/section-intro";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ForPatientsPage() {
  return (
    <div className="space-y-8">
      <SectionIntro
        eyebrow="For Patients"
        title="Keep your medicine and booking workflow organized"
        description="VCare helps patients coordinate care support tasks with clear language and simple actions."
        actions={
          <Link href="/patient">
            <Button size="lg">Open patient portal</Button>
          </Link>
        }
      />

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Uploaded prescription records</CardTitle>
            <CardDescription>Store and revisit records from one dashboard.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Upload images and track status updates when records are reviewed by staff.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Insurance verification status</CardTitle>
            <CardDescription>Get transparent verification state updates.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Follow status steps and uploaded documents without insurance approval claims.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Medicine reminders and refill alerts</CardTitle>
            <CardDescription>Stay on schedule with fewer manual checks.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            View dosage schedules and refill cycle updates in one timeline.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Doctor information and appointment request</CardTitle>
            <CardDescription>Coordinate bookings with trusted providers.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Browse doctor information and submit an appointment request directly in the portal.
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
