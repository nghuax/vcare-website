export type InsuranceUiStatus =
  | "NOT_UPLOADED"
  | "PENDING_VERIFICATION"
  | "VERIFIED"
  | "REJECTED";

export function toInsuranceUiStatus(
  rawStatus: string | null | undefined,
): InsuranceUiStatus {
  const normalized = rawStatus?.toUpperCase();

  if (!normalized || normalized === "NOT_SUBMITTED") {
    return "NOT_UPLOADED";
  }

  if (normalized === "VERIFIED") {
    return "VERIFIED";
  }

  if (normalized === "REJECTED" || normalized === "CLOSED") {
    return "REJECTED";
  }

  return "PENDING_VERIFICATION";
}

export function insuranceUiStatusLabel(status: InsuranceUiStatus): string {
  switch (status) {
    case "NOT_UPLOADED":
      return "not uploaded";
    case "PENDING_VERIFICATION":
      return "pending verification";
    case "VERIFIED":
      return "verified";
    case "REJECTED":
      return "rejected";
    default:
      return "pending verification";
  }
}

export function insuranceUiStatusDescription(status: InsuranceUiStatus): string {
  switch (status) {
    case "NOT_UPLOADED":
      return "No insurance uploaded yet.";
    case "PENDING_VERIFICATION":
      return "Insurance uploaded and waiting for clinic or hospital staff review.";
    case "VERIFIED":
      return "Insurance details have been reviewed by staff.";
    case "REJECTED":
      return "Insurance review did not pass. Please upload updated information.";
    default:
      return "Insurance uploaded and waiting for clinic or hospital staff review.";
  }
}
