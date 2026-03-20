"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function ReminderRecomputeButton() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onRecompute() {
    setMessage(null);
    setIsSubmitting(true);

    const response = await fetch("/api/admin/reminders/recompute", {
      method: "POST",
    });

    const payload = (await response.json()) as {
      message?: string;
      data?: { updatedCount?: number };
    };

    if (!response.ok) {
      setMessage(payload.message ?? "Unable to recompute reminder states.");
      setIsSubmitting(false);
      return;
    }

    setMessage(`Reminder states recomputed. Updated: ${payload.data?.updatedCount ?? 0}`);
    setIsSubmitting(false);

    setTimeout(() => {
      window.location.reload();
    }, 700);
  }

  return (
    <div className="space-y-2">
      <Button size="lg" onClick={onRecompute} disabled={isSubmitting}>
        {isSubmitting ? "Recomputing..." : "Recompute reminder states"}
      </Button>
      {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
    </div>
  );
}
