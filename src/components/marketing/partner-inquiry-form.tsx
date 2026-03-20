"use client";

import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function PartnerInquiryForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData(event.currentTarget);

    const payload = {
      organizationName: String(formData.get("organizationName") ?? ""),
      organizationType: String(formData.get("organizationType") ?? "OTHER"),
      contactName: String(formData.get("contactName") ?? ""),
      contactEmail: String(formData.get("contactEmail") ?? ""),
      contactPhone: String(formData.get("contactPhone") ?? ""),
      inquiryMessage: String(formData.get("inquiryMessage") ?? ""),
    };

    const response = await fetch("/api/partner-inquiry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = (await response.json()) as { message?: string };

    if (!response.ok) {
      setError(result.message ?? "Unable to submit inquiry.");
      setIsSubmitting(false);
      return;
    }

    event.currentTarget.reset();
    setSuccess("Partner inquiry submitted. Our team will contact you.");
    setIsSubmitting(false);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="organizationName">Organization name</Label>
          <Input id="organizationName" name="organizationName" required />
        </div>
        <div>
          <Label htmlFor="organizationType">Organization type</Label>
          <Select id="organizationType" name="organizationType" defaultValue="PHARMACY">
            <option value="PHARMACY">Pharmacy</option>
            <option value="CLINIC">Clinic</option>
            <option value="HOSPITAL">Hospital</option>
            <option value="OTHER">Other</option>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="contactName">Contact name</Label>
          <Input id="contactName" name="contactName" required />
        </div>
        <div>
          <Label htmlFor="contactEmail">Contact email</Label>
          <Input id="contactEmail" name="contactEmail" type="email" required />
        </div>
      </div>

      <div>
        <Label htmlFor="contactPhone">Contact phone</Label>
        <Input id="contactPhone" name="contactPhone" />
      </div>

      <div>
        <Label htmlFor="inquiryMessage">Partner inquiry details</Label>
        <Textarea
          id="inquiryMessage"
          name="inquiryMessage"
          placeholder="Share your service scope, locations, and integration interest."
          required
        />
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-700">{success}</p> : null}

      <Button size="lg" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Submit inquiry"}
      </Button>
    </form>
  );
}
