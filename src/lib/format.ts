import { TIME_ZONE } from "./constants";
import type { AppointmentStatus, Operation } from "./types";

export function normalizePlate(value: string) {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .trim();
}

export function displayPlate(value: string) {
  const raw = normalizePlate(value);
  if (raw.length === 6) {
    return `${raw.slice(0, 3)}-${raw.slice(3)}`;
  }
  if (raw.length === 7) {
    return `${raw.slice(0, 3)}-${raw.slice(3, 5)}-${raw.slice(5)}`;
  }
  return value.toUpperCase().trim();
}

export function formatTime(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

export function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: TIME_ZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
}

export function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  return `${formatDate(iso)} · ${formatTime(iso)}`;
}

export function minutesBetween(fromIso: string, to = Date.now()) {
  return Math.max(0, Math.floor((to - new Date(fromIso).getTime()) / 60_000));
}

export function formatDuration(minutes: number | null) {
  if (minutes == null) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h <= 0) return `${m} min`;
  return `${h} h ${m.toString().padStart(2, "0")} min`;
}

export function statusLabel(status: AppointmentStatus) {
  switch (status) {
    case "programada":
      return "Programada";
    case "en_sitio":
      return "En cajón";
    case "en_anden":
      return "En andén";
    case "en_operacion":
      return "Carga / descarga";
    case "completa":
      return "Salida";
    case "cancelada":
      return "Cancelada";
    case "rechazada":
      return "Rechazada";
  }
}

export function operationLabel(operation: Operation) {
  return operation === "carga" ? "Carga" : "Descarga";
}

export function docsOk(docs: {
  license: boolean;
  circulation: boolean;
  insurance: boolean;
  cartaPorte: boolean;
}) {
  return docs.license && docs.circulation && docs.insurance && docs.cartaPorte;
}
