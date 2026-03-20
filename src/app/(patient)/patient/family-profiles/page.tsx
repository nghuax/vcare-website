import { FamilyMemberForm } from "@/components/patient/family-member-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/date";
import { requirePatientUser } from "@/lib/session";
import { getPatientFamilyMembers } from "@/server/services/patient/portal";

export default async function FamilyProfilesPage() {
  const user = await requirePatientUser();
  const members = await getPatientFamilyMembers(user.id);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Family profiles</CardTitle>
          <CardDescription>
            Add family members to organize prescription uploads and future appointment requests.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FamilyMemberForm />
        </CardContent>
      </Card>

      {!members.length ? (
        <EmptyState
          title="No family profiles yet"
          description="Add a family profile when managing records for dependents."
        />
      ) : (
        <div className="grid gap-4">
          {members.map((member) => (
            <Card key={member.id}>
              <CardContent className="space-y-1 p-5 text-sm text-muted-foreground">
                <p className="text-base font-semibold text-slate-900">{member.fullName}</p>
                <p>Relationship: {member.relationship.toLowerCase()}</p>
                <p>Date of birth: {formatDate(member.dateOfBirth)}</p>
                <p>Phone: {member.phone ?? "-"}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
