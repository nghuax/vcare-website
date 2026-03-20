import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requirePatientUser } from "@/lib/session";
import { AppointmentBookingFlow } from "@/components/patient/appointment-booking-flow";
import { getAppointmentBookingContext } from "@/server/services/patient/appointments";

export default async function AppointmentBookingPage() {
  const user = await requirePatientUser();
  const context = await getAppointmentBookingContext(user.id);

  const serializedData = {
    facilities: context.facilities,
    doctors: context.doctors.map((doctor) => ({
      ...doctor,
      availableSlots: doctor.availableSlots.map((slot) => ({
        ...slot,
        startsAt: slot.startsAt.toISOString(),
        endsAt: slot.endsAt.toISOString(),
      })),
    })),
    familyMembers: context.familyMembers,
    insuranceStatus: {
      insuranceRecordId: context.insuranceStatus.insuranceRecordId,
      status: context.insuranceStatus.status,
      statusLabel: context.insuranceStatus.statusLabel,
      statusDescription: context.insuranceStatus.statusDescription,
      submittedAt: context.insuranceStatus.submittedAt?.toISOString() ?? null,
    },
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Appointment booking</CardTitle>
          <CardDescription>
            Choose hospital or clinic, optionally select a doctor, choose a time slot, review
            insurance verification status, and submit an appointment request.
          </CardDescription>
        </CardHeader>
      </Card>

      <AppointmentBookingFlow data={serializedData} />
    </div>
  );
}
