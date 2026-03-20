"use client";

import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type ReorderRequestFormProps = {
  prescriptionId: string;
  medicineId: string;
};

export function ReorderRequestForm({
  prescriptionId,
  medicineId,
}: ReorderRequestFormProps) {
  const [quantity, setQuantity] = useState("1");
  const [fulfillmentMethod, setFulfillmentMethod] = useState<"PICKUP" | "DELIVERY">(
    "PICKUP",
  );
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [requestNote, setRequestNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const qty = Number.parseInt(quantity, 10);

    if (!Number.isFinite(qty) || qty < 1 || qty > 30) {
      setError("Quantity must be between 1 and 30.");
      return;
    }

    if (fulfillmentMethod === "DELIVERY" && !deliveryAddress.trim()) {
      setError("Delivery address is required for delivery requests.");
      return;
    }

    setIsSubmitting(true);

    const response = await fetch("/api/patient/orders/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prescriptionId,
        medicineId,
        quantity: qty,
        fulfillmentMethod,
        deliveryAddress: deliveryAddress.trim() || undefined,
        requestNote: requestNote.trim() || undefined,
      }),
    });

    const payload = (await response.json()) as { message?: string };

    if (!response.ok) {
      setError(payload.message ?? "Unable to submit reorder request.");
      setIsSubmitting(false);
      return;
    }

    setSuccess("Reorder request submitted.");
    setIsSubmitting(false);
  }

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor={`quantity-${prescriptionId}-${medicineId}`}>Quantity</Label>
          <Input
            id={`quantity-${prescriptionId}-${medicineId}`}
            type="number"
            min={1}
            max={30}
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor={`fulfillment-${prescriptionId}-${medicineId}`}>Pickup / delivery</Label>
          <Select
            id={`fulfillment-${prescriptionId}-${medicineId}`}
            value={fulfillmentMethod}
            onChange={(event) =>
              setFulfillmentMethod(event.target.value as "PICKUP" | "DELIVERY")
            }
          >
            <option value="PICKUP">Pickup</option>
            <option value="DELIVERY">Delivery</option>
          </Select>
        </div>
      </div>

      {fulfillmentMethod === "DELIVERY" ? (
        <div>
          <Label htmlFor={`delivery-${prescriptionId}-${medicineId}`}>Delivery address</Label>
          <Input
            id={`delivery-${prescriptionId}-${medicineId}`}
            value={deliveryAddress}
            onChange={(event) => setDeliveryAddress(event.target.value)}
            required
          />
        </div>
      ) : null}

      <div>
        <Label htmlFor={`note-${prescriptionId}-${medicineId}`}>Request note (optional)</Label>
        <Textarea
          id={`note-${prescriptionId}-${medicineId}`}
          value={requestNote}
          onChange={(event) => setRequestNote(event.target.value)}
          placeholder="Add a neutral pickup or delivery note."
          maxLength={300}
        />
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-700">{success}</p> : null}

      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Request reorder"}
      </Button>
    </form>
  );
}
