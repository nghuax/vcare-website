export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) {
    return "-";
  }

  const date = typeof value === "string" ? new Date(value) : value;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) {
    return "-";
  }

  const date = typeof value === "string" ? new Date(value) : value;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function daysUntil(value: Date | string): number {
  const date = typeof value === "string" ? new Date(value) : value;
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();

  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function isSameDay(dateA: Date, dateB: Date): boolean {
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
}
