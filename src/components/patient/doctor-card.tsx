"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/date";

type DoctorCardItem = {
  id: string;
  fullName: string;
  specialty: string | null;
  doctorInformation: string | null;
  profileImageUrl: string | null;
  yearsOfExperience: number | null;
  hospitalName: string | null;
  clinicName: string | null;
  ratingScore: number;
  reviewCount: number;
  consultationFeeLabel: string;
  availableSlots: Array<{
    id: string;
    startsAt: string | Date;
    endsAt: string | Date;
  }>;
};

type DoctorCardProps = {
  doctor: DoctorCardItem;
  isSelected: boolean;
  onSelect: (doctorId: string) => void;
};

export function DoctorCard({ doctor, isSelected, onSelect }: DoctorCardProps) {
  const facilityLabel = doctor.clinicName
    ? `${doctor.clinicName}${doctor.hospitalName ? ` · ${doctor.hospitalName}` : ""}`
    : doctor.hospitalName ?? "Facility to be confirmed";

  return (
    <div
      className={`rounded-2xl border p-4 shadow-sm ${
        isSelected ? "border-primary bg-primary/5" : "border-border bg-card"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {doctor.profileImageUrl ? (
            <img
              src={doctor.profileImageUrl}
              alt={doctor.fullName}
              className="h-12 w-12 rounded-full border border-border object-cover"
            />
          ) : (
            <div className="h-12 w-12 rounded-full border border-border bg-muted" />
          )}
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{doctor.fullName}</h3>
            <p className="text-sm text-muted-foreground">{doctor.specialty ?? "General Care"}</p>
          </div>
        </div>
        <Badge variant="neutral">Doctor information</Badge>
      </div>

      <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
        <p>Hospital/clinic: {facilityLabel}</p>
        <p>Years of experience: {doctor.yearsOfExperience ?? "-"}</p>
        <p>Consultation fee: {doctor.consultationFeeLabel}</p>
        <p>
          Rating: {doctor.ratingScore.toFixed(1)} / 5.0 ({doctor.reviewCount} reviews)
        </p>
      </div>

      <p className="mt-3 text-sm text-slate-700">
        {doctor.doctorInformation ?? "Doctor information is provided by partner facilities."}
      </p>

      <div className="mt-4 space-y-2 rounded-xl border border-border bg-muted/40 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Available schedule slots
        </p>
        {doctor.availableSlots.length ? (
          <div className="space-y-1">
            {doctor.availableSlots.slice(0, 3).map((slot) => (
              <p key={slot.id} className="text-sm text-slate-700">
                {formatDateTime(slot.startsAt)} to {formatDateTime(slot.endsAt)}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No open slots currently listed.</p>
        )}
      </div>

      <Button
        size="lg"
        type="button"
        className="mt-4"
        variant={isSelected ? "secondary" : "outline"}
        onClick={() => onSelect(doctor.id)}
      >
        {isSelected ? "Selected doctor" : "Select doctor"}
      </Button>
    </div>
  );
}
