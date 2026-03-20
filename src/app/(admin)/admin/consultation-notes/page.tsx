import { StatusChip } from "@/components/patient/status-chip";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/date";
import { requireStaffOrAdminUser } from "@/lib/session";
import { getConsultationNoteLog } from "@/server/services/admin/operations";

export default async function ConsultationNoteLogPage() {
  await requireStaffOrAdminUser();
  const notes = await getConsultationNoteLog();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <Badge variant="neutral" className="mb-2 w-fit">
            Consultation Note Log
          </Badge>
          <CardTitle>Consultation notes</CardTitle>
          <CardDescription>
            View staff-reviewed consultation notes and audit timestamps.
          </CardDescription>
        </CardHeader>
      </Card>

      {!notes.length ? (
        <EmptyState
          title="No consultation notes"
          description="Consultation note records will appear here when logged by staff."
        />
      ) : (
        <div className="grid gap-4">
          {notes.map((note) => (
            <Card key={note.id}>
              <CardContent className="space-y-3 p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">{note.patientName}</p>
                    <p className="text-xs text-muted-foreground">
                      Doctor: {note.doctorName ?? "No doctor linked"}
                    </p>
                  </div>
                  <StatusChip status={note.reviewedAt ? "REVIEWED_BY_STAFF" : "REQUESTED"} />
                </div>
                <p className="text-sm text-slate-700">{note.summary}</p>
                <p className="text-xs text-muted-foreground">
                  Doctor information: {note.doctorInformation ?? "-"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Created: {formatDateTime(note.createdAt)} · Reviewed: {formatDateTime(note.reviewedAt)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Reviewed by: {note.reviewedByStaffName ?? "-"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
