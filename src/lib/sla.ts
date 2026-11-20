import { DELAY_CATEGORIES, SLA_MINUTES } from "./constants";
import { minutesBetween } from "./format";
import type { AppointmentSummary, Operation } from "./types";

export type SlaBreach = "wait" | "operation" | "dwell";

export function operationSlaMinutes(operation: Operation) {
  return operation === "carga" ? SLA_MINUTES.carga : SLA_MINUTES.descarga;
}

export function delayCategoryLabel(category: string | null | undefined) {
  if (!category) return null;
  return DELAY_CATEGORIES.find((c) => c.id === category)?.label ?? category;
}

/** Incumplimientos activos (unidad aún en patio). */
export function activeSlaBreaches(
  appt: AppointmentSummary,
  now = Date.now(),
): SlaBreach[] {
  if (!appt.arrivedAt) return [];
  const out: SlaBreach[] = [];

  if (appt.status === "en_sitio") {
    const wait = minutesBetween(appt.arrivedAt, now);
    if (wait > SLA_MINUTES.waitForDock) out.push("wait");
  }

  if (appt.status === "en_anden" && !appt.loadStartedAt) {
    const wait = minutesBetween(appt.arrivedAt, now);
    if (wait > SLA_MINUTES.waitToStart) out.push("wait");
  }

  if (appt.status === "en_operacion" && appt.loadStartedAt) {
    const op = minutesBetween(appt.loadStartedAt, now);
    if (op > operationSlaMinutes(appt.operation)) out.push("operation");
  }

  const dwell = minutesBetween(appt.arrivedAt, now);
  if (dwell > SLA_MINUTES.dwell) out.push("dwell");

  return out;
}

export function needsDelayRecord(appt: AppointmentSummary, now = Date.now()) {
  return activeSlaBreaches(appt, now).length > 0 && !appt.delayCategory;
}

export function breachLabel(breach: SlaBreach) {
  switch (breach) {
    case "wait":
      return "Espera";
    case "operation":
      return "Operación";
    case "dwell":
      return "Estancia";
  }
}

export function slaBreachSummary(
  waitMin: number,
  opMin: number,
  operation: Operation,
) {
  const parts: ("wait" | "operation")[] = [];
  if (waitMin > SLA_MINUTES.waitToStart) parts.push("wait");
  if (opMin > operationSlaMinutes(operation)) parts.push("operation");
  if (parts.length === 2) return "both" as const;
  return parts[0] ?? "operation";
}