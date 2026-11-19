"use client";

import { useMemo, useState } from "react";
import { CameraIcon, ScanLineIcon } from "lucide-react";
import { toast } from "sonner";
import { BarrierGate } from "@/components/barrier-gate";
import { DocsList } from "@/components/docs-list";
import { QrScanner } from "@/components/qr-scanner";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/client";
import { displayPlate, formatDateTime, operationLabel } from "@/lib/format";
import type { Dock, GateLookup } from "@/lib/types";
import { useYard } from "@/hooks/use-yard";

export function CasetaKiosk() {
  const { yard, reload } = useYard(5000);
  const [query, setQuery] = useState("");
  const [scan, setScan] = useState(false);
  const [lookup, setLookup] = useState<GateLookup | null>(null);
  const [busy, setBusy] = useState(false);
  const [barrierOpen, setBarrierOpen] = useState(false);
  const [dockId, setDockId] = useState<string>("");

  const approaching = useMemo(
    () =>
      (yard?.appointments ?? []).filter((a) => a.status === "programada").slice(0, 4),
    [yard],
  );

  async function search(value: string) {
    const q = value.trim();
    if (!q) return;
    setBusy(true);
    setBarrierOpen(false);
    try {
      const result = await api<GateLookup>(`/api/gate?q=${encodeURIComponent(q)}`);
      setLookup(result);
      setDockId(result.suggestedDock?.id ?? "");
      if (result.reason && !result.appointment) {
        toast.error(result.reason);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sin lectura.");
    } finally {
      setBusy(false);
    }
  }

  async function admit() {
    if (!lookup?.appointment) return;
    setBusy(true);
    try {
      const result = await api<{ appointment: GateLookup["appointment"] }>(
        "/api/gate",
        {
          method: "POST",
          body: JSON.stringify({
            action: "admit",
            id: lookup.appointment.id,
            dockId: dockId || undefined,
          }),
        },
      );
      setLookup({
        ...lookup,
        appointment: result.appointment,
        reason: null,
      });
      setBarrierOpen(true);
      toast.success("Pluma abierta. Andén asignado.");
      await reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se abrió la pluma.");
    } finally {
      setBusy(false);
    }
  }

  async function reject() {
    if (!lookup?.appointment) return;
    setBusy(true);
    try {
      await api("/api/gate", {
        method: "POST",
        body: JSON.stringify({
          action: "reject",
          id: lookup.appointment.id,
          reason: lookup.appointment.docsComplete
            ? "Cita fuera de ventana o unidad no autorizada."
            : "Documentación incompleta.",
        }),
      });
      setBarrierOpen(false);
      toast.message("Unidad rechazada. Pluma cerrada.");
      setLookup(null);
      await reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se rechazó.");
    } finally {
      setBusy(false);
    }
  }

  const docks: Dock[] = [
    ...(lookup?.freeAndenes ?? []),
    ...(lookup?.freeCajones ?? []),
  ];
  if (lookup?.suggestedDock && !docks.some((d) => d.id === lookup.suggestedDock?.id)) {
    docks.unshift(lookup.suggestedDock);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="space-y-4">
        <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
          <p className="text-xs tracking-[0.25em] text-muted-foreground uppercase">
            Caseta 1 · acceso norte
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Validación de entrada
          </h1>
          <form
            className="mt-4 flex flex-col gap-2 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              void search(query);
            }}
          >
            <Input
              className="h-12 font-mono text-lg tracking-wider"
              placeholder="QR, token PT-… o placa"
              value={query}
              onChange={(e) => setQuery(e.target.value.toUpperCase())}
            />
            <Button type="submit" size="lg" className="h-12" disabled={busy}>
              Validar
            </Button>
          </form>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              variant={scan ? "default" : "outline"}
              onClick={() => setScan((v) => !v)}
            >
              <ScanLineIcon />
              {scan ? "Cerrar cámara QR" : "Escanear QR"}
            </Button>
          </div>
          {scan ? (
            <div className="mt-3">
              <QrScanner
                active={scan}
                onRead={(value) => {
                  setQuery(value.toUpperCase());
                  void search(value);
                }}
              />
            </div>
          ) : null}
        </div>

        <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
          <div className="mb-3 flex items-center gap-2 text-sm">
            <CameraIcon className="size-4 text-primary" />
            <span>Cámaras LPR · aproximación</span>
          </div>
          {approaching.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay citas programadas por llegar.
            </p>
          ) : (
            <div className="grid gap-2">
              {approaching.map((appt) => (
                <button
                  key={appt.id}
                  type="button"
                  onClick={() => {
                    setQuery(appt.plate);
                    void search(appt.plate);
                  }}
                  className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2 text-left hover:bg-muted"
                >
                  <span>
                    <span className="plate-type block text-sm">
                      {displayPlate(appt.plate)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {appt.carrier} · {formatDateTime(appt.scheduledAt)}
                    </span>
                  </span>
                  <span className="text-xs text-emerald-300">97% lectura</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <BarrierGate open={barrierOpen} />
        {!lookup?.appointment ? (
          <div className="rounded-xl bg-card p-6 text-sm text-muted-foreground ring-1 ring-foreground/10">
            Escanea el QR del chofer o deja que la cámara lea la placa. Si no hay cita,
            la pluma se queda abajo.
          </div>
        ) : (
          <div className="space-y-4 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="plate-type text-3xl">
                  {displayPlate(lookup.appointment.plate)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {lookup.appointment.driverName} · {lookup.appointment.carrier}
                </p>
              </div>
              <StatusBadge status={lookup.appointment.status} />
            </div>
            <p className="text-sm">
              {operationLabel(lookup.appointment.operation)}
              {lookup.appointment.referenceCode
                ? ` · ${lookup.appointment.referenceCode}`
                : ""}
              {lookup.appointment.cargo ? ` · ${lookup.appointment.cargo}` : ""}
            </p>
            <DocsList appointment={lookup.appointment} />
            <label className="grid gap-1.5 text-sm">
              <span className="text-muted-foreground">Asignar andén o cajón</span>
              <select
                className="h-10 rounded-lg border border-input bg-transparent px-2.5"
                value={dockId}
                onChange={(e) => setDockId(e.target.value)}
              >
                <option value="">Asignación automática</option>
                {docks.map((dock) => (
                  <option key={dock.id} value={dock.id}>
                    {dock.label}
                    {dock.status === "libre" ? "" : " · actual"}
                  </option>
                ))}
              </select>
            </label>
            {!lookup.appointment.docsComplete ? (
              <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-200">
                Falta documentación. No se abre pluma hasta completar el expediente.
              </p>
            ) : null}
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="lg"
                className="h-12"
                disabled={busy || !lookup.appointment.docsComplete}
                onClick={() => void admit()}
              >
                Abrir pluma
              </Button>
              <Button
                size="lg"
                variant="destructive"
                className="h-12"
                disabled={busy}
                onClick={() => void reject()}
              >
                Rechazar
              </Button>
            </div>
            {barrierOpen && lookup.appointment.dockLabel ? (
              <p className="rounded-md bg-emerald-500/10 px-3 py-3 text-center text-lg font-semibold text-emerald-200">
                Asignado {lookup.appointment.dockLabel}
              </p>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}
