import { PartnerInquiryForm } from "@/components/marketing/partner-inquiry-form";
import { SectionIntro } from "@/components/marketing/section-intro";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ContactPage() {
  return (
    <div className="space-y-8">
      <SectionIntro
        eyebrow="Contact"
        title="Partner inquiry and support contact"
        description="Share your pharmacy or clinic details to start a neutral onboarding discussion with the VCare team."
      />

      <Card>
        <CardHeader>
          <CardTitle>Contact / partner inquiry</CardTitle>
          <CardDescription>
            This form is for partnership and operational support inquiries only.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PartnerInquiryForm />
        </CardContent>
      </Card>
    </div>
  );
}
