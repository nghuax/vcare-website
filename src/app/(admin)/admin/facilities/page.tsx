import {
  ClinicManagementForm,
  HospitalManagementForm,
} from "@/components/admin/facility-management-forms";
import { StatusChip } from "@/components/patient/status-chip";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireStaffOrAdminUser } from "@/lib/session";
import { getFacilityManagementData } from "@/server/services/admin/operations";

export default async function AdminFacilitiesPage() {
  await requireStaffOrAdminUser();
  const data = await getFacilityManagementData();

  const hospitalOptions = data.hospitals.map((hospital) => ({
    id: hospital.id,
    name: hospital.name,
  }));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <Badge variant="neutral" className="mb-2 w-fit">
            Hospital / Clinic Management
          </Badge>
          <CardTitle>Facility visibility and setup</CardTitle>
          <CardDescription>
            Create or edit hospitals and clinics, and control booking visibility.
          </CardDescription>
        </CardHeader>
      </Card>

      <section className="grid gap-4 lg:grid-cols-2">
        <HospitalManagementForm title="Create hospital" submitLabel="Create hospital" />

        <ClinicManagementForm
          title="Create clinic"
          submitLabel="Create clinic"
          hospitalOptions={hospitalOptions}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Hospitals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.hospitals.length ? (
              data.hospitals.map((hospital) => (
                <div key={hospital.id} className="rounded-xl border border-border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-slate-900">{hospital.name}</p>
                    <StatusChip status={hospital.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {hospital.code ?? "No code"} · {hospital.city ?? "No city"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Clinics: {hospital.clinicCount} · Doctors: {hospital.doctorCount} · Booking
                    visible: {hospital.isBookingVisible ? "yes" : "no"}
                  </p>
                  <div className="mt-3">
                    <HospitalManagementForm
                      title={`Edit ${hospital.name}`}
                      submitLabel="Save hospital"
                      initial={{
                        id: hospital.id,
                        name: hospital.name,
                        code: hospital.code,
                        city: hospital.city,
                        status: hospital.status as "ACTIVE" | "INACTIVE",
                        isBookingVisible: hospital.isBookingVisible,
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No hospitals.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Clinics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.clinics.length ? (
              data.clinics.map((clinic) => (
                <div key={clinic.id} className="rounded-xl border border-border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-slate-900">{clinic.name}</p>
                    <StatusChip status={clinic.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {clinic.code ?? "No code"} · {clinic.city ?? "No city"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Hospital: {clinic.hospitalName ?? "None"} · Doctors: {clinic.doctorCount} ·
                    Booking visible: {clinic.isBookingVisible ? "yes" : "no"}
                  </p>
                  <div className="mt-3">
                    <ClinicManagementForm
                      title={`Edit ${clinic.name}`}
                      submitLabel="Save clinic"
                      hospitalOptions={hospitalOptions}
                      initial={{
                        id: clinic.id,
                        hospitalId: clinic.hospitalId,
                        name: clinic.name,
                        code: clinic.code,
                        city: clinic.city,
                        status: clinic.status as "ACTIVE" | "INACTIVE",
                        isBookingVisible: clinic.isBookingVisible,
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No clinics.</p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
