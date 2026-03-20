import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/date";
import { requireStaffOrAdminUser } from "@/lib/session";
import { getPatientList } from "@/server/services/admin/operations";

type PageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

export default async function AdminPatientsPage({ searchParams }: PageProps) {
  await requireStaffOrAdminUser();
  const { q } = await searchParams;
  const patients = await getPatientList(q);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Patient list</CardTitle>
          <CardDescription>
            Search patients and open detail records for prescription, insurance, booking,
            and order history.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-wrap gap-2" method="GET" action="/admin/patients">
            <Input
              name="q"
              defaultValue={q ?? ""}
              placeholder="Search by patient name or email"
              className="max-w-md"
            />
            <Button size="lg" type="submit">
              Search
            </Button>
            <Link href="/admin/patients">
              <Button size="lg" variant="outline">
                Clear
              </Button>
            </Link>
          </form>
        </CardContent>
      </Card>

      {!patients.length ? (
        <EmptyState
          title="No patients found"
          description="No patient records match the current search query."
        />
      ) : (
        <div className="grid gap-4">
          {patients.map((patient) => (
            <Card key={patient.id}>
              <CardContent className="space-y-3 p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">{patient.fullName}</p>
                    <p className="text-sm text-muted-foreground">{patient.email}</p>
                    <p className="text-xs text-muted-foreground">{patient.phone ?? "-"}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Joined {formatDate(patient.createdAt)}
                  </p>
                </div>

                <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-4">
                  <p>Prescriptions: {patient.prescriptionCount}</p>
                  <p>Insurance records: {patient.insuranceCount}</p>
                  <p>Bookings: {patient.appointmentCount}</p>
                  <p>Orders: {patient.orderCount}</p>
                </div>

                <Link href={`/admin/patients/${patient.id}`}>
                  <Button size="lg" variant="outline">
                    Open patient detail
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
