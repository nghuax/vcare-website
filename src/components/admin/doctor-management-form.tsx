"use client";

import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type Option = {
  id: string;
  name: string;
};

type DoctorFormData = {
  doctorId?: string;
  fullName?: string;
  specialty?: string | null;
  hospitalId?: string | null;
  clinicId?: string | null;
  licenseNumber?: string | null;
  doctorInformation?: string | null;
  consultationFeeNote?: string | null;
  yearsOfExperience?: number | null;
  status?: "ACTIVE" | "INACTIVE";
};

type DoctorManagementFormProps = {
  title: string;
  submitLabel: string;
  hospitalOptions: Option[];
  clinicOptions: Array<Option & { hospitalId: string | null }>;
  initial?: DoctorFormData;
};

export function DoctorManagementForm({
  title,
  submitLabel,
  hospitalOptions,
  clinicOptions,
  initial,
}: DoctorManagementFormProps) {
  const [fullName, setFullName] = useState(initial?.fullName ?? "");
  const [specialty, setSpecialty] = useState(initial?.specialty ?? "");
  const [hospitalId, setHospitalId] = useState(initial?.hospitalId ?? "");
  const [clinicId, setClinicId] = useState(initial?.clinicId ?? "");
  const [licenseNumber, setLicenseNumber] = useState(initial?.licenseNumber ?? "");
  const [doctorInformation, setDoctorInformation] = useState(
    initial?.doctorInformation ?? "",
  );
  const [consultationFeeNote, setConsultationFeeNote] = useState(
    initial?.consultationFeeNote ?? "",
  );
  const [yearsOfExperience, setYearsOfExperience] = useState(
    initial?.yearsOfExperience ? String(initial.yearsOfExperience) : "",
  );
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">(
    initial?.status ?? "ACTIVE",
  );
  const [slotStartsAt, setSlotStartsAt] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!fullName.trim()) {
      setError("Doctor name is required.");
      return;
    }

    const yearsValue = Number.parseInt(yearsOfExperience, 10);

    const normalizedSlots: string[] = [];

    for (const slotValue of slotStartsAt.split("\n").map((item) => item.trim()).filter(Boolean)) {
      const parsedSlot = new Date(slotValue);

      if (Number.isNaN(parsedSlot.getTime())) {
        setError("Invalid slot input values.");
        return;
      }

      normalizedSlots.push(parsedSlot.toISOString());
    }

    setIsSubmitting(true);

    const response = await fetch("/api/admin/doctors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        doctorId: initial?.doctorId,
        fullName: fullName.trim(),
        specialty: specialty.trim() || undefined,
        hospitalId: hospitalId || undefined,
        clinicId: clinicId || undefined,
        licenseNumber: licenseNumber.trim() || undefined,
        doctorInformation: doctorInformation.trim() || undefined,
        consultationFeeNote: consultationFeeNote.trim() || undefined,
        yearsOfExperience: Number.isFinite(yearsValue) ? yearsValue : undefined,
        status,
        slotStartsAt: normalizedSlots.length ? normalizedSlots : undefined,
      }),
    });

    const payload = (await response.json()) as { message?: string };

    if (!response.ok) {
      setError(payload.message ?? "Unable to save doctor information.");
      setIsSubmitting(false);
      return;
    }

    setSuccess("Doctor information saved.");
    setIsSubmitting(false);

    setTimeout(() => {
      window.location.reload();
    }, 700);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-border bg-card p-4">
      <p className="text-base font-semibold text-slate-900">{title}</p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor={`doctor-name-${initial?.doctorId ?? "new"}`}>Doctor name</Label>
          <Input
            id={`doctor-name-${initial?.doctorId ?? "new"}`}
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor={`doctor-specialty-${initial?.doctorId ?? "new"}`}>Specialty</Label>
          <Input
            id={`doctor-specialty-${initial?.doctorId ?? "new"}`}
            value={specialty}
            onChange={(event) => setSpecialty(event.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Label htmlFor={`doctor-hospital-${initial?.doctorId ?? "new"}`}>Hospital</Label>
          <Select
            id={`doctor-hospital-${initial?.doctorId ?? "new"}`}
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
          <Label htmlFor={`doctor-clinic-${initial?.doctorId ?? "new"}`}>Clinic</Label>
          <Select
            id={`doctor-clinic-${initial?.doctorId ?? "new"}`}
            value={clinicId}
            onChange={(event) => setClinicId(event.target.value)}
          >
            <option value="">No clinic</option>
            {clinicOptions.map((clinic) => (
              <option key={clinic.id} value={clinic.id}>
                {clinic.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor={`doctor-license-${initial?.doctorId ?? "new"}`}>License number</Label>
          <Input
            id={`doctor-license-${initial?.doctorId ?? "new"}`}
            value={licenseNumber}
            onChange={(event) => setLicenseNumber(event.target.value)}
          />
        </div>
        <div>
          <Label htmlFor={`doctor-years-${initial?.doctorId ?? "new"}`}>Years experience</Label>
          <Input
            id={`doctor-years-${initial?.doctorId ?? "new"}`}
            type="number"
            min={0}
            max={70}
            value={yearsOfExperience}
            onChange={(event) => setYearsOfExperience(event.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor={`doctor-fee-${initial?.doctorId ?? "new"}`}>
            Consultation fee placeholder
          </Label>
          <Input
            id={`doctor-fee-${initial?.doctorId ?? "new"}`}
            value={consultationFeeNote}
            onChange={(event) => setConsultationFeeNote(event.target.value)}
            placeholder="Fee details confirmed by staff"
          />
        </div>
        <div>
          <Label htmlFor={`doctor-status-${initial?.doctorId ?? "new"}`}>Status</Label>
          <Select
            id={`doctor-status-${initial?.doctorId ?? "new"}`}
            value={status}
            onChange={(event) => setStatus(event.target.value as "ACTIVE" | "INACTIVE")}
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor={`doctor-bio-${initial?.doctorId ?? "new"}`}>Doctor information</Label>
        <Textarea
          id={`doctor-bio-${initial?.doctorId ?? "new"}`}
          value={doctorInformation}
          onChange={(event) => setDoctorInformation(event.target.value)}
          maxLength={600}
        />
      </div>

      <div>
        <Label htmlFor={`doctor-slots-${initial?.doctorId ?? "new"}`}>
          Availability slots (one ISO datetime per line)
        </Label>
        <Textarea
          id={`doctor-slots-${initial?.doctorId ?? "new"}`}
          value={slotStartsAt}
          onChange={(event) => setSlotStartsAt(event.target.value)}
          placeholder="2026-03-22T09:00:00.000Z"
        />
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-700">{success}</p> : null}

      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
