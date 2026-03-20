"use client";

import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type PrescriptionReviewFormProps = {
  prescriptionId: string;
  initialStatus: string;
  defaultNote?: string | null;
};

export function PrescriptionReviewForm({
  prescriptionId,
  initialStatus,
  defaultNote,
}: PrescriptionReviewFormProps) {
  const [action, setAction] = useState<"APPROVE" | "REJECT" | "IN_REVIEW">(
    initialStatus === "ACTIVE"
      ? "APPROVE"
      : initialStatus === "REJECTED"
        ? "REJECT"
        : "IN_REVIEW",
  );
  const [reviewNote, setReviewNote] = useState(defaultNote ?? "");

  const [medicineName, setMedicineName] = useState("");
  const [dosageInstruction, setDosageInstruction] = useState("");
  const [timingLabel, setTimingLabel] = useState("");
  const [timesPerDay, setTimesPerDay] = useState("1");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [cycleDays, setCycleDays] = useState("30");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const timesValue = Number.parseInt(timesPerDay, 10);
    const cycleValue = Number.parseInt(cycleDays, 10);

    setIsSubmitting(true);

    const payload = {
      action,
      reviewNote: reviewNote.trim() || undefined,
      medicineName: medicineName.trim() || undefined,
      dosageInstruction: dosageInstruction.trim() || undefined,
      timingLabel: timingLabel.trim() || undefined,
      timesPerDay: Number.isFinite(timesValue) ? timesValue : undefined,
      startDate: startDate ? new Date(startDate).toISOString() : undefined,
      endDate: endDate ? new Date(endDate).toISOString() : undefined,
      cycleDays: Number.isFinite(cycleValue) ? cycleValue : undefined,
    };

    const response = await fetch(`/api/admin/prescriptions/${prescriptionId}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const responsePayload = (await response.json()) as {
      message?: string;
    };

    if (!response.ok) {
      setError(responsePayload.message ?? "Unable to save prescription review.");
      setIsSubmitting(false);
      return;
    }

    setSuccess("Prescription review saved.");
    setIsSubmitting(false);

    setTimeout(() => {
      window.location.reload();
    }, 700);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor={`review-action-${prescriptionId}`}>Review action</Label>
          <Select
            id={`review-action-${prescriptionId}`}
            value={action}
            onChange={(event) =>
              setAction(event.target.value as "APPROVE" | "REJECT" | "IN_REVIEW")
            }
          >
            <option value="IN_REVIEW">Mark in review</option>
            <option value="APPROVE">Approve prescription</option>
            <option value="REJECT">Reject prescription</option>
          </Select>
        </div>

        <div>
          <Label htmlFor={`review-cycle-days-${prescriptionId}`}>Refill cycle days</Label>
          <Input
            id={`review-cycle-days-${prescriptionId}`}
            type="number"
            min={1}
            max={180}
            value={cycleDays}
            onChange={(event) => setCycleDays(event.target.value)}
          />
        </div>
      </div>

      <div>
        <Label htmlFor={`review-note-${prescriptionId}`}>Review note</Label>
        <Textarea
          id={`review-note-${prescriptionId}`}
          value={reviewNote}
          onChange={(event) => setReviewNote(event.target.value)}
          maxLength={1000}
          placeholder="Add neutral review notes for uploaded prescription handling."
        />
      </div>

      <div className="rounded-xl border border-border bg-muted/40 p-4">
        <p className="mb-3 text-sm font-semibold text-slate-900">
          Medicine schedule (optional)
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor={`review-medicine-name-${prescriptionId}`}>Medicine name</Label>
            <Input
              id={`review-medicine-name-${prescriptionId}`}
              value={medicineName}
              onChange={(event) => setMedicineName(event.target.value)}
            />
          </div>
          <div>
            <Label htmlFor={`review-timing-label-${prescriptionId}`}>Timing label</Label>
            <Input
              id={`review-timing-label-${prescriptionId}`}
              value={timingLabel}
              onChange={(event) => setTimingLabel(event.target.value)}
              placeholder="08:00 and 20:00"
            />
          </div>
          <div>
            <Label htmlFor={`review-times-per-day-${prescriptionId}`}>Times per day</Label>
            <Input
              id={`review-times-per-day-${prescriptionId}`}
              type="number"
              min={1}
              max={6}
              value={timesPerDay}
              onChange={(event) => setTimesPerDay(event.target.value)}
            />
          </div>
          <div>
            <Label htmlFor={`review-dosage-${prescriptionId}`}>Dosage instruction</Label>
            <Input
              id={`review-dosage-${prescriptionId}`}
              value={dosageInstruction}
              onChange={(event) => setDosageInstruction(event.target.value)}
            />
          </div>
          <div>
            <Label htmlFor={`review-start-${prescriptionId}`}>Start date</Label>
            <Input
              id={`review-start-${prescriptionId}`}
              type="datetime-local"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </div>
          <div>
            <Label htmlFor={`review-end-${prescriptionId}`}>End date</Label>
            <Input
              id={`review-end-${prescriptionId}`}
              type="datetime-local"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </div>
        </div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-700">{success}</p> : null}

      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Save prescription review"}
      </Button>
    </form>
  );
}
