"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { QrPass } from "@/components/qr-pass";
import { DocsList } from "@/components/docs-list";
import { ButtonLink } from "@/components/ui/button";
import { api } from "@/lib/client";
import { displayPlate, formatDateTime } from "@/lib/format";
import type { AppointmentSummary } from "@/lib/types";

export function AppointmentPass({
  id,
  initial,
}: {
  id: string;
  initial: AppointmentSummary | null;
}) {
  const [appointment, setAppointment] = useState<AppointmentSummary | null>(initial);
  const [error, setError] = useState<string | null>(
    initial ? null : "Cita no encontrada.",
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await api<{ appointment: AppointmentSummary }>(
          `/api/appointments/${id}`,
        );
        if (!cancelled) {
          setAppointment(data.appointment);
          setError(null);
        }
      } catch (err) {
        if (!cancelled && !initial) {
          setError(err instanceof Error ? err.message : "Cita no encontrada.");
        }
      }
    }
    const timer = window.setInterval(() => void load(), 4000);
    const start = window.setTimeout(() => void load(), initial ? 4000 : 0);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.clearTimeout(start);
    };
  }, [id, initial]);

  if (error) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6">
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
        <ButtonLink href="/portal" className="mt-6" variant="outline">
          Volver al portal
        </ButtonLink>
      </div>
    );
  }

  if (!appointment) {
    return (
      <p className="mx-auto max-w-3xl px-4 py-16 text-sm text-muted-foreground sm:px-6">
        Cargando pase…
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10 sm:px-6">
      <div className="space-y-4">
        <Link
          href="/portal"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeftIcon className="size-4" />
          Citas
        </Link>
        <PageHeader
          eyebrow="Pase de acceso"
          title={<span className="plate-type">{displayPlate(appointment.plate)}</span>}
          description={`Ventana ${formatDateTime(appointment.scheduledAt)}${
            appointment.dockLabel ? ` · ${appointment.dockLabel}` : ""
          }`}
          actions={
            <ButtonLink href="/caseta" variant="outline">
              Ir a caseta
            </ButtonLink>
          }
        />
      </div>
      <QrPass appointment={appointment} />
      <section className="rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-5 py-3.5">
          <h2 className="text-sm font-medium">Documentación</h2>
        </div>
        <div className="p-5">
          <DocsList appointment={appointment} />
        </div>
      </section>
    </div>
  );
}
