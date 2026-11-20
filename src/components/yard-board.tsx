"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  InfoIcon,
  RotateCcwIcon,
  TimerIcon,
  TruckIcon,
  WarehouseIcon,
} from "lucide-react";
import { cn } from "cn";
import { DockMap } from "@/components/dock-map";
import { PageHeader } from "@/components/page-header";
import { Dwell } from "@/components/dwell";
import { StatusBadge } from "@/components/status-badge";
import { IncidentDialog } from "@/components/incident-dialog";
import { SupervisorDialog } from "@/components/supervisor-dialog";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/client";
import { SLA_MINUTES } from "@/lib/constants";
import {
  displayPlate,
  formatDateTime,
  formatDuration,
  formatTime,
  operationLabel,
} from "@/lib/format";
import {
  activeSlaBreaches,
  breachLabel,
  delayCategoryLabel,
  needsDelayRecord,
} from "@/lib/sla";
import type { AppointmentSummary, YardSnapshot } from "@/lib/types";
import { useYard } from "@/hooks/use-yard";

export function YardBoard({ initial }: { initial: YardSnapshot }) {
  const { yard, error, loading, reload } = useYard(3000, initial);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"en_patio" | "todas">("en_patio");
  const [startingId, setStartingId] = useState<string | null>(null);
  const [lastSupervisor, setLastSupervisor] = useState<string | null>(null);
  const [incidentId, setIncidentId] = useState<string | null>(null);
  const [exitAfterIncident, setExitAfterIncident] = useState(false);

  const rows = useMemo(() => {
    const list = yard?.appointments ?? [];
    if (filter === "en_patio") {
      return list.filter((a) =>
        ["en_sitio", "en_anden", "en_operacion"].includes(a.status),
      );
    }
    return list;
  }, [yard, filter]);

  async function act(
    action: string,
    id: string,
    extra?: {
      dockId?: string;
      supervisor?: string;
      category?: string;
      notes?: string;
    },
  ) {
    setBusyId(id);
    try {
      await api("/api/yard/action", {
        method: "POST",
        body: JSON.stringify({ action, id, ...extra }),
      });
      await reload();
      return true;
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se actualizó el patio.",
      );
      return false;
    } finally {
      setBusyId(null);
    }
  }

  async function startWithSupervisor(supervisor: string) {
    if (!startingId) return;
    const ok = await act("start", startingId, { supervisor });
    if (ok) {
      setLastSupervisor(supervisor);
      setStartingId(null);
      toast.success(`Operación iniciada · ${supervisor}`);
    }
  }

  const starting = yard?.appointments.find((a) => a.id === startingId) ?? null;
  const incidentAppt =
    yard?.appointments.find((a) => a.id === incidentId) ?? null;

  function requestExit(id: string) {
    const appt = yard?.appointments.find((a) => a.id === id);
    if (appt && needsDelayRecord(appt)) {
      setIncidentId(id);
      setExitAfterIncident(true);
      return;
    }
    void act("exit", id);
  }

  function openIncident(id: string) {
    setIncidentId(id);
    setExitAfterIncident(false);
  }

  async function saveIncident(category: string, notes: string) {
    if (!incidentId) return;
    const id = incidentId;
    const doExit = exitAfterIncident;
    const ok = await act("incident", id, { category, notes });
    if (ok) {
      setIncidentId(null);
      setExitAfterIncident(false);
      toast.success("Incidencia registrada");
      if (doExit) await act("exit", id);
    }
  }

  if (loading && !yard) {
    return (
      <p className="text-sm text-muted-foreground">Sincronizando patio…</p>
    );
  }
  if (error && !yard) {
    return (
      <div className="rounded-xl bg-red-500/10 p-4 text-sm text-red-200">
        {error}. Publica la app como privada o de equipo para operar el patio.
      </div>
    );
  }
  if (!yard) return null;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Tablero en vivo"
        title="Control de patio"
        description="Seguimiento de unidades desde la entrada hasta la salida, con alertas de estancia por andén."
        actions={
          <Button variant="outline" onClick={() => void act("reset", "all")}>
            <RotateCcwIcon data-icon="inline-start" />
            Restaurar muestra
          </Button>
        }
      />

      {yard.sampleData ? (
        <div className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
          <InfoIcon className="mt-0.5 size-4 shrink-0 text-primary" />
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">
              Datos de muestra del CEDIS Norte.
            </span>{" "}
            Registra una cita desde el portal y valídala en caseta: aparecerá
            aquí al instante.
          </p>
        </div>
      ) : null}

      <div
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        data-tour="tour-yard-kpis"
      >
        <Kpi
          icon={<TruckIcon className="size-4" />}
          label="Unidades en patio"
          value={String(yard.kpis.inYard)}
        />
        <Kpi
          icon={<WarehouseIcon className="size-4" />}
          label="Andenes ocupados"
          value={`${yard.kpis.docksBusy}/${yard.kpis.docksTotal}`}
        />
        <Kpi
          icon={<TimerIcon className="size-4" />}
          label="Estancia promedio"
          value={formatDuration(yard.kpis.avgDwellMinutes)}
        />
        <Kpi
          icon={<AlertTriangleIcon className="size-4" />}
          label="Cuellos de botella"
          value={String(yard.kpis.overdue)}
          hot={yard.kpis.overdue > 0}
        />
      </div>

      {yard.alerts.length > 0 ? (
        <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
            <h2 className="flex items-center gap-2 text-sm font-medium">
              <AlertTriangleIcon className="size-4 text-red-400" />
              Alertas activas
            </h2>
            <span className="rounded-md bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-300 tabular-nums">
              {yard.alerts.length}
            </span>
          </div>
          <ul className="divide-y divide-border">
            {yard.alerts.map((alert) => (
              <li
                key={alert.id}
                className="flex items-start gap-3 px-5 py-3 text-sm"
              >
                <span
                  className={cn(
                    "mt-1.5 size-2 shrink-0 rounded-full",
                    alert.severity === "critical"
                      ? "bg-red-400"
                      : "bg-amber-400",
                  )}
                />
                <div className="min-w-0">
                  <p className="font-medium">{alert.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {alert.detail}
                  </p>
                </div>
                <span
                  className={cn(
                    "ml-auto shrink-0 rounded-md px-2 py-0.5 text-xs font-medium",
                    alert.severity === "critical"
                      ? "bg-red-500/10 text-red-300"
                      : "bg-amber-400/10 text-amber-300",
                  )}
                >
                  {alert.severity === "critical" ? "Crítica" : "Aviso"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-300">
          <CheckCircle2Icon className="size-4" />
          Sin cuellos de botella en este momento.
        </div>
      )}

      <section
        className="rounded-xl border border-border bg-card shadow-sm"
        data-tour="tour-yard-map"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3.5">
          <h2 className="text-sm font-medium">Mapa de andenes</h2>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Legend className="bg-emerald-400" label="Libre" />
            <Legend className="bg-primary" label="Ocupado" />
            <Legend className="bg-zinc-500" label="Mantenimiento" />
          </div>
        </div>
        <div className="p-5">
          <DockMap
            docks={yard.docks}
            onSelect={(dockId) => {
              const waiting = rows.find((a) => a.status === "en_sitio");
              if (waiting) void act("assign", waiting.id, { dockId });
            }}
          />
        </div>
      </section>

      <section
        className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
        data-tour="tour-yard-table"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
          <h2 className="text-sm font-medium">Unidades</h2>
          <div className="inline-flex rounded-lg border border-border bg-background p-0.5">
            {(
              [
                ["en_patio", "En patio"],
                ["todas", "Todas las citas"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={filter === value}
                onClick={() => setFilter(value)}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                  filter === value
                    ? "bg-muted text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-border bg-muted/30 text-xs text-muted-foreground">
              <tr>
                <th className="px-5 py-2.5 font-medium">Placa</th>
                <th className="px-5 py-2.5 font-medium">Estado</th>
                <th className="px-5 py-2.5 font-medium">Andén</th>
                <th className="px-5 py-2.5 font-medium">Supervisor</th>
                <th className="px-5 py-2.5 font-medium">Entrada</th>
                <th className="px-5 py-2.5 font-medium">Inicio</th>
                <th className="px-5 py-2.5 font-medium">Estancia</th>
                <th className="px-5 py-2.5 font-medium">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-12 text-center text-muted-foreground"
                  >
                    Patio vacío. Las unidades aparecen cuando caseta abre pluma.
                  </td>
                </tr>
              ) : (
                rows.map((appt) => (
                  <YardRow
                    key={appt.id}
                    appointment={appt}
                    busy={busyId === appt.id}
                    onStart={() => setStartingId(appt.id)}
                    onExit={() => requestExit(appt.id)}
                    onIncident={() => openIncident(appt.id)}
                    freeAndenes={yard.docks.filter(
                      (d) => d.kind === "anden" && d.status === "libre",
                    )}
                    onAssign={(dockId) =>
                      void act("assign", appt.id, { dockId })
                    }
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <SupervisorDialog
        key={startingId ?? "closed"}
        open={starting != null}
        plate={starting ? displayPlate(starting.plate) : ""}
        dockLabel={starting?.dockLabel ?? null}
        defaultName={lastSupervisor}
        busy={busyId != null && busyId === startingId}
        onOpenChange={(open) => {
          if (!open) setStartingId(null);
        }}
        onConfirm={(name) => void startWithSupervisor(name)}
      />
      <IncidentDialog
        key={incidentId ?? "incident-closed"}
        open={incidentAppt != null}
        plate={incidentAppt ? displayPlate(incidentAppt.plate) : ""}
        dockLabel={incidentAppt?.dockLabel ?? null}
        breaches={incidentAppt ? activeSlaBreaches(incidentAppt) : []}
        requireForExit={exitAfterIncident}
        existingCategory={incidentAppt?.delayCategory ?? null}
        existingNotes={incidentAppt?.delayNotes ?? null}
        busy={busyId != null && busyId === incidentId}
        onOpenChange={(open) => {
          if (!open) {
            setIncidentId(null);
            setExitAfterIncident(false);
          }
        }}
        onConfirm={(category, notes) => void saveIncident(category, notes)}
      />
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("size-2 rounded-full", className)} />
      {label}
    </span>
  );
}

function Kpi({
  icon,
  label,
  value,
  hot,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hot?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{label}</span>
        <span
          className={cn(
            "grid size-8 place-items-center rounded-lg",
            hot ? "bg-red-500/10 text-red-400" : "bg-muted text-foreground",
          )}
        >
          {icon}
        </span>
      </div>
      <p
        className={cn(
          "mt-3 text-3xl font-semibold tracking-tight tabular-nums",
          hot && "text-red-400",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function YardRow({
  appointment,
  busy,
  onStart,
  onExit,
  onIncident,
  freeAndenes,
  onAssign,
}: {
  appointment: AppointmentSummary;
  busy: boolean;
  onStart: () => void;
  onExit: () => void;
  onIncident: () => void;
  freeAndenes: { id: string; label: string }[];
  onAssign: (dockId: string) => void;
}) {
  const breaches = activeSlaBreaches(appointment);
  const hot = breaches.length > 0;
  return (
    <tr
      className={cn(
        "transition-colors hover:bg-muted/30",
        hot && "bg-red-500/[0.04]",
      )}
    >
      <td className="px-5 py-3">
        <p className="plate-type text-sm">{displayPlate(appointment.plate)}</p>
        <p className="text-xs text-muted-foreground">
          {appointment.driverName} · {operationLabel(appointment.operation)}
        </p>
      </td>
      <td className="px-5 py-3">
        <StatusBadge status={appointment.status} />
      </td>
      <td className="px-5 py-3">{appointment.dockLabel ?? "—"}</td>
      <td className="px-5 py-3">
        {appointment.supervisor ?? (
          <span className="text-muted-foreground">—</span>
        )}
      </td>
      <td className="px-5 py-3 font-mono text-xs">
        {formatTime(appointment.arrivedAt)}
      </td>
      <td className="px-5 py-3 font-mono text-xs">
        {formatTime(appointment.loadStartedAt)}
      </td>
      <td className="px-5 py-3">
        <Dwell
          from={appointment.arrivedAt}
          until={appointment.departedAt}
          warnAfter={SLA_MINUTES.dwell}
        />
        {hot ? (
          <p className="mt-1 flex flex-wrap gap-1">
            {breaches.map((b) => (
              <span
                key={b}
                className="rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] font-medium text-red-300"
              >
                SLA {breachLabel(b)}
              </span>
            ))}
          </p>
        ) : null}
        {appointment.delayCategory ? (
          <p className="mt-1 text-[10px] text-muted-foreground">
            {delayCategoryLabel(appointment.delayCategory)}
          </p>
        ) : null}
      </td>
      <td className="px-5 py-3">
        <div className="flex flex-wrap gap-1">
          {appointment.status === "en_sitio" && freeAndenes[0] ? (
            <Button
              size="xs"
              disabled={busy}
              onClick={() => onAssign(freeAndenes[0].id)}
            >
              Mandar a {freeAndenes[0].label}
            </Button>
          ) : null}
          {appointment.status === "en_anden" ? (
            <Button size="xs" disabled={busy} onClick={onStart}>
              Iniciar
            </Button>
          ) : null}
          {["en_sitio", "en_anden", "en_operacion"].includes(
            appointment.status,
          ) ? (
            <Button
              size="xs"
              variant={hot && !appointment.delayCategory ? "secondary" : "outline"}
              disabled={busy}
              onClick={onIncident}
            >
              Incidencia
            </Button>
          ) : null}
          {["en_anden", "en_operacion"].includes(appointment.status) ? (
            <Button
              size="xs"
              variant="outline"
              disabled={busy}
              onClick={onExit}
            >
              Salida
            </Button>
          ) : null}
          {appointment.status === "completa" ? (
            <span className="text-xs text-muted-foreground">
              {formatDateTime(appointment.departedAt)}
            </span>
          ) : null}
        </div>
      </td>
    </tr>
  );
}
