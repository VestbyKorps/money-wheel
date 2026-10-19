import type { ApplicationStatus, SupportKind } from "./types";

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  not_started: "Ikke startet",
  in_progress: "Under arbeid",
  submitted: "Sendt inn",
  approved: "Innvilget",
  rejected: "Avslått",
  skipped: "Hopper over",
};

export const KIND_LABELS: Record<SupportKind, string> = {
  money: "Penger",
  material: "Materiell",
  both: "Penger og materiell",
};

export const MONTHS_NB = [
  "Januar",
  "Februar",
  "Mars",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export function formatDate(iso: string): string {
  const d = new Date(iso + (iso.length === 10 ? "T12:00:00" : ""));
  return d.toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function daysLabel(days: number): string {
  if (days < 0) return `${Math.abs(days)} dager siden`;
  if (days === 0) return "I dag";
  if (days === 1) return "I morgen";
  return `${days} dager igjen`;
}
