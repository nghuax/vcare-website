"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

type MarkNotificationReadButtonProps = {
  notificationId: string;
  read: boolean;
};

export function MarkNotificationReadButton({
  notificationId,
  read,
}: MarkNotificationReadButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function markAsRead() {
    setIsSubmitting(true);

    await fetch(`/api/patient/notifications/${notificationId}/read`, {
      method: "POST",
    });

    setTimeout(() => {
      window.location.reload();
    }, 300);
  }

  return (
    <Button
      size="sm"
      variant="outline"
      type="button"
      disabled={read || isSubmitting}
      onClick={markAsRead}
    >
      {read ? "Read" : isSubmitting ? "Saving..." : "Mark as read"}
    </Button>
  );
}
