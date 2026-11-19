"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { displayPlate, formatDateTime, operationLabel } from "@/lib/format";
import type { YardSnapshot } from "@/lib/types";
import { useYard } from "@/hooks/use-yard";

export function PortalHome({ initial }: { initial: YardSnapshot }) {
  const { yard, error, loading } = useYard(5000, initial);
  const appointments = yard?.appointments ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs tracking-[0.25em] text-muted-foreground uppercase">
            Transportista
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Citas de acceso</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Registra placa, chofer y documentos antes de llegar. El QR es el pase de
            caseta.
          </p>
        </div>
        <Button render={<Link href="/portal/nueva" />} size="lg">
          Nueva cita
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando citas…</p>
      ) : null}
      {error ? (
        <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      {appointments.length === 0 && !loading ? (
        <div className="rounded-xl bg-card p-8 text-center ring-1 ring-foreground/10">
          <p className="font-medium">Todavía no hay pases</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Crea la primera cita para obtener un código QR.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {appointments.map((appt) => (
            <li key={appt.id}>
              <Link
                href={`/portal/${appt.id}`}
                className="flex items-center justify-between gap-3 rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/10 hover:ring-primary/40"
              >
                <span>
                  <span className="plate-type block">
                    {displayPlate(appt.plate)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {appt.token} · {appt.carrier} · {operationLabel(appt.operation)} ·{" "}
                    {formatDateTime(appt.scheduledAt)}
                  </span>
                </span>
                <StatusBadge status={appt.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
