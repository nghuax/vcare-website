"use client";

import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type InsuranceReviewFormProps = {
  insuranceRecordId: string;
  initialStatus: string;
};

export function InsuranceReviewForm({
  insuranceRecordId,
  initialStatus,
}: InsuranceReviewFormProps) {
  const [action, setAction] = useState<"VERIFY" | "REJECT" | "REQUEST_INFO">(
    initialStatus === "VERIFIED"
      ? "VERIFY"
      : initialStatus === "REJECTED"
        ? "REJECT"
        : "REQUEST_INFO",
  );
  const [note, setNote] = useState("");
  const [isPatientVisible, setIsPatientVisible] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    const response = await fetch(`/api/admin/insurance/${insuranceRecordId}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        note: note.trim() || undefined,
        isPatientVisible,
      }),
    });

    const payload = (await response.json()) as { message?: string };

    if (!response.ok) {
      setError(payload.message ?? "Unable to save insurance review.");
      setIsSubmitting(false);
      return;
    }

    setSuccess("Insurance review saved.");
    setIsSubmitting(false);

    setTimeout(() => {
      window.location.reload();
    }, 700);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor={`insurance-action-${insuranceRecordId}`}>Verification action</Label>
        <Select
          id={`insurance-action-${insuranceRecordId}`}
          value={action}
          onChange={(event) =>
            setAction(event.target.value as "VERIFY" | "REJECT" | "REQUEST_INFO")
          }
        >
          <option value="REQUEST_INFO">Request more information</option>
          <option value="VERIFY">Mark verified</option>
          <option value="REJECT">Mark rejected</option>
        </Select>
      </div>

      <div>
        <Label htmlFor={`insurance-note-${insuranceRecordId}`}>Verification note</Label>
        <Textarea
          id={`insurance-note-${insuranceRecordId}`}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Add neutral document/status review note."
          maxLength={1000}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={isPatientVisible}
          onChange={(event) => setIsPatientVisible(event.target.checked)}
        />
        Patient-visible note
      </label>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-700">{success}</p> : null}

      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Save insurance review"}
      </Button>
    </form>
  );
}
