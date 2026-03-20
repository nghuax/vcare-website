"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type FamilyMemberOption = {
  id: string;
  label: string;
};

type PrescriptionUploadFormProps = {
  familyMembers: FamilyMemberOption[];
};

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export function PrescriptionUploadForm({
  familyMembers,
}: PrescriptionUploadFormProps) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [familyMemberId, setFamilyMemberId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileSizeLabel = useMemo(() => {
    if (!file) {
      return "";
    }

    return `${Math.round(file.size / 1024)} KB`;
  }, [file]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!file) {
      setError("Please select a prescription image.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Only image files are supported.");
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError("Image size must be 5MB or smaller.");
      return;
    }

    if (notes.length > 500) {
      setError("Notes must be 500 characters or fewer.");
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("prescriptionImage", file);
    formData.append("notes", notes);
    formData.append("familyMemberId", familyMemberId);

    const response = await fetch("/api/patient/prescriptions", {
      method: "POST",
      body: formData,
    });

    const payload = (await response.json()) as {
      message?: string;
      data?: { prescriptionId?: string };
    };

    if (!response.ok) {
      setError(payload.message ?? "Unable to upload prescription.");
      setIsSubmitting(false);
      return;
    }

    if (payload.data?.prescriptionId) {
      router.push(`/patient/prescriptions/${payload.data.prescriptionId}`);
      router.refresh();
      return;
    }

    router.push("/patient/prescriptions");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <Label htmlFor="prescriptionImage">Prescription image</Label>
        <Input
          id="prescriptionImage"
          type="file"
          accept="image/*"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          required
        />
        {file ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Selected: {file.name} ({fileSizeLabel})
          </p>
        ) : null}
      </div>

      <div>
        <Label htmlFor="familyMemberId">Family profile (optional)</Label>
        <Select
          id="familyMemberId"
          value={familyMemberId}
          onChange={(event) => setFamilyMemberId(event.target.value)}
        >
          <option value="">For myself</option>
          {familyMembers.map((member) => (
            <option key={member.id} value={member.id}>
              {member.label}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Add context from the uploaded prescription only."
          maxLength={500}
        />
        <p className="mt-1 text-xs text-muted-foreground">{notes.length}/500</p>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Button size="lg" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Uploading..." : "Upload prescription"}
      </Button>
    </form>
  );
}
