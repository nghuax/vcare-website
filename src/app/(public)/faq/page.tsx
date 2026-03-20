import { SectionIntro } from "@/components/marketing/section-intro";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const faqs = [
  {
    question: "Does VCare provide diagnosis or treatment advice?",
    answer:
      "No. VCare is a healthcare support and pharmacy coordination platform. It does not replace doctor consultations.",
  },
  {
    question: "What does insurance verification status mean in VCare?",
    answer:
      "It shows the current operational verification state of submitted insurance information and documents.",
  },
  {
    question: "Can family members be managed in one account?",
    answer:
      "Yes. Family member records are supported so patients can coordinate uploads and requests for dependents.",
  },
  {
    question: "Who can access staff/admin features?",
    answer:
      "Staff and admin roles access operational dashboards for records reviewed by staff and support workflows.",
  },
  {
    question: "Can I request an appointment with doctor information visible?",
    answer:
      "Yes. Patients can browse doctor information and create an appointment request in the platform.",
  },
];

export default function FaqPage() {
  return (
    <div className="space-y-8">
      <SectionIntro
        eyebrow="FAQ"
        title="Common questions about VCare"
        description="Clear answers on workflows, roles, and platform boundaries."
      />

      <section className="space-y-4">
        {faqs.map((faq) => (
          <Card key={faq.question}>
            <CardHeader>
              <CardTitle className="text-lg">{faq.question}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{faq.answer}</CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
