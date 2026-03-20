"use client";

import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type HospitalFormProps = {
  initial?: {
    id?: string;
    name?: string;
    code?: string | null;
    city?: string | null;
    status?: "ACTIVE" | "INACTIVE";
    isBookingVisible?: boolean;
  };
  title: string;
  submitLabel: string;
};

export function HospitalManagementForm({
  initial,
  title,
  submitLabel,
}: HospitalFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [code, setCode] = useState(initial?.code ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">(
    initial?.status ?? "ACTIVE",
  );
  const [isBookingVisible, setIsBookingVisible] = useState(
    initial?.isBookingVisible ?? true,
  );

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim()) {
      setError("Hospital name is required.");
      return;
    }

    setIsSubmitting(true);

    const response = await fetch("/api/admin/facilities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "HOSPITAL",
        id: initial?.id,
        name: name.trim(),
        code: code.trim() || undefined,
        city: city.trim() || undefined,
        status,
        isBookingVisible,
      }),
    });

    const payload = (await response.json()) as { message?: string };

    if (!response.ok) {
      setError(payload.message ?? "Unable to save hospital.");
      setIsSubmitting(false);
      return;
    }

    setSuccess("Hospital saved.");
    setIsSubmitting(false);

    setTimeout(() => {
      window.location.reload();
    }, 700);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <p className="text-base font-semibold text-slate-900">{title}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor={`hospital-name-${initial?.id ?? "new"}`}>Name</Label>
          <Input
            id={`hospital-name-${initial?.id ?? "new"}`}
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor={`hospital-code-${initial?.id ?? "new"}`}>Code</Label>
          <Input
            id={`hospital-code-${initial?.id ?? "new"}`}
            value={code}
            onChange={(event) => setCode(event.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <Label htmlFor={`hospital-city-${initial?.id ?? "new"}`}>City</Label>
          <Input
            id={`hospital-city-${initial?.id ?? "new"}`}
            value={city}
            onChange={(event) => setCity(event.target.value)}
          />
        </div>
        <div>
          <Label htmlFor={`hospital-status-${initial?.id ?? "new"}`}>Status</Label>
          <Select
            id={`hospital-status-${initial?.id ?? "new"}`}
            value={status}
            onChange={(event) => setStatus(event.target.value as "ACTIVE" | "INACTIVE")}
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </Select>
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={isBookingVisible}
              onChange={(event) => setIsBookingVisible(event.target.checked)}
            />
            Booking visible
          </label>
        </div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-700">{success}</p> : null}

      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}

type ClinicOption = {
  id: string;
  name: string;
};

type ClinicFormProps = {
  hospitalOptions: ClinicOption[];
  initial?: {
    id?: string;
    hospitalId?: string | null;
    name?: string;
    code?: string | null;
    city?: string | null;
    status?: "ACTIVE" | "INACTIVE";
    isBookingVisible?: boolean;
  };
  title: string;
  submitLabel: string;
};

export function ClinicManagementForm({
  hospitalOptions,
  initial,
  title,
  submitLabel,
}: ClinicFormProps) {
  const [hospitalId, setHospitalId] = useState(initial?.hospitalId ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [code, setCode] = useState(initial?.code ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">(
    initial?.status ?? "ACTIVE",
  );
  const [isBookingVisible, setIsBookingVisible] = useState(
    initial?.isBookingVisible ?? true,
  );

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim()) {
      setError("Clinic name is required.");
      return;
    }

    setIsSubmitting(true);

    const response = await fetch("/api/admin/facilities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "CLINIC",
        id: initial?.id,
        hospitalId: hospitalId || undefined,
        name: name.trim(),
        code: code.trim() || undefined,
        city: city.trim() || undefined,
        status,
        isBookingVisible,
      }),
    });

    const payload = (await response.json()) as { message?: string };

    if (!response.ok) {
      setError(payload.message ?? "Unable to save clinic.");
      setIsSubmitting(false);
      return;
    }

    setSuccess("Clinic saved.");
    setIsSubmitting(false);

    setTimeout(() => {
      window.location.reload();
    }, 700);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <p className="text-base font-semibold text-slate-900">{title}</p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor={`clinic-name-${initial?.id ?? "new"}`}>Name</Label>
          <Input
            id={`clinic-name-${initial?.id ?? "new"}`}
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor={`clinic-code-${initial?.id ?? "new"}`}>Code</Label>
          <Input
            id={`clinic-code-${initial?.id ?? "new"}`}
            value={code}
            onChange={(event) => setCode(event.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <Label htmlFor={`clinic-city-${initial?.id ?? "new"}`}>City</Label>
          <Input
            id={`clinic-city-${initial?.id ?? "new"}`}
            value={city}
            onChange={(event) => setCity(event.target.value)}
          />
        </div>
        <div>
          <Label htmlFor={`clinic-hospital-${initial?.id ?? "new"}`}>Hospital</Label>
          <Select
            id={`clinic-hospital-${initial?.id ?? "new"}`}
            value={hospitalId}
            onChange={(event) => setHospitalId(event.target.value)}
          >
            <option value="">No hospital</option>
            {hospitalOptions.map((hospital) => (
              <option key={hospital.id} value={hospital.id}>
                {hospital.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor={`clinic-status-${initial?.id ?? "new"}`}>Status</Label>
          <Select
            id={`clinic-status-${initial?.id ?? "new"}`}
            value={status}
            onChange={(event) => setStatus(event.target.value as "ACTIVE" | "INACTIVE")}
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </Select>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={isBookingVisible}
          onChange={(event) => setIsBookingVisible(event.target.checked)}
        />
        Booking visible
      </label>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-700">{success}</p> : null}

      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
