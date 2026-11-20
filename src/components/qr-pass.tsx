"use client";

import { QRCodeSVG } from "qrcode.react";
import { displayPlate, formatDateTime, operationLabel } from "@/lib/format";
import type { AppointmentSummary } from "@/lib/types";
import { StatusBadge } from "@/components/status-badge";

export function QrPass({ appointment }: { appointment: AppointmentSummary }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-3.5">
        <p className="text-sm font-medium">Pase de acceso</p>
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs tracking-wider">
            {appointment.token}
          </span>
          <StatusBadge status={appointment.status} />
        </div>
      </div>
      <div className="grid gap-8 p-6 sm:grid-cols-[auto_1fr] sm:items-center">
        <div className="mx-auto rounded-lg bg-white p-3 shadow-sm">
          <QRCodeSVG
            value={appointment.token}
            size={180}
            level="M"
            bgColor="#ffffff"
            fgColor="#0f172a"
            includeMargin={false}
          />
        </div>
        <div className="space-y-5">
          <div>
            <p className="text-xs text-muted-foreground">Placa del tracto</p>
            <p className="plate-type mt-1 text-2xl">{displayPlate(appointment.plate)}</p>
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <Detail label="Chofer" value={appointment.driverName} />
            <Detail label="Transportista" value={appointment.carrier} />
            <Detail label="Operación" value={operationLabel(appointment.operation)} />
            <Detail label="Ventana" value={formatDateTime(appointment.scheduledAt)} />
          </dl>
          <p className="rounded-lg bg-muted/50 px-3 py-2.5 text-xs text-muted-foreground">
            Presenta este QR en caseta. Si la cámara LPR lee la placa, no es
            necesario bajar de la unidad.
          </p>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
    </div>
  );
}
