"use client";

import { useMemo, useState } from "react";

import { DoctorCard } from "@/components/patient/doctor-card";
import { StatusChip } from "@/components/patient/status-chip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, formatDateTime } from "@/lib/date";

type AppointmentFacility = {
  id: string;
  type: "HOSPITAL" | "CLINIC";
  name: string;
  city: string | null;
  addressLine: string | null;
  linkedHospitalName: string | null;
};

type AppointmentSlot = {
  id: string;
  doctorId: string;
  doctorName: string;
  hospitalId: string | null;
  clinicId: string | null;
  clinicName: string | null;
  hospitalName: string | null;
  startsAt: string;
  endsAt: string;
};

type AppointmentDoctor = {
  id: string;
  fullName: string;
  specialty: string | null;
  doctorInformation: string | null;
  profileImageUrl: string | null;
  yearsOfExperience: number | null;
  hospitalId: string | null;
  clinicId: string | null;
  hospitalName: string | null;
  clinicName: string | null;
  ratingScore: number;
  reviewCount: number;
  consultationFeeLabel: string;
  availableSlots: AppointmentSlot[];
};

type AppointmentFamilyMember = {
  id: string;
  fullName: string;
  relationship: string;
};

type BookingFlowData = {
  facilities: AppointmentFacility[];
  doctors: AppointmentDoctor[];
  familyMembers: AppointmentFamilyMember[];
  insuranceStatus: {
    insuranceRecordId: string | null;
    status: string;
    statusLabel: string;
    statusDescription: string;
    submittedAt: string | null;
  };
};

type AppointmentBookingFlowProps = {
  data: BookingFlowData;
};

const steps = [
  "Choose hospital/clinic",
  "Choose doctor",
  "Choose time slot",
  "Review insurance",
  "Confirm request",
];

export function AppointmentBookingFlow({ data }: AppointmentBookingFlowProps) {
  const [step, setStep] = useState(1);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>("");
  const [selectedFacilityType, setSelectedFacilityType] = useState<
    "HOSPITAL" | "CLINIC" | ""
  >("");
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [selectedSlotId, setSelectedSlotId] = useState<string>("");
  const [selectedFamilyMemberId, setSelectedFamilyMemberId] = useState<string>("");
  const [appointmentRequestNote, setAppointmentRequestNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedFacility = useMemo(
    () =>
      data.facilities.find(
        (facility) =>
          facility.id === selectedFacilityId && facility.type === selectedFacilityType,
      ) ?? null,
    [data.facilities, selectedFacilityId, selectedFacilityType],
  );

  const facilityDoctors = useMemo(() => {
    if (!selectedFacility) {
      return [];
    }

    return data.doctors.filter((doctor) => {
      if (selectedFacility.type === "HOSPITAL") {
        return doctor.hospitalId === selectedFacility.id;
      }

      return doctor.clinicId === selectedFacility.id;
    });
  }, [data.doctors, selectedFacility]);

  const selectedDoctor = useMemo(
    () => facilityDoctors.find((doctor) => doctor.id === selectedDoctorId) ?? null,
    [facilityDoctors, selectedDoctorId],
  );

  const availableSlots = useMemo(() => {
    const slotsSource = selectedDoctor ? [selectedDoctor] : facilityDoctors;

    return slotsSource
      .flatMap((doctor) => doctor.availableSlots)
      .filter((slot) => {
        if (!selectedFacility) {
          return false;
        }

        if (selectedFacility.type === "HOSPITAL") {
          return slot.hospitalId === selectedFacility.id;
        }

        return slot.clinicId === selectedFacility.id;
      })
      .sort((slotA, slotB) => {
        const a = new Date(slotA.startsAt).getTime();
        const b = new Date(slotB.startsAt).getTime();
        return a - b;
      });
  }, [facilityDoctors, selectedDoctor, selectedFacility]);

  const selectedSlot = useMemo(
    () => availableSlots.find((slot) => slot.id === selectedSlotId) ?? null,
    [availableSlots, selectedSlotId],
  );

  const selectedDoctorFromSlot = useMemo(
    () =>
      data.doctors.find((doctor) => doctor.id === selectedSlot?.doctorId) ??
      selectedDoctor,
    [data.doctors, selectedSlot, selectedDoctor],
  );

  function goNext() {
    setError(null);

    if (step === 1 && !selectedFacility) {
      setError("Select a hospital or clinic to continue.");
      return;
    }

    if (step === 3 && !selectedSlot) {
      setError("Select a time slot to continue.");
      return;
    }

    setStep((current) => Math.min(current + 1, 5));
  }

  function goBack() {
    setError(null);
    setStep((current) => Math.max(current - 1, 1));
  }

  async function submitAppointmentRequest() {
    if (!selectedFacility || !selectedSlot) {
      setError("Facility and time slot are required.");
      return;
    }

    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    const response = await fetch("/api/patient/appointments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        facilityType: selectedFacility.type,
        facilityId: selectedFacility.id,
        doctorId: selectedDoctor?.id || undefined,
        slotId: selectedSlot.id,
        familyMemberId: selectedFamilyMemberId || undefined,
        appointmentRequestNote: appointmentRequestNote.trim() || undefined,
      }),
    });

    const payload = (await response.json()) as {
      message?: string;
      data?: { appointmentRequestId?: string };
    };

    if (!response.ok) {
      setError(payload.message ?? "Unable to submit appointment request.");
      setIsSubmitting(false);
      return;
    }

    setSuccess(
      `Appointment request submitted. Reference: ${
        payload.data?.appointmentRequestId ?? "pending"
      }`,
    );
    setIsSubmitting(false);
  }

  function onFacilitySelect(facility: AppointmentFacility) {
    setSelectedFacilityId(facility.id);
    setSelectedFacilityType(facility.type);
    setSelectedDoctorId("");
    setSelectedSlotId("");
    setError(null);
    setSuccess(null);
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Appointment Request Flow
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-5">
          {steps.map((label, index) => {
            const stepNumber = index + 1;
            const isActive = step === stepNumber;
            const isComplete = step > stepNumber;

            return (
              <div
                key={label}
                className={`rounded-xl border px-3 py-2 text-xs sm:text-sm ${
                  isActive
                    ? "border-primary bg-primary/10 text-primary"
                    : isComplete
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-border bg-muted/40 text-muted-foreground"
                }`}
              >
                <p className="font-semibold">Step {stepNumber}</p>
                <p>{label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {step === 1 ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Choose hospital or clinic</h2>
            <p className="text-sm text-muted-foreground">
              Select one partner hospital or clinic for this appointment request.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {data.facilities.map((facility) => {
              const isSelected =
                facility.id === selectedFacilityId && facility.type === selectedFacilityType;

              return (
                <button
                  key={`${facility.type}-${facility.id}`}
                  type="button"
                  onClick={() => onFacilitySelect(facility)}
                  className={`rounded-2xl border p-4 text-left transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-slate-900">{facility.name}</h3>
                    <Badge variant={facility.type === "HOSPITAL" ? "default" : "neutral"}>
                      {facility.type.toLowerCase()}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{facility.addressLine ?? "-"}</p>
                  <p className="text-sm text-muted-foreground">{facility.city ?? "-"}</p>
                  {facility.linkedHospitalName ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Hospital: {facility.linkedHospitalName}
                    </p>
                  ) : null}
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Choose doctor (optional)</h2>
              <p className="text-sm text-muted-foreground">
                Select a doctor or continue with no preference.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Rating and review counts are patient feedback summaries and are not
                medically authoritative.
              </p>
            </div>
            <Button
              type="button"
              size="lg"
              variant={selectedDoctorId ? "outline" : "secondary"}
              onClick={() => {
                setSelectedDoctorId("");
                setSelectedSlotId("");
              }}
            >
              No doctor preference
            </Button>
          </div>

          {!facilityDoctors.length ? (
            <EmptyState
              title="No doctors listed"
              description="No active doctor information is currently available for the selected facility."
            />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {facilityDoctors.map((doctor) => (
                <DoctorCard
                  key={doctor.id}
                  doctor={doctor}
                  isSelected={selectedDoctorId === doctor.id}
                  onSelect={(doctorId) => {
                    setSelectedDoctorId(doctorId);
                    setSelectedSlotId("");
                  }}
                />
              ))}
            </div>
          )}
        </section>
      ) : null}

      {step === 3 ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Choose time slot</h2>
            <p className="text-sm text-muted-foreground">
              Select an available schedule slot to continue the appointment request.
            </p>
          </div>

          {!availableSlots.length ? (
            <EmptyState
              title="No open slots"
              description="No open schedule slots are currently listed for the selected facility and doctor selection."
            />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {availableSlots.map((slot) => {
                const isSelected = slot.id === selectedSlotId;

                return (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => setSelectedSlotId(slot.id)}
                    className={`rounded-2xl border p-4 text-left ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:border-primary/40"
                    }`}
                  >
                    <p className="font-semibold text-slate-900">{slot.doctorName}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {slot.clinicName
                        ? `${slot.clinicName}${slot.hospitalName ? ` · ${slot.hospitalName}` : ""}`
                        : slot.hospitalName ?? "Facility pending"}
                    </p>
                    <p className="mt-2 text-base font-semibold text-primary">
                      {formatDateTime(slot.startsAt)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Ends: {formatDateTime(slot.endsAt)}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      ) : null}

      {step === 4 ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Review insurance status</h2>
            <p className="text-sm text-muted-foreground">
              Insurance status is shown for transparency before confirming appointment request.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-slate-900">Insurance verification status</p>
              <StatusChip status={data.insuranceStatus.statusLabel.replaceAll(" ", "_")} />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {data.insuranceStatus.statusDescription}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Last upload: {formatDate(data.insuranceStatus.submittedAt)}
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              Uploaded insurance will be reviewed by clinic or hospital staff. No automatic
              insurance approval is provided in this portal.
            </p>
          </div>
        </section>
      ) : null}

      {step === 5 ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Confirm appointment request</h2>
            <p className="text-sm text-muted-foreground">
              Confirm selected hospital/clinic, selected doctor, and selected time slot.
            </p>
          </div>

          <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <p className="font-semibold text-slate-900">Selected hospital/clinic</p>
                <p className="text-muted-foreground">{selectedFacility?.name ?? "-"}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Selected doctor</p>
                <p className="text-muted-foreground">
                  {selectedDoctor?.fullName ?? selectedDoctorFromSlot?.fullName ?? "No preference"}
                </p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Selected slot</p>
                <p className="text-muted-foreground">
                  {selectedSlot ? formatDateTime(selectedSlot.startsAt) : "-"}
                </p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Insurance status</p>
                <p className="text-muted-foreground">{data.insuranceStatus.statusLabel}</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="appointment-family-profile">Family profile (optional)</Label>
                <Select
                  id="appointment-family-profile"
                  value={selectedFamilyMemberId}
                  onChange={(event) => setSelectedFamilyMemberId(event.target.value)}
                >
                  <option value="">For myself</option>
                  {data.familyMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.fullName} ({member.relationship.toLowerCase()})
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="appointment-contact-placeholder">Contact confirmation</Label>
                <Input
                  id="appointment-contact-placeholder"
                  value="We will use your account phone/email"
                  readOnly
                />
              </div>
            </div>

            <div>
              <Label htmlFor="appointment-note">Appointment request note (optional)</Label>
              <Textarea
                id="appointment-note"
                value={appointmentRequestNote}
                onChange={(event) => setAppointmentRequestNote(event.target.value)}
                maxLength={500}
                placeholder="Add a neutral request note for scheduling context."
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {appointmentRequestNote.length}/500
              </p>
            </div>

            {success ? <p className="text-sm text-emerald-700">{success}</p> : null}
          </div>
        </section>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          size="lg"
          variant="outline"
          onClick={goBack}
          disabled={step === 1 || isSubmitting}
        >
          Back
        </Button>

        {step < 5 ? (
          <Button type="button" size="lg" onClick={goNext}>
            Continue
          </Button>
        ) : (
          <Button
            type="button"
            size="lg"
            disabled={isSubmitting || Boolean(success)}
            onClick={submitAppointmentRequest}
          >
            {isSubmitting ? "Submitting..." : "Confirm appointment request"}
          </Button>
        )}
      </div>
    </div>
  );
}
