"use client";

import { QRCodeSVG } from "qrcode.react";
import { displayPlate, formatDateTime, operationLabel } from "@/lib/format";
import type { AppointmentSummary } from "@/lib/types";
import { StatusBadge } from "@/components/status-badge";

export function QrPass({ appointment }: { appointment: AppointmentSummary }) {
  return (
    <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
      <div className="hazard-strip h-2" />
      <div className="grid gap-6 p-6 sm:grid-cols-[220px_1fr] sm:items-center">
        <div className="mx-auto rounded-lg bg-white p-3">
          <QRCodeSVG
            value={appointment.token}
            size={196}
            level="M"
            bgColor="#ffffff"
            fgColor="#14160f"
            includeMargin={false}
          />
        </div>
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-mono text-lg tracking-[0.2em] text-primary">
              {appointment.token}
            </p>
            <StatusBadge status={appointment.status} />
          </div>
          <p className="plate-type text-2xl">{displayPlate(appointment.plate)}</p>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div>
              <dt className="text-muted-foreground">Chofer</dt>
              <dd>{appointment.driverName}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Transportista</dt>
              <dd>{appointment.carrier}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Operación</dt>
              <dd>{operationLabel(appointment.operation)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Ventana</dt>
              <dd>{formatDateTime(appointment.scheduledAt)}</dd>
            </div>
          </dl>
          <p className="text-sm text-muted-foreground">
            Presenta este QR en caseta. Si la cámara LPR lee la placa, no hace falta
            bajarse.
          </p>
        </div>
      </div>
    </div>
  );
}
