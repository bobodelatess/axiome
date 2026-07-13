const DAY_MS = 86_400_000;

export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function fromISODate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

export function addDays(value: string | Date, amount: number): string {
  const date = typeof value === "string" ? fromISODate(value) : new Date(value);
  date.setDate(date.getDate() + amount);
  return toISODate(date);
}

export function daysBetween(from: string | Date, to: string | Date): number {
  const start = typeof from === "string" ? fromISODate(from) : from;
  const end = typeof to === "string" ? fromISODate(to) : to;
  return Math.round((end.getTime() - start.getTime()) / DAY_MS);
}

export function formatLongDate(value: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(fromISODate(value));
}

export function formatShortDate(value: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
  }).format(fromISODate(value));
}

export function minutesLabel(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${String(rest).padStart(2, "0")}` : `${hours} h`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

