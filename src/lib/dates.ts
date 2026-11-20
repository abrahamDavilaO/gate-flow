import { TIME_ZONE } from "./constants";

export const MONTHS_SHORT = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

export const MONTHS_LONG = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

const partsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

type LocalParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

function localParts(date: Date): LocalParts {
  const out: Record<string, number> = {};
  for (const part of partsFormatter.formatToParts(date)) {
    if (part.type !== "literal") out[part.type] = Number(part.value);
  }
  return {
    year: out.year,
    month: out.month,
    day: out.day,
    hour: out.hour,
    minute: out.minute,
  };
}

const pad = (n: number) => n.toString().padStart(2, "0");

function formatDay(year: number, month: number, day: number) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

/** Fecha local del CEDIS en formato YYYY-MM-DD. */
export function localDay(date: Date) {
  const p = localParts(date);
  return formatDay(p.year, p.month, p.day);
}

export function splitDay(day: string) {
  const [year, month, date] = day.split("-").map(Number);
  return { year, month, day: date };
}

export function addDays(day: string, amount: number) {
  const { year, month, day: d } = splitDay(day);
  const next = new Date(Date.UTC(year, month - 1, d + amount));
  return formatDay(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate());
}

/** 0 = domingo … 6 = sábado. */
export function weekday(day: string) {
  const { year, month, day: d } = splitDay(day);
  return new Date(Date.UTC(year, month - 1, d)).getUTCDay();
}

export function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Convierte una hora local del CEDIS a un instante UTC. */
export function zonedDate(day: string, hour: number, minute: number) {
  const { year, month, day: d } = splitDay(day);
  const guess = Date.UTC(year, month - 1, d, hour, minute);
  const p = localParts(new Date(guess));
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
  return new Date(guess - (asUtc - guess));
}
