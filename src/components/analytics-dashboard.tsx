"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2Icon,
  ClockIcon,
  HourglassIcon,
  TimerIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  TruckIcon,
} from "lucide-react";
import { cn } from "cn";
import { PageHeader } from "@/components/page-header";
import { api } from "@/lib/client";
import {
  displayPlate,
  formatDuration,
  operationLabel,
} from "@/lib/format";
import { delayCategoryLabel } from "@/lib/sla";
import type {
  AnalyticsBucket,
  AnalyticsGroup,
  AnalyticsMetrics,
  AnalyticsOperation,
  AnalyticsReport,
  AnalyticsSlowOperation,
} from "@/lib/types";

type ChartMetric = "operations" | "avgOperation" | "avgWait" | "slaPct";

const GROUP_OPTIONS: [AnalyticsGroup, string][] = [
  ["day", "Día"],
  ["week", "Semana"],
  ["month", "Mes"],
  ["year", "Año"],
];

const OPERATION_OPTIONS: [AnalyticsOperation, string][] = [
  ["all", "Todas"],
  ["descarga", "Descarga"],
  ["carga", "Carga"],
];

const METRIC_OPTIONS: [ChartMetric, string][] = [
  ["operations", "Volumen"],
  ["avgOperation", "Tiempo de operación"],
  ["avgWait", "Espera para iniciar"],
  ["slaPct", "Cumplimiento SLA"],
];

const GROUP_NOUN: Record<AnalyticsGroup, string> = {
  day: "día",
  week: "semana",
  month: "mes",
  year: "año",
};

const SLA_TARGET = 90;

function defaultGroupFor(range: string): AnalyticsGroup {
  if (range === "30d" || range.startsWith("m:")) return "day";
  if (range === "90d") return "week";
  return "month";
}

export function AnalyticsDashboard({ initial }: { initial: AnalyticsReport }) {
  const [report, setReport] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [metric, setMetric] = useState<ChartMetric>("operations");

  async function load(next: {
    range?: string;
    group?: AnalyticsGroup;
    operation?: AnalyticsOperation;
  }) {
    const query = new URLSearchParams({
      range: next.range ?? report.range.key,
      group: next.group ?? report.group,
      op: next.operation ?? report.operation,
    });
    setLoading(true);
    try {
      setReport(await api<AnalyticsReport>(`/api/analytics?${query}`));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo cargar el análisis.",
      );
    } finally {
      setLoading(false);
    }
  }

  const changeRange = (range: string) =>
    void load({ range, group: defaultGroupFor(range) });

  const drillable = report.group === "year" || report.group === "month";
  const onDrill = (bucket: AnalyticsBucket) => {
    if (report.group === "year") changeRange(`y:${bucket.key}`);
    else if (report.group === "month") changeRange(`m:${bucket.key}`);
  };

  const { summary, previous } = report;
  const empty = summary.operations === 0;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Reportes"
        title="Análisis operativo"
        description={`${report.range.label} · ${summary.operations.toLocaleString("es-MX")} operaciones completadas${
          report.operation === "all" ? "" : ` de ${report.operation}`
        }.`}
      />

      <div
        className="flex flex-wrap items-end gap-x-6 gap-y-4 rounded-xl border border-border bg-card px-5 py-4 shadow-sm"
        data-tour="tour-analytics-filters"
      >
        <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
          Periodo
          <select
            className="h-9 min-w-52 rounded-lg border border-input bg-background px-3 text-sm text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
            value={report.range.key}
            disabled={loading}
            onChange={(e) => changeRange(e.target.value)}
          >
            <optgroup label="Periodos móviles">
              <option value="30d">Últimos 30 días</option>
              <option value="90d">Últimos 90 días</option>
              <option value="12m">Últimos 12 meses</option>
              <option value="all">Todo el historial</option>
            </optgroup>
            <optgroup label="Por año">
              {report.options.years.map((year) => (
                <option key={year} value={`y:${year}`}>
                  Año {year}
                </option>
              ))}
            </optgroup>
            <optgroup label="Por mes">
              {report.options.months.map((month) => (
                <option key={month.key} value={`m:${month.key}`}>
                  {month.label}
                </option>
              ))}
            </optgroup>
          </select>
        </label>
        <div className="grid gap-1.5 text-xs font-medium text-muted-foreground">
          Agrupar por
          <Segmented
            options={GROUP_OPTIONS}
            value={report.group}
            disabled={loading}
            onChange={(group) => void load({ group })}
          />
        </div>
        <div className="grid gap-1.5 text-xs font-medium text-muted-foreground">
          Operación
          <Segmented
            options={OPERATION_OPTIONS}
            value={report.operation}
            disabled={loading}
            onChange={(operation) => void load({ operation })}
          />
        </div>
        {loading ? (
          <span className="ml-auto flex items-center gap-2 pb-2 text-xs text-muted-foreground">
            <span className="size-3.5 animate-spin rounded-full border-2 border-border border-t-primary" />
            Actualizando…
          </span>
        ) : null}
      </div>

      <div
        className={cn(
          "grid gap-4 sm:grid-cols-2 lg:grid-cols-5",
          loading && "opacity-60",
        )}
        data-tour="tour-analytics-kpis"
      >
        <Kpi
          icon={<TruckIcon />}
          label="Operaciones"
          value={summary.operations.toLocaleString("es-MX")}
          delta={<Delta current={summary.operations} previous={previous?.operations} kind="count" />}
        />
        <Kpi
          icon={<TimerIcon />}
          label="Tiempo de operación"
          value={formatDuration(summary.avgOperation)}
          delta={<Delta current={summary.avgOperation} previous={previous?.avgOperation} kind="time" />}
        />
        <Kpi
          icon={<HourglassIcon />}
          label="Espera para iniciar"
          value={formatDuration(summary.avgWait)}
          delta={<Delta current={summary.avgWait} previous={previous?.avgWait} kind="time" />}
        />
        <Kpi
          icon={<ClockIcon />}
          label="Estancia en patio"
          value={formatDuration(summary.avgDwell)}
          delta={<Delta current={summary.avgDwell} previous={previous?.avgDwell} kind="time" />}
        />
        <Kpi
          icon={<CheckCircle2Icon />}
          label="Cumplimiento SLA"
          value={summary.slaPct == null ? "—" : `${summary.slaPct}%`}
          delta={<Delta current={summary.slaPct} previous={previous?.slaPct} kind="pct" />}
        />
      </div>

      <section
        className={cn(
          "rounded-xl border border-border bg-card shadow-sm",
          loading && "opacity-60",
        )}
        data-tour="tour-analytics-chart"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3.5">
          <h2 className="text-sm font-medium">
            Tendencia por {GROUP_NOUN[report.group]}
          </h2>
          <Segmented options={METRIC_OPTIONS} value={metric} onChange={setMetric} />
        </div>
        <div className="p-5">
          {empty ? (
            <EmptyState />
          ) : (
            <BarChart
              data={report.series}
              metric={metric}
              onSelect={drillable ? onDrill : undefined}
            />
          )}
          {drillable && !empty ? (
            <p className="mt-4 text-xs text-muted-foreground">
              Haz clic en una barra para ver el detalle{" "}
              {report.group === "year" ? "mensual de ese año" : "diario de ese mes"}.
            </p>
          ) : null}
        </div>
      </section>

      <DelayBreakdown rows={report.delayBreakdown} loading={loading} />

      <SlowOperationsTable rows={report.slowOperations} loading={loading} />

      <DockTable rows={report.byDock} loading={loading} />

      <div className="grid gap-6 lg:grid-cols-2">
        <SupervisorTable rows={report.bySupervisor} loading={loading} />
        <CarrierTable rows={report.byCarrier} loading={loading} />
      </div>
    </div>
  );
}

function Segmented<T extends string>({
  options,
  value,
  disabled,
  onChange,
}: {
  options: [T, string][];
  value: T;
  disabled?: boolean;
  onChange: (value: T) => void;
}) {
  return (
    <div className="inline-flex flex-wrap rounded-lg border border-border bg-background p-0.5">
      {options.map(([key, label]) => (
        <button
          key={key}
          type="button"
          disabled={disabled}
          aria-pressed={value === key}
          onClick={() => onChange(key)}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50",
            value === key
              ? "bg-muted text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  delta,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  delta: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{label}</span>
        <span className="grid size-8 place-items-center rounded-lg bg-muted text-foreground [&_svg]:size-4">
          {icon}
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      <div className="mt-1.5 text-xs">{delta}</div>
    </div>
  );
}

function Delta({
  current,
  previous,
  kind,
}: {
  current: number | null;
  previous: number | null | undefined;
  kind: "count" | "time" | "pct";
}) {
  if (current == null || previous == null || (kind !== "pct" && previous === 0)) {
    return <span className="text-muted-foreground">Sin comparativo</span>;
  }
  const change =
    kind === "pct" ? current - previous : ((current - previous) / previous) * 100;
  if (Math.abs(change) < 0.5) {
    return <span className="text-muted-foreground">Sin cambio vs periodo anterior</span>;
  }
  const up = change > 0;
  const good = kind === "time" ? !up : up;
  const Icon = up ? TrendingUpIcon : TrendingDownIcon;
  const amount =
    kind === "pct"
      ? `${up ? "+" : ""}${Math.round(change)} pts`
      : `${up ? "+" : ""}${change.toFixed(1)}%`;
  return (
    <span className="inline-flex items-center gap-1 text-muted-foreground">
      <span
        className={cn(
          "inline-flex items-center gap-1 font-medium",
          good ? "text-emerald-400" : "text-red-400",
        )}
      >
        <Icon className="size-3.5" />
        {amount}
      </span>
      vs periodo anterior
    </span>
  );
}

function metricValue(bucket: AnalyticsMetrics, metric: ChartMetric) {
  return bucket[metric];
}

function formatMetric(value: number | null, metric: ChartMetric) {
  if (value == null) return "Sin operaciones";
  if (metric === "operations") return `${value.toLocaleString("es-MX")} operaciones`;
  if (metric === "slaPct") return `${value}% dentro de SLA`;
  return formatDuration(value);
}

function axisLabel(value: number, metric: ChartMetric) {
  if (metric === "slaPct") return `${value}%`;
  if (metric === "operations") return value.toLocaleString("es-MX");
  return `${value}m`;
}

function niceMax(value: number) {
  if (value <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(value));
  const n = value / pow;
  const nice = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return nice * pow;
}

function slaTone(pct: number | null) {
  if (pct == null) return "bg-muted";
  if (pct >= SLA_TARGET) return "bg-emerald-500/70 group-hover:bg-emerald-400";
  if (pct >= 75) return "bg-amber-400/70 group-hover:bg-amber-300";
  return "bg-red-500/70 group-hover:bg-red-400";
}

function BarChart({
  data,
  metric,
  onSelect,
}: {
  data: AnalyticsBucket[];
  metric: ChartMetric;
  onSelect?: (bucket: AnalyticsBucket) => void;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const values = data.map((bucket) => metricValue(bucket, metric));
  const max = metric === "slaPct" ? 100 : niceMax(Math.max(1, ...values.map((v) => v ?? 0)));
  const ticks = [1, 0.75, 0.5, 0.25, 0].map((t) => Math.round(max * t * 10) / 10);
  const lastWithData = values.findLastIndex((v) => v != null && v > 0);
  const active = hover ?? (lastWithData >= 0 ? lastWithData : data.length - 1);
  const labelEvery = Math.max(1, Math.ceil(data.length / 12));
  const gap = data.length > 60 ? "gap-px" : data.length > 24 ? "gap-0.5" : "gap-1.5";

  return (
    <div>
      <div className="mb-4 flex items-baseline gap-2">
        <span className="text-lg font-semibold tabular-nums">
          {formatMetric(values[active] ?? null, metric)}
        </span>
        <span className="text-sm text-muted-foreground">{data[active]?.label}</span>
      </div>
      <div className="flex gap-3">
        <div className="flex h-56 w-12 shrink-0 flex-col justify-between text-right text-[11px] text-muted-foreground tabular-nums">
          {ticks.map((tick) => (
            <span key={tick} className="-translate-y-1/2 first:translate-y-0 last:translate-y-0">
              {axisLabel(tick, metric)}
            </span>
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <div className="relative h-56">
            <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
              {ticks.map((tick) => (
                <div key={tick} className="border-t border-border/60" />
              ))}
            </div>
            {metric === "slaPct" ? (
              <div
                className="pointer-events-none absolute inset-x-0 border-t border-dashed border-emerald-400/60"
                style={{ bottom: `${SLA_TARGET}%` }}
              >
                <span className="absolute -top-5 right-0 text-[11px] text-emerald-400">
                  Meta {SLA_TARGET}%
                </span>
              </div>
            ) : null}
            <div
              className={cn("relative flex h-full items-end", gap)}
              onMouseLeave={() => setHover(null)}
            >
              {data.map((bucket, index) => {
                const value = values[index] ?? 0;
                return (
                  <button
                    key={bucket.key}
                    type="button"
                    aria-label={`${bucket.label}: ${formatMetric(values[index] ?? null, metric)}`}
                    onMouseEnter={() => setHover(index)}
                    onFocus={() => setHover(index)}
                    onClick={() => onSelect?.(bucket)}
                    className={cn(
                      "group flex h-full min-w-0 flex-1 items-end",
                      onSelect ? "cursor-pointer" : "cursor-default",
                    )}
                  >
                    <span
                      className={cn(
                        "w-full rounded-t-[3px] transition-colors",
                        metric === "slaPct"
                          ? slaTone(values[index])
                          : index === active
                            ? "bg-primary"
                            : "bg-primary/55 group-hover:bg-primary",
                      )}
                      style={{
                        height: `${Math.min(100, (value / max) * 100)}%`,
                        minHeight: value > 0 ? 2 : 0,
                      }}
                    />
                  </button>
                );
              })}
            </div>
          </div>
          <div className={cn("mt-2 flex", gap)}>
            {data.map((bucket, index) => (
              <span
                key={bucket.key}
                className="min-w-0 flex-1 truncate text-center text-[11px] text-muted-foreground"
              >
                {index % labelEvery === 0 ? bucket.label : ""}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SlaBadge({ pct }: { pct: number | null }) {
  if (pct == null) return <span className="text-muted-foreground">—</span>;
  return (
    <span
      className={cn(
        "inline-flex rounded-md px-2 py-0.5 text-xs font-medium tabular-nums",
        pct >= SLA_TARGET
          ? "bg-emerald-500/10 text-emerald-300"
          : pct >= 75
            ? "bg-amber-400/10 text-amber-300"
            : "bg-red-500/10 text-red-300",
      )}
    >
      {pct}%
    </span>
  );
}

function TableCard({
  title,
  description,
  loading,
  children,
  ...props
}: React.ComponentProps<"section"> & {
  title: string;
  description?: string;
  loading: boolean;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-card shadow-sm",
        loading && "opacity-60",
      )}
      {...props}
    >
      <div className="border-b border-border px-5 py-3.5">
        <h2 className="text-sm font-medium">{title}</h2>
        {description ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="overflow-x-auto">{children}</div>
    </section>
  );
}

const th = "px-5 py-2.5 font-medium";
const td = "px-5 py-3 tabular-nums";

function DelayBreakdown({
  rows,
  loading,
}: {
  rows: AnalyticsReport["delayBreakdown"];
  loading: boolean;
}) {
  if (rows.length === 0) return null;
  const max = Math.max(...rows.map((r) => r.count));
  return (
    <TableCard
      title="Motivos registrados"
      description="Incidencias documentadas en patio cuando una unidad superó el SLA."
      loading={loading}
      data-tour="tour-analytics-delays"
    >
      <ul className="divide-y divide-border">
        {rows.map((row) => (
          <li
            key={row.category}
            className="flex items-center gap-4 px-5 py-3 text-sm"
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium">{row.label}</p>
              <div className="mt-2 h-1.5 rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full",
                    row.category === "sin_registro"
                      ? "bg-amber-400"
                      : "bg-primary",
                  )}
                  style={{ width: `${(row.count / max) * 100}%` }}
                />
              </div>
            </div>
            <span className="shrink-0 font-mono text-sm tabular-nums">
              {row.count}
            </span>
          </li>
        ))}
      </ul>
    </TableCard>
  );
}

function breachTag(breach: AnalyticsSlowOperation["breach"]) {
  if (breach === "both") return "Espera y operación";
  if (breach === "wait") return "Espera";
  return "Operación";
}

function SlowOperationsTable({
  rows,
  loading,
}: {
  rows: AnalyticsSlowOperation[];
  loading: boolean;
}) {
  return (
    <TableCard
      title="Operaciones fuera de SLA"
      description="Compara espera vs tiempo de operación. Si falta motivo, regístralo en Patio."
      loading={loading}
      data-tour="tour-analytics-slow"
    >
      <table className="w-full min-w-[960px] text-left text-sm">
        <thead className="border-b border-border bg-muted/30 text-xs text-muted-foreground">
          <tr>
            <th className={th}>Placa</th>
            <th className={th}>Día</th>
            <th className={th}>Andén</th>
            <th className={th}>Supervisor</th>
            <th className={th}>Transportista</th>
            <th className={th}>Espera</th>
            <th className={th}>Operación</th>
            <th className={th}>SLA op.</th>
            <th className={th}>Foco</th>
            <th className={th}>Incidencia</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.length === 0 ? (
            <EmptyRow cols={10} />
          ) : (
            rows.map((row) => (
              <tr key={row.id} className="hover:bg-muted/30">
                <td className="px-5 py-3">
                  <span className="plate-type text-sm">
                    {displayPlate(row.plate)}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {operationLabel(row.operation)}
                  </span>
                </td>
                <td className={td}>{row.day}</td>
                <td className={td}>{row.dockLabel}</td>
                <td className={td}>{row.supervisor}</td>
                <td className={cn(td, "max-w-[10rem] truncate")}>{row.carrier}</td>
                <td className={cn(td, row.breach !== "operation" && "text-amber-300")}>
                  {formatDuration(row.waitMin)}
                </td>
                <td
                  className={cn(
                    td,
                    row.breach !== "wait" && "font-medium text-red-300",
                  )}
                >
                  {formatDuration(row.opMin)}
                </td>
                <td className={td}>{formatDuration(row.slaTarget)}</td>
                <td className={td}>
                  <span className="rounded-md bg-red-500/10 px-2 py-0.5 text-xs text-red-300">
                    {breachTag(row.breach)}
                  </span>
                </td>
                <td className={cn(td, "max-w-xs")}>
                  {row.delayCategory ? (
                    <span className="text-xs">
                      {delayCategoryLabel(row.delayCategory)}
                      {row.delayNotes ? (
                        <span className="mt-0.5 block text-muted-foreground">
                          {row.delayNotes}
                        </span>
                      ) : null}
                    </span>
                  ) : (
                    <span className="text-xs text-amber-300">Sin registrar</span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </TableCard>
  );
}

function DockTable({
  rows,
  loading,
}: {
  rows: AnalyticsReport["byDock"];
  loading: boolean;
}) {
  const maxOp = Math.max(1, ...rows.map((r) => r.avgOperation ?? 0));
  return (
    <TableCard
      title="Desempeño por andén"
      description="Tiempo desde el inicio de la operación hasta la salida de la unidad."
      loading={loading}
      data-tour="tour-analytics-docks"
    >
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="border-b border-border bg-muted/30 text-xs text-muted-foreground">
          <tr>
            <th className={th}>Andén</th>
            <th className={th}>Operaciones</th>
            <th className={cn(th, "w-[28%]")}>Tiempo promedio</th>
            <th className={th}>Prom. carga</th>
            <th className={th}>Prom. descarga</th>
            <th className={th}>Espera prom.</th>
            <th className={th}>SLA</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.length === 0 ? (
            <EmptyRow cols={7} />
          ) : (
            rows.map((row) => (
              <tr key={row.id} className="hover:bg-muted/30">
                <td className="px-5 py-3 font-medium">{row.label}</td>
                <td className={td}>{row.operations.toLocaleString("es-MX")}</td>
                <td className={td}>
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 flex-1 rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${((row.avgOperation ?? 0) / maxOp) * 100}%` }}
                      />
                    </div>
                    <span className="w-20 shrink-0 text-right">
                      {formatDuration(row.avgOperation)}
                    </span>
                  </div>
                </td>
                <td className={td}>{formatDuration(row.avgCarga)}</td>
                <td className={td}>{formatDuration(row.avgDescarga)}</td>
                <td className={td}>{formatDuration(row.avgWait)}</td>
                <td className={td}>
                  <SlaBadge pct={row.slaPct} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </TableCard>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function SupervisorTable({
  rows,
  loading,
}: {
  rows: AnalyticsReport["bySupervisor"];
  loading: boolean;
}) {
  return (
    <TableCard
      title="Desempeño por supervisor"
      description="Supervisor que inició la carga o descarga."
      loading={loading}
    >
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead className="border-b border-border bg-muted/30 text-xs text-muted-foreground">
          <tr>
            <th className={th}>Supervisor</th>
            <th className={th}>Operaciones</th>
            <th className={th}>Tiempo prom.</th>
            <th className={th}>Espera prom.</th>
            <th className={th}>SLA</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.length === 0 ? (
            <EmptyRow cols={5} />
          ) : (
            rows.map((row) => (
              <tr key={row.name} className="hover:bg-muted/30">
                <td className="px-5 py-3">
                  <span className="flex items-center gap-2.5">
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/15 text-[11px] font-semibold text-primary">
                      {initials(row.name)}
                    </span>
                    <span className="font-medium">{row.name}</span>
                  </span>
                </td>
                <td className={td}>{row.operations.toLocaleString("es-MX")}</td>
                <td className={td}>{formatDuration(row.avgOperation)}</td>
                <td className={td}>{formatDuration(row.avgWait)}</td>
                <td className={td}>
                  <SlaBadge pct={row.slaPct} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </TableCard>
  );
}

function CarrierTable({
  rows,
  loading,
}: {
  rows: AnalyticsReport["byCarrier"];
  loading: boolean;
}) {
  return (
    <TableCard
      title="Transportistas principales"
      description="Ordenados por número de operaciones en el periodo."
      loading={loading}
    >
      <table className="w-full min-w-[480px] text-left text-sm">
        <thead className="border-b border-border bg-muted/30 text-xs text-muted-foreground">
          <tr>
            <th className={th}>Transportista</th>
            <th className={th}>Operaciones</th>
            <th className={th}>Estancia prom.</th>
            <th className={th}>SLA</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.length === 0 ? (
            <EmptyRow cols={4} />
          ) : (
            rows.map((row) => (
              <tr key={row.name} className="hover:bg-muted/30">
                <td className="px-5 py-3 font-medium">{row.name}</td>
                <td className={td}>{row.operations.toLocaleString("es-MX")}</td>
                <td className={td}>{formatDuration(row.avgDwell)}</td>
                <td className={td}>
                  <SlaBadge pct={row.slaPct} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </TableCard>
  );
}

function EmptyRow({ cols }: { cols: number }) {
  return (
    <tr>
      <td colSpan={cols} className="px-5 py-10 text-center text-muted-foreground">
        Sin operaciones completadas en este periodo.
      </td>
    </tr>
  );
}

function EmptyState() {
  return (
    <div className="grid h-56 place-items-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
      Sin operaciones completadas en este periodo.
    </div>
  );
}
