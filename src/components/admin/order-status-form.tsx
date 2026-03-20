"use client";

import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type OrderStatusFormProps = {
  orderId: string;
  initialStatus: "DRAFT" | "SUBMITTED" | "REVIEWED_BY_STAFF" | "READY_FOR_PICKUP" | "DELIVERED" | "CANCELED";
};

export function OrderStatusForm({ orderId, initialStatus }: OrderStatusFormProps) {
  const [status, setStatus] = useState(initialStatus);
  const [requestNote, setRequestNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    const response = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        requestNote: requestNote.trim() || undefined,
      }),
    });

    const payload = (await response.json()) as { message?: string };

    if (!response.ok) {
      setError(payload.message ?? "Unable to update order status.");
      setIsSubmitting(false);
      return;
    }

    setSuccess("Order status updated.");
    setIsSubmitting(false);

    setTimeout(() => {
      window.location.reload();
    }, 700);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <Label htmlFor={`order-status-${orderId}`}>Order status</Label>
        <Select
          id={`order-status-${orderId}`}
          value={status}
          onChange={(event) =>
            setStatus(
              event.target.value as
                | "DRAFT"
                | "SUBMITTED"
                | "REVIEWED_BY_STAFF"
                | "READY_FOR_PICKUP"
                | "DELIVERED"
                | "CANCELED",
            )
          }
        >
          <option value="DRAFT">Draft</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="REVIEWED_BY_STAFF">Reviewed by staff</option>
          <option value="READY_FOR_PICKUP">Ready for pickup</option>
          <option value="DELIVERED">Delivered</option>
          <option value="CANCELED">Canceled</option>
        </Select>
      </div>

      <div>
        <Label htmlFor={`order-note-${orderId}`}>Staff note</Label>
        <Textarea
          id={`order-note-${orderId}`}
          value={requestNote}
          onChange={(event) => setRequestNote(event.target.value)}
          maxLength={300}
        />
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-700">{success}</p> : null}

      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Save order"}
      </Button>
    </form>
  );
}
