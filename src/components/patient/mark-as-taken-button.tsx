"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

type MarkAsTakenButtonProps = {
  scheduleId: string;
  prescriptionId: string;
  takenToday: boolean;
};

export function MarkAsTakenButton({
  scheduleId,
  prescriptionId,
  takenToday,
}: MarkAsTakenButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onMarkTaken() {
    setIsSubmitting(true);
    setMessage(null);

    const response = await fetch("/api/patient/medicine-intake", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduleId, prescriptionId }),
    });

    const payload = (await response.json()) as { message?: string };

    if (!response.ok) {
      setMessage(payload.message ?? "Unable to mark medicine as taken.");
      setIsSubmitting(false);
      return;
    }

    setMessage("Marked as taken.");
    setIsSubmitting(false);

    setTimeout(() => {
      window.location.reload();
    }, 500);
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        size="lg"
        variant={takenToday ? "outline" : "default"}
        disabled={isSubmitting || takenToday}
        onClick={onMarkTaken}
      >
        {takenToday ? "Taken today" : isSubmitting ? "Saving..." : "Mark as taken"}
      </Button>
      {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
    </div>
  );
}
