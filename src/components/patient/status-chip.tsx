import { Badge } from "@/components/ui/badge";

type StatusChipProps = {
  status: string;
};

function normalizeStatus(status: string): string {
  return status.replaceAll("_", " ").toLowerCase();
}

function colorVariant(
  status: string,
): "default" | "neutral" | "success" | "warning" | "danger" {
  const normalized = status.toUpperCase();

  if (
    normalized.includes("ACTIVE") ||
    normalized.includes("VERIFIED") ||
    normalized.includes("SENT") ||
    normalized.includes("CONFIRMED") ||
    normalized.includes("FULFILLED") ||
    normalized.includes("COMPLETED") ||
    normalized.includes("DELIVERED") ||
    normalized.includes("TRACKING")
  ) {
    return "success";
  }

  if (
    normalized.includes("REJECT") ||
    normalized.includes("CANCELED") ||
    normalized.includes("FAILED")
  ) {
    return "danger";
  }

  if (
    normalized.includes("DUE") ||
    normalized.includes("REVIEW") ||
    normalized.includes("SUBMITTED") ||
    normalized.includes("UPLOADED") ||
    normalized.includes("QUEUED") ||
    normalized.includes("REQUESTED") ||
    normalized.includes("PENDING") ||
    normalized.includes("IN_REVIEW")
  ) {
    return "warning";
  }

  if (normalized.includes("NOT_UPLOADED") || normalized.includes("NOT_SUBMITTED")) {
    return "neutral";
  }

  return "default";
}

export function StatusChip({ status }: StatusChipProps) {
  return (
    <Badge variant={colorVariant(status)} className="capitalize">
      {normalizeStatus(status)}
    </Badge>
  );
}
