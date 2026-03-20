"use client";

import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type AccountSettingsFormProps = {
  initialValues: {
    fullName: string;
    email: string;
    phone: string;
    locale: string;
  };
};

export function AccountSettingsForm({ initialValues }: AccountSettingsFormProps) {
  const [fullName, setFullName] = useState(initialValues.fullName);
  const [phone, setPhone] = useState(initialValues.phone);
  const [locale, setLocale] = useState(initialValues.locale);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!fullName.trim()) {
      setError("Full name is required.");
      return;
    }

    setIsSubmitting(true);

    const response = await fetch("/api/patient/account-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
        locale,
      }),
    });

    const payload = (await response.json()) as { message?: string };

    if (!response.ok) {
      setError(payload.message ?? "Unable to save account settings.");
      setIsSubmitting(false);
      return;
    }

    setSuccess("Account settings updated.");
    setIsSubmitting(false);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="settings-email">Email</Label>
        <Input id="settings-email" value={initialValues.email} disabled />
      </div>
      <div>
        <Label htmlFor="settings-fullName">Full name</Label>
        <Input
          id="settings-fullName"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="settings-phone">Phone</Label>
        <Input
          id="settings-phone"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="settings-locale">Language</Label>
        <Select
          id="settings-locale"
          value={locale}
          onChange={(event) => setLocale(event.target.value)}
        >
          <option value="vi-VN">Vietnamese (vi-VN)</option>
          <option value="en-US">English (en-US)</option>
        </Select>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-700">{success}</p> : null}

      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Save settings"}
      </Button>
    </form>
  );
}
