"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;

function formatFileSize(bytes: number): string {
  return `${Math.round(bytes / 1024)} KB`;
}

function isAllowedFileType(file: File): boolean {
  return file.type.startsWith("image/") || file.type === "application/pdf";
}

export function InsuranceUploadForm() {
  const router = useRouter();

  const [cardholderName, setCardholderName] = useState("");
  const [insuranceNumber, setInsuranceNumber] = useState("");
  const [insuranceProviderName, setInsuranceProviderName] = useState(
    "Vietnam Social Insurance",
  );
  const [registeredHospitalName, setRegisteredHospitalName] = useState("");
  const [insuranceExpiryDate, setInsuranceExpiryDate] = useState("");

  const [cardFrontFile, setCardFrontFile] = useState<File | null>(null);
  const [cardBackFile, setCardBackFile] = useState<File | null>(null);
  const [supportingDocument, setSupportingDocument] = useState<File | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedFileCount = useMemo(
    () => [cardFrontFile, cardBackFile, supportingDocument].filter(Boolean).length,
    [cardFrontFile, cardBackFile, supportingDocument],
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!cardholderName.trim()) {
      setError("Cardholder name is required.");
      return;
    }

    if (!insuranceNumber.trim()) {
      setError("Insurance number is required.");
      return;
    }

    const files = [cardFrontFile, cardBackFile, supportingDocument].filter(
      (file): file is File => Boolean(file),
    );

    if (!files.length) {
      setError("Upload at least one insurance card image or supporting document.");
      return;
    }

    for (const file of files) {
      if (!isAllowedFileType(file)) {
        setError("Files must be image or PDF format.");
        return;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        setError("Each file must be 8MB or smaller.");
        return;
      }
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("cardholderName", cardholderName.trim());
    formData.append("insuranceNumber", insuranceNumber.trim());
    formData.append("insuranceProviderName", insuranceProviderName.trim());
    formData.append("registeredHospitalName", registeredHospitalName.trim());

    if (insuranceExpiryDate) {
      formData.append("insuranceExpiryDate", insuranceExpiryDate);
    }

    if (cardFrontFile) {
      formData.append("insuranceCardFront", cardFrontFile);
    }

    if (cardBackFile) {
      formData.append("insuranceCardBack", cardBackFile);
    }

    if (supportingDocument) {
      formData.append("supportingDocument", supportingDocument);
    }

    const response = await fetch("/api/patient/insurance", {
      method: "POST",
      body: formData,
    });

    const payload = (await response.json()) as {
      message?: string;
      data?: { insuranceRecordId?: string };
    };

    if (!response.ok) {
      setError(payload.message ?? "Unable to upload insurance.");
      setIsSubmitting(false);
      return;
    }

    const createdId = payload.data?.insuranceRecordId;

    if (createdId) {
      router.push(`/patient/insurance/${createdId}`);
      router.refresh();
      return;
    }

    router.push("/patient/insurance");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="insurance-cardholder-name">Cardholder name</Label>
          <Input
            id="insurance-cardholder-name"
            value={cardholderName}
            onChange={(event) => setCardholderName(event.target.value)}
            maxLength={120}
            required
          />
        </div>

        <div>
          <Label htmlFor="insurance-number">Insurance number</Label>
          <Input
            id="insurance-number"
            value={insuranceNumber}
            onChange={(event) => setInsuranceNumber(event.target.value)}
            maxLength={80}
            required
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="insurance-provider">Insurance provider / program</Label>
          <Input
            id="insurance-provider"
            value={insuranceProviderName}
            onChange={(event) => setInsuranceProviderName(event.target.value)}
            maxLength={120}
            required
          />
        </div>

        <div>
          <Label htmlFor="insurance-expiry">Expiry date (optional)</Label>
          <Input
            id="insurance-expiry"
            type="date"
            value={insuranceExpiryDate}
            onChange={(event) => setInsuranceExpiryDate(event.target.value)}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="insurance-hospital">Registered hospital (optional)</Label>
        <Input
          id="insurance-hospital"
          value={registeredHospitalName}
          onChange={(event) => setRegisteredHospitalName(event.target.value)}
          maxLength={200}
          placeholder="Hospital or clinic on insurance card"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="insurance-card-front">Card front image</Label>
          <Input
            id="insurance-card-front"
            type="file"
            accept="image/*,application/pdf"
            onChange={(event) => setCardFrontFile(event.target.files?.[0] ?? null)}
          />
          {cardFrontFile ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {cardFrontFile.name} ({formatFileSize(cardFrontFile.size)})
            </p>
          ) : null}
        </div>

        <div>
          <Label htmlFor="insurance-card-back">Card back image</Label>
          <Input
            id="insurance-card-back"
            type="file"
            accept="image/*,application/pdf"
            onChange={(event) => setCardBackFile(event.target.files?.[0] ?? null)}
          />
          {cardBackFile ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {cardBackFile.name} ({formatFileSize(cardBackFile.size)})
            </p>
          ) : null}
        </div>

        <div>
          <Label htmlFor="insurance-supporting-doc">Supporting document</Label>
          <Input
            id="insurance-supporting-doc"
            type="file"
            accept="image/*,application/pdf"
            onChange={(event) => setSupportingDocument(event.target.files?.[0] ?? null)}
          />
          {supportingDocument ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {supportingDocument.name} ({formatFileSize(supportingDocument.size)})
            </p>
          ) : null}
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Uploaded insurance will be reviewed by clinic or hospital staff. Verification
        status may remain pending until staff review is completed.
      </p>

      <p className="text-xs text-muted-foreground">
        Selected files: {selectedFileCount} (upload at least 1 file)
      </p>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Button size="lg" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Uploading..." : "Upload insurance"}
      </Button>
    </form>
  );
}
