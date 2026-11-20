"use client";

import Link from "next/link";
import { ChevronRightIcon, PlusIcon, TruckIcon } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { displayPlate, formatDateTime, operationLabel } from "@/lib/format";
import type { YardSnapshot } from "@/lib/types";
import { useYard } from "@/hooks/use-yard";

export function PortalHome({ initial }: { initial: YardSnapshot }) {
  const { yard, error, loading } = useYard(5000, initial);
  const appointments = yard?.appointments ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10 sm:px-6">
      <PageHeader
        data-tour="tour-portal-intro"
        eyebrow="Transportista"
        title="Citas de acceso"
        description="Registra placa, chofer y documentos antes de llegar. El código QR funciona como pase de caseta."
        actions={
          <ButtonLink href="/portal/nueva" data-tour="tour-portal-new">
            <PlusIcon data-icon="inline-start" />
            Nueva cita
          </ButtonLink>
        }
      />

      {error ? (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <p className="text-sm font-medium">Citas registradas</p>
          <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground tabular-nums">
            {appointments.length}
          </span>
        </div>

        {loading ? (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">
            Cargando citas…
          </p>
        ) : appointments.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <p className="font-medium">Todavía no hay pases</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Crea la primera cita para obtener un código QR.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {appointments.map((appt) => (
              <li key={appt.id}>
                <Link
                  href={`/portal/${appt.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-muted/40"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                      <TruckIcon className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="plate-type text-sm">{displayPlate(appt.plate)}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {appt.carrier} · {operationLabel(appt.operation)} ·{" "}
                        {formatDateTime(appt.scheduledAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="hidden font-mono text-xs text-muted-foreground sm:inline">
                      {appt.token}
                    </span>
                    <StatusBadge status={appt.status} />
                    <ChevronRightIcon className="size-4 text-muted-foreground" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
