"use client";

import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type PrescriptionOption = {
  id: string;
  label: string;
};

type MedicinePlanFormProps = {
  prescriptions: PrescriptionOption[];
};

export function MedicinePlanForm({ prescriptions }: MedicinePlanFormProps) {
  const [prescriptionId, setPrescriptionId] = useState(prescriptions[0]?.id ?? "");
  const [medicineName, setMedicineName] = useState("");
  const [timingLabel, setTimingLabel] = useState("");
  const [dosageInstruction, setDosageInstruction] = useState("");
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

    if (!prescriptionId) {
      setError("Prescription is required.");
      return;
    }

    if (!medicineName.trim() || !timingLabel.trim()) {
      setError("Medicine name and timing label are required.");
      return;
    }

    const times = Number.parseInt(timesPerDay, 10);
    const cycle = Number.parseInt(cycleDays, 10);

    setIsSubmitting(true);

    const response = await fetch("/api/admin/medicine-plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prescriptionId,
        medicineName: medicineName.trim(),
        timingLabel: timingLabel.trim(),
        dosageInstruction: dosageInstruction.trim() || undefined,
        timesPerDay: times,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
        cycleDays: cycle,
      }),
    });

    const payload = (await response.json()) as { message?: string };

    if (!response.ok) {
      setError(payload.message ?? "Unable to save medicine plan.");
      setIsSubmitting(false);
      return;
    }

    setSuccess("Medicine plan saved.");
    setIsSubmitting(false);

    setTimeout(() => {
      window.location.reload();
    }, 700);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="medicine-plan-prescription">Prescription</Label>
        <Select
          id="medicine-plan-prescription"
          value={prescriptionId}
          onChange={(event) => setPrescriptionId(event.target.value)}
          required
        >
          <option value="" disabled>
            Select prescription
          </option>
          {prescriptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="medicine-plan-name">Medicine name</Label>
          <Input
            id="medicine-plan-name"
            value={medicineName}
            onChange={(event) => setMedicineName(event.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="medicine-plan-timing">Timing label</Label>
          <Input
            id="medicine-plan-timing"
            value={timingLabel}
            onChange={(event) => setTimingLabel(event.target.value)}
            placeholder="08:00 and 20:00"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="medicine-plan-dosage">Dosage instruction</Label>
        <Textarea
          id="medicine-plan-dosage"
          value={dosageInstruction}
          onChange={(event) => setDosageInstruction(event.target.value)}
          maxLength={300}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <div>
          <Label htmlFor="medicine-plan-times">Times/day</Label>
          <Input
            id="medicine-plan-times"
            type="number"
            min={1}
            max={6}
            value={timesPerDay}
            onChange={(event) => setTimesPerDay(event.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="medicine-plan-cycle">Cycle days</Label>
          <Input
            id="medicine-plan-cycle"
            type="number"
            min={1}
            max={180}
            value={cycleDays}
            onChange={(event) => setCycleDays(event.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="medicine-plan-start">Start</Label>
          <Input
            id="medicine-plan-start"
            type="datetime-local"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="medicine-plan-end">End</Label>
          <Input
            id="medicine-plan-end"
            type="datetime-local"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
          />
        </div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-700">{success}</p> : null}

      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Save medicine plan"}
      </Button>
    </form>
  );
}
