import { SLA_MINUTES } from "./constants";
import {
  delayCategoryLabel,
  operationSlaMinutes,
  slaBreachSummary,
} from "./sla";
import {
  MONTHS_LONG,
  MONTHS_SHORT,
  addDays,
  daysInMonth,
  localDay,
  splitDay,
  weekday,
} from "./dates";
import { sql } from "./db";
import { ensureReady } from "./yard";
import type {
  AnalyticsBucket,
  AnalyticsGroup,
  AnalyticsMetrics,
  AnalyticsOperation,
  AnalyticsReport,
  Operation,
} from "./types";

type Row = {
  id: string;
  plate: string;
  dock_id: string | null;
  dock_label: string | null;
  operation: Operation;
  carrier: string;
  supervisor: string | null;
  delay_category: string | null;
  delay_notes: string | null;
  arrived_at: string | Date;
  load_started_at: string | Date;
  departed_at: string | Date;
};

type CompletedOperation = {
  id: string;
  plate: string;
  day: string;
  dockId: string;
  dockLabel: string;
  operation: Operation;
  carrier: string;
  supervisor: string;
  delayCategory: string | null;
  delayNotes: string | null;
  opMin: number;
  waitMin: number;
  dwellMin: number;
  onSla: boolean;
};

type ResolvedRange = {
  key: string;
  label: string;
  startDay: string;
  endDay: string;
  previous: { startDay: string; endDay: string } | null;
};

const ROLLING: Record<string, { days: number; label: string }> = {
  "30d": { days: 30, label: "Últimos 30 días" },
  "90d": { days: 90, label: "Últimos 90 días" },
  "12m": { days: 365, label: "Últimos 12 meses" },
};

export const DEFAULT_RANGE = "12m";
export const DEFAULT_GROUP: AnalyticsGroup = "month";

const GROUPS: AnalyticsGroup[] = ["day", "week", "month", "year"];

export function parseGroup(value: string | null | undefined): AnalyticsGroup {
  return GROUPS.includes(value as AnalyticsGroup)
    ? (value as AnalyticsGroup)
    : DEFAULT_GROUP;
}

export function parseOperation(value: string | null | undefined): AnalyticsOperation {
  return value === "carga" || value === "descarga" ? value : "all";
}

const minutes = (from: string | Date, to: string | Date) =>
  Math.round((new Date(to).getTime() - new Date(from).getTime()) / 60_000);

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

const minDay = (a: string, b: string) => (a < b ? a : b);

function daysBetween(start: string, end: string) {
  const a = splitDay(start);
  const b = splitDay(end);
  return Math.round(
    (Date.UTC(b.year, b.month - 1, b.day) - Date.UTC(a.year, a.month - 1, a.day)) /
      86_400_000,
  );
}

function resolveRange(key: string, today: string, firstDay: string): ResolvedRange {
  const rolling = ROLLING[key];
  if (rolling) {
    const startDay = addDays(today, -(rolling.days - 1));
    return {
      key,
      label: rolling.label,
      startDay,
      endDay: today,
      previous: {
        startDay: addDays(startDay, -rolling.days),
        endDay: addDays(startDay, -1),
      },
    };
  }

  if (key === "all") {
    return {
      key,
      label: "Todo el historial",
      startDay: minDay(firstDay, today),
      endDay: today,
      previous: null,
    };
  }

  const year = key.match(/^y:(\d{4})$/);
  if (year) {
    const y = Number(year[1]);
    const endDay = minDay(`${y}-12-31`, today);
    const partial = endDay !== `${y}-12-31`;
    return {
      key,
      label: partial ? `Año ${y} (a la fecha)` : `Año ${y}`,
      startDay: `${y}-01-01`,
      endDay,
      previous: { startDay: `${y - 1}-01-01`, endDay: `${y - 1}${endDay.slice(4)}` },
    };
  }

  const month = key.match(/^m:(\d{4})-(\d{2})$/);
  if (month) {
    const y = Number(month[1]);
    const m = Number(month[2]);
    if (m >= 1 && m <= 12) {
      const startDay = `${month[1]}-${month[2]}-01`;
      const endDay = minDay(
        `${month[1]}-${month[2]}-${String(daysInMonth(y, m)).padStart(2, "0")}`,
        today,
      );
      const prevY = m === 1 ? y - 1 : y;
      const prevM = m === 1 ? 12 : m - 1;
      const prevStart = `${prevY}-${String(prevM).padStart(2, "0")}-01`;
      const prevMonthEnd = `${prevY}-${String(prevM).padStart(2, "0")}-${String(
        daysInMonth(prevY, prevM),
      ).padStart(2, "0")}`;
      return {
        key,
        label: `${capitalize(MONTHS_LONG[m - 1])} ${y}`,
        startDay,
        endDay,
        previous: {
          startDay: prevStart,
          endDay: minDay(addDays(prevStart, daysBetween(startDay, endDay)), prevMonthEnd),
        },
      };
    }
  }

  return resolveRange(DEFAULT_RANGE, today, firstDay);
}

function bucketOf(day: string, group: AnalyticsGroup) {
  const { year, month, day: date } = splitDay(day);
  switch (group) {
    case "day":
      return { key: day, label: `${date} ${MONTHS_SHORT[month - 1]}` };
    case "week": {
      const monday = addDays(day, -((weekday(day) + 6) % 7));
      const m = splitDay(monday);
      return { key: monday, label: `${m.day} ${MONTHS_SHORT[m.month - 1]}` };
    }
    case "month":
      return {
        key: day.slice(0, 7),
        label: `${MONTHS_SHORT[month - 1]} ${String(year).slice(2)}`,
      };
    case "year":
      return { key: String(year), label: String(year) };
  }
}

function average(values: number[]) {
  if (values.length === 0) return null;
  return Math.round(values.reduce((sum, n) => sum + n, 0) / values.length);
}

function metrics(ops: CompletedOperation[]): AnalyticsMetrics {
  return {
    operations: ops.length,
    avgOperation: average(ops.map((o) => o.opMin)),
    avgWait: average(ops.map((o) => o.waitMin)),
    avgDwell: average(ops.map((o) => o.dwellMin)),
    slaPct:
      ops.length === 0
        ? null
        : Math.round((ops.filter((o) => o.onSla).length / ops.length) * 100),
  };
}

function groupBy<K>(ops: CompletedOperation[], key: (op: CompletedOperation) => K) {
  const map = new Map<K, CompletedOperation[]>();
  for (const op of ops) {
    const k = key(op);
    const list = map.get(k);
    if (list) list.push(op);
    else map.set(k, [op]);
  }
  return map;
}

export async function getAnalytics(params: {
  range?: string | null;
  group?: string | null;
  operation?: string | null;
}): Promise<AnalyticsReport> {
  await ensureReady();
  const rows = await sql<Row>(
    `select a.id, a.plate, a.dock_id, d.label as dock_label, a.operation, a.carrier,
            a.supervisor, a.delay_category, a.delay_notes,
            a.arrived_at, a.load_started_at, a.departed_at
     from appointments a
     left join docks d on d.id = a.dock_id
     where a.status = 'completa'
       and a.arrived_at is not null
       and a.load_started_at is not null
       and a.departed_at is not null`,
  );

  const all: CompletedOperation[] = rows.map((row) => {
    const opMin = minutes(row.load_started_at, row.departed_at);
    const waitMin = minutes(row.arrived_at, row.load_started_at);
    const dwellMin = minutes(row.arrived_at, row.departed_at);
    const slaTarget = operationSlaMinutes(row.operation);
    return {
      id: row.id,
      plate: row.plate,
      day: localDay(new Date(row.departed_at)),
      dockId: row.dock_id ?? "—",
      dockLabel: row.dock_label ?? "Sin andén",
      operation: row.operation,
      carrier: row.carrier,
      supervisor: row.supervisor ?? "Sin registrar",
      delayCategory: row.delay_category,
      delayNotes: row.delay_notes,
      opMin,
      waitMin,
      dwellMin,
      onSla: opMin <= slaTarget && waitMin <= SLA_MINUTES.waitToStart,
    };
  });

  const today = localDay(new Date());
  const firstDay = all.reduce((min, op) => minDay(min, op.day), today);
  const group = parseGroup(params.group);
  const operation = parseOperation(params.operation);
  const range = resolveRange(params.range ?? DEFAULT_RANGE, today, firstDay);

  const years = [...new Set(all.map((op) => op.day.slice(0, 4)))].sort().reverse();
  const months = [...new Set(all.map((op) => op.day.slice(0, 7)))]
    .sort()
    .reverse()
    .slice(0, 18)
    .map((key) => {
      const [y, m] = key.split("-").map(Number);
      return { key, label: `${capitalize(MONTHS_LONG[m - 1])} ${y}` };
    });

  const ofOperation =
    operation === "all" ? all : all.filter((op) => op.operation === operation);
  const within = (start: string, end: string) =>
    ofOperation.filter((op) => op.day >= start && op.day <= end);

  const current = within(range.startDay, range.endDay);
  const previous = range.previous
    ? within(range.previous.startDay, range.previous.endDay)
    : null;

  const byBucket = groupBy(current, (op) => bucketOf(op.day, group).key);
  const series: AnalyticsBucket[] = [];
  const seen = new Set<string>();
  for (let day = range.startDay; day <= range.endDay; day = addDays(day, 1)) {
    const bucket = bucketOf(day, group);
    if (seen.has(bucket.key)) continue;
    seen.add(bucket.key);
    series.push({ ...bucket, ...metrics(byBucket.get(bucket.key) ?? []) });
  }

  const byDock = [...groupBy(current, (op) => op.dockId).entries()]
    .map(([id, ops]) => ({
      id,
      label: ops[0].dockLabel,
      ...metrics(ops),
      avgCarga: average(ops.filter((o) => o.operation === "carga").map((o) => o.opMin)),
      avgDescarga: average(
        ops.filter((o) => o.operation === "descarga").map((o) => o.opMin),
      ),
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "es", { numeric: true }));

  const bySupervisor = [...groupBy(current, (op) => op.supervisor).entries()]
    .map(([name, ops]) => ({ name, ...metrics(ops) }))
    .sort((a, b) => b.operations - a.operations);

  const byCarrier = [...groupBy(current, (op) => op.carrier).entries()]
    .map(([name, ops]) => ({ name, ...metrics(ops) }))
    .sort((a, b) => b.operations - a.operations)
    .slice(0, 8);

  const slowOperations = current
    .filter((op) => !op.onSla)
    .sort((a, b) => b.opMin - a.opMin || b.waitMin - a.waitMin)
    .slice(0, 30)
    .map((op) => ({
      id: op.id,
      plate: op.plate,
      day: op.day,
      dockLabel: op.dockLabel,
      supervisor: op.supervisor,
      carrier: op.carrier,
      operation: op.operation,
      waitMin: op.waitMin,
      opMin: op.opMin,
      dwellMin: op.dwellMin,
      slaTarget: operationSlaMinutes(op.operation),
      breach: slaBreachSummary(op.waitMin, op.opMin, op.operation),
      delayCategory: op.delayCategory,
      delayNotes: op.delayNotes,
    }));

  const delayCounts = new Map<string, number>();
  for (const op of current) {
    if (!op.delayCategory) continue;
    delayCounts.set(op.delayCategory, (delayCounts.get(op.delayCategory) ?? 0) + 1);
  }
  const delayBreakdown = [...delayCounts.entries()]
    .map(([category, count]) => ({
      category,
      label: delayCategoryLabel(category) ?? category,
      count,
    }))
    .sort((a, b) => b.count - a.count);
  const uncategorizedSlow = slowOperations.filter((op) => !op.delayCategory).length;
  if (uncategorizedSlow > 0) {
    delayBreakdown.push({
      category: "sin_registro",
      label: "Fuera de SLA sin incidencia registrada",
      count: uncategorizedSlow,
    });
  }

  return {
    range: {
      key: range.key,
      label: range.label,
      startDay: range.startDay,
      endDay: range.endDay,
    },
    group,
    operation,
    options: { years, months },
    summary: metrics(current),
    previous: previous ? metrics(previous) : null,
    series,
    byDock,
    bySupervisor,
    byCarrier,
    slowOperations,
    delayBreakdown,
  };
}
