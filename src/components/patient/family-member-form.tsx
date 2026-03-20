"use client";

import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type FamilyMemberFormProps = {
  onCreated?: () => void;
};

export function FamilyMemberForm({ onCreated }: FamilyMemberFormProps) {
  const [fullName, setFullName] = useState("");
  const [relationship, setRelationship] = useState("SPOUSE");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [phone, setPhone] = useState("");
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

    const response = await fetch("/api/patient/family-members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: fullName.trim(),
        relationship,
        dateOfBirth: dateOfBirth || undefined,
        phone: phone.trim() || undefined,
      }),
    });

    const payload = (await response.json()) as { message?: string };

    if (!response.ok) {
      setError(payload.message ?? "Unable to add family profile.");
      setIsSubmitting(false);
      return;
    }

    setSuccess("Family profile added.");
    setFullName("");
    setDateOfBirth("");
    setPhone("");
    setIsSubmitting(false);
    onCreated?.();
    setTimeout(() => {
      window.location.reload();
    }, 500);
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div>
        <Label htmlFor="family-full-name">Full name</Label>
        <Input
          id="family-full-name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          required
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="family-relationship">Relationship</Label>
          <Select
            id="family-relationship"
            value={relationship}
            onChange={(event) => setRelationship(event.target.value)}
          >
            <option value="SPOUSE">Spouse</option>
            <option value="CHILD">Child</option>
            <option value="PARENT">Parent</option>
            <option value="SIBLING">Sibling</option>
            <option value="CAREGIVER">Caregiver</option>
            <option value="OTHER">Other</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="family-dob">Date of birth</Label>
          <Input
            id="family-dob"
            type="date"
            value={dateOfBirth}
            onChange={(event) => setDateOfBirth(event.target.value)}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="family-phone">Phone (optional)</Label>
        <Input
          id="family-phone"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="e.g. +84..."
        />
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-700">{success}</p> : null}

      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Add family profile"}
      </Button>
    </form>
  );
}
