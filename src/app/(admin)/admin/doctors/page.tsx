import { DoctorManagementForm } from "@/components/admin/doctor-management-form";
import { StatusChip } from "@/components/patient/status-chip";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/date";
import { requireStaffOrAdminUser } from "@/lib/session";
import { getDoctorManagementData } from "@/server/services/admin/operations";

export default async function AdminDoctorsPage() {
  await requireStaffOrAdminUser();
  const data = await getDoctorManagementData();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <Badge variant="neutral" className="mb-2 w-fit">
            Doctor Management
          </Badge>
          <CardTitle>Doctor information and availability</CardTitle>
          <CardDescription>
            Create or edit doctor information, facility association, consultation fee
            placeholder, and availability slots.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Doctor rating and review summary values are informational and not medically
            authoritative.
          </p>
        </CardContent>
      </Card>

      {!data.doctors.length ? (
        <EmptyState
          title="No doctors found"
          description="Create the first doctor record for booking workflow support."
        />
      ) : (
        <div className="grid gap-4">
          {data.doctors.map((doctor) => (
            <Card key={doctor.id}>
              <CardContent className="space-y-4 p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
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
                      <p className="font-semibold text-slate-900">{doctor.fullName}</p>
                      <p className="text-sm text-muted-foreground">
                        {doctor.specialty ?? "General care"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {doctor.clinicName
                          ? `${doctor.clinicName}${doctor.hospitalName ? ` · ${doctor.hospitalName}` : ""}`
                          : doctor.hospitalName ?? "No facility linked"}
                      </p>
                    </div>
                  </div>
                  <StatusChip status={doctor.status} />
                </div>

                <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
                  <p>Experience: {doctor.yearsOfExperience ?? "-"} years</p>
                  <p>
                    Rating: {doctor.ratingScore.toFixed(1)} ({doctor.reviewCount} reviews)
                  </p>
                  <p>Slots: {doctor.slotCount}</p>
                  <p>Next slot: {formatDateTime(doctor.nextSlotAt)}</p>
                  <p>Fee placeholder: {doctor.consultationFeeNote ?? "-"}</p>
                </div>

                <DoctorManagementForm
                  title={`Edit ${doctor.fullName}`}
                  submitLabel="Save doctor"
                  hospitalOptions={data.hospitalOptions}
                  clinicOptions={data.clinicOptions}
                  initial={{
                    doctorId: doctor.id,
                    fullName: doctor.fullName,
                    specialty: doctor.specialty,
                    hospitalId: doctor.hospitalId,
                    clinicId: doctor.clinicId,
                    doctorInformation: doctor.doctorInformation,
                    consultationFeeNote: doctor.consultationFeeNote,
                    yearsOfExperience: doctor.yearsOfExperience,
                    status: doctor.status as "ACTIVE" | "INACTIVE",
                  }}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <DoctorManagementForm
        title="Create new doctor"
        submitLabel="Create doctor"
        hospitalOptions={data.hospitalOptions}
        clinicOptions={data.clinicOptions}
      />
    </div>
  );
}
