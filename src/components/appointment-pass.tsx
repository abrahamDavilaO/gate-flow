"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { QrPass } from "@/components/qr-pass";
import { DocsList } from "@/components/docs-list";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/client";
import { displayPlate, formatDateTime } from "@/lib/format";
import type { AppointmentSummary } from "@/lib/types";

export function AppointmentPass({ id }: { id: string }) {
  const [appointment, setAppointment] = useState<AppointmentSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await api<{ appointment: AppointmentSummary }>(
          `/api/appointments/${id}`,
        );
        if (!cancelled) setAppointment(data.appointment);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Cita no encontrada.");
        }
      }
    }
    void load();
    const timer = window.setInterval(() => void load(), 4000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [id]);

  if (error) {
    return (
      <div className="mx-auto max-w-xl px-4 py-10">
        <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
        <Button render={<Link href="/portal" />} className="mt-4" variant="outline">
          Volver al portal
        </Button>
      </div>
    );
  }

  if (!appointment) {
    return (
      <p className="px-4 py-10 text-sm text-muted-foreground">Cargando pase…</p>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 py-8">
      <div>
        <p className="text-xs tracking-[0.25em] text-muted-foreground uppercase">
          Pase de acceso
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          {displayPlate(appointment.plate)}
        </h1>
        <p className="text-sm text-muted-foreground">
          Ventana {formatDateTime(appointment.scheduledAt)}
          {appointment.dockLabel ? ` · ${appointment.dockLabel}` : ""}
        </p>
      </div>
      <QrPass appointment={appointment} />
      <DocsList appointment={appointment} />
      <div className="flex flex-wrap gap-2">
        <Button render={<Link href="/caseta" />} variant="outline">
          Ir a caseta
        </Button>
        <Button render={<Link href="/portal" />} variant="ghost">
          Todas las citas
        </Button>
      </div>
    </div>
  );
}
