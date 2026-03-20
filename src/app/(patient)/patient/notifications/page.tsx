import { MarkNotificationReadButton } from "@/components/patient/mark-notification-read-button";
import { StatusChip } from "@/components/patient/status-chip";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/date";
import { requirePatientUser } from "@/lib/session";
import { getPatientNotifications } from "@/server/services/patient/portal";

export default async function NotificationsPage() {
  const user = await requirePatientUser();
  const notifications = await getPatientNotifications(user.id);

  if (!notifications.length) {
    return (
      <EmptyState
        title="No notifications yet"
        description="Notifications will appear here for uploads, schedule updates, and reorder states."
      />
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Timeline of prescription, schedule, refill, and order updates.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4">
        {notifications.map((item) => (
          <Card key={item.id}>
            <CardContent className="space-y-3 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-slate-900">{item.title}</p>
                <StatusChip status={item.status} />
              </div>
              <p className="text-sm text-muted-foreground">{item.body}</p>
              <p className="text-xs text-muted-foreground">
                {formatDateTime(item.createdAt)}
              </p>
              <MarkNotificationReadButton
                notificationId={item.id}
                read={Boolean(item.readAt)}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
