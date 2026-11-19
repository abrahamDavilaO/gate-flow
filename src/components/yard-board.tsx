"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangleIcon, TimerIcon, TruckIcon, WarehouseIcon } from "lucide-react";
import { DockMap } from "@/components/dock-map";
import { Dwell } from "@/components/dwell";
import { StatusBadge } from "@/components/status-badge";
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
import type { AppointmentSummary } from "@/lib/types";
import { useYard } from "@/hooks/use-yard";

export function YardBoard() {
  const { yard, error, loading, reload } = useYard(3000);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"en_patio" | "todas">("en_patio");

  const rows = useMemo(() => {
    const list = yard?.appointments ?? [];
    if (filter === "en_patio") {
      return list.filter((a) =>
        ["en_sitio", "en_anden", "en_operacion"].includes(a.status),
      );
    }
    return list;
  }, [yard, filter]);

  async function act(action: string, id: string, dockId?: string) {
    setBusyId(id);
    try {
      await api("/api/yard/action", {
        method: "POST",
        body: JSON.stringify({ action, id, dockId }),
      });
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se actualizó el patio.");
    } finally {
      setBusyId(null);
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs tracking-[0.25em] text-muted-foreground uppercase">
            Tablero en vivo
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Control de patio
          </h1>
        </div>
        <Button
          variant="outline"
          onClick={() => void act("reset", "all")}
        >
          Restaurar muestra
        </Button>
      </div>

      {yard.sampleData ? (
        <p className="rounded-md bg-primary/10 px-3 py-2 text-sm text-primary">
          Datos de muestra del CEDIS Norte. Registra una cita real desde el portal y
          valídala en caseta: aparece aquí al instante.
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
        <div className="grid gap-2">
          {yard.alerts.map((alert) => (
            <div
              key={alert.id}
              className={`rounded-lg px-3 py-2 text-sm ${
                alert.severity === "critical"
                  ? "bg-red-500/15 text-red-100"
                  : "bg-amber-400/10 text-amber-100"
              }`}
            >
              <p className="font-medium">{alert.title}</p>
              <p className="text-xs opacity-80">{alert.detail}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-emerald-300">Sin cuellos de botella en este momento.</p>
      )}

      <DockMap
        docks={yard.docks}
        onSelect={(dockId) => {
          const waiting = rows.find((a) => a.status === "en_sitio");
          if (waiting) void act("assign", waiting.id, dockId);
        }}
      />

      <div className="flex gap-2">
        <Button
          size="sm"
          variant={filter === "en_patio" ? "default" : "outline"}
          onClick={() => setFilter("en_patio")}
        >
          En patio
        </Button>
        <Button
          size="sm"
          variant={filter === "todas" ? "default" : "outline"}
          onClick={() => setFilter("todas")}
        >
          Todas las citas
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-muted/40 text-xs tracking-wide text-muted-foreground uppercase">
            <tr>
              <th className="px-3 py-2 font-medium">Placa</th>
              <th className="px-3 py-2 font-medium">Estado</th>
              <th className="px-3 py-2 font-medium">Andén</th>
              <th className="px-3 py-2 font-medium">Entrada</th>
              <th className="px-3 py-2 font-medium">Inicio</th>
              <th className="px-3 py-2 font-medium">Estancia</th>
              <th className="px-3 py-2 font-medium">Acción</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">
                  Patio vacío. Las unidades aparecen cuando caseta abre pluma.
                </td>
              </tr>
            ) : (
              rows.map((appt) => (
                <YardRow
                  key={appt.id}
                  appointment={appt}
                  busy={busyId === appt.id}
                  onStart={() => void act("start", appt.id)}
                  onExit={() => void act("exit", appt.id)}
                  freeAndenes={yard.docks.filter(
                    (d) => d.kind === "anden" && d.status === "libre",
                  )}
                  onAssign={(dockId) => void act("assign", appt.id, dockId)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
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
    <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className={`mt-2 font-mono text-3xl ${hot ? "text-red-300" : "text-foreground"}`}>
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
  freeAndenes,
  onAssign,
}: {
  appointment: AppointmentSummary;
  busy: boolean;
  onStart: () => void;
  onExit: () => void;
  freeAndenes: { id: string; label: string }[];
  onAssign: (dockId: string) => void;
}) {
  return (
    <tr className="border-t border-border/60">
      <td className="px-3 py-3">
        <p className="plate-type text-sm">{displayPlate(appointment.plate)}</p>
        <p className="text-xs text-muted-foreground">
          {appointment.driverName} · {operationLabel(appointment.operation)}
        </p>
      </td>
      <td className="px-3 py-3">
        <StatusBadge status={appointment.status} />
      </td>
      <td className="px-3 py-3">{appointment.dockLabel ?? "—"}</td>
      <td className="px-3 py-3 font-mono text-xs">
        {formatTime(appointment.arrivedAt)}
      </td>
      <td className="px-3 py-3 font-mono text-xs">
        {formatTime(appointment.loadStartedAt)}
      </td>
      <td className="px-3 py-3">
        <Dwell
          from={appointment.arrivedAt}
          until={appointment.departedAt}
          warnAfter={SLA_MINUTES.dwell}
        />
      </td>
      <td className="px-3 py-3">
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
          {["en_anden", "en_operacion"].includes(appointment.status) ? (
            <Button size="xs" variant="outline" disabled={busy} onClick={onExit}>
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
