"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { api } from "@/lib/client";
import type { AppointmentSummary, Operation } from "@/lib/types";

const empty = {
  carrier: "",
  plate: "",
  trailerPlate: "",
  driverName: "",
  driverLicense: "",
  phone: "",
  operation: "descarga" as Operation,
  referenceCode: "",
  cargo: "",
  scheduledAt: "",
  docsLicense: false,
  docsCirculation: false,
  docsInsurance: false,
  docsCartaPorte: false,
};

function defaultWindow() {
  const d = new Date(Date.now() + 90 * 60_000);
  d.setSeconds(0, 0);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function PortalForm() {
  const router = useRouter();
  const [form, setForm] = useState({ ...empty, scheduledAt: defaultWindow() });
  const [busy, setBusy] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const scheduled = new Date(form.scheduledAt);
      const { appointment } = await api<{ appointment: AppointmentSummary }>(
        "/api/appointments",
        {
          method: "POST",
          body: JSON.stringify({
            ...form,
            scheduledAt: scheduled.toISOString(),
          }),
        },
      );
      toast.success("Cita lista. Ya puedes presentar el QR en caseta.");
      router.push(`/portal/${appointment.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se registró la cita.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <section className="grid gap-4 rounded-xl bg-card p-4 ring-1 ring-foreground/10 sm:grid-cols-2">
        <h2 className="font-heading sm:col-span-2 text-base">Unidad y chofer</h2>
        <Field label="Transportista">
          <Input
            required
            value={form.carrier}
            onChange={(e) => set("carrier", e.target.value)}
            placeholder="Transportes Ortega"
          />
        </Field>
        <Field label="Placa del tracto">
          <Input
            required
            className="plate-type"
            value={form.plate}
            onChange={(e) => set("plate", e.target.value.toUpperCase())}
            placeholder="ABC-45-01"
          />
        </Field>
        <Field label="Placa de caja (opcional)">
          <Input
            className="plate-type"
            value={form.trailerPlate}
            onChange={(e) => set("trailerPlate", e.target.value.toUpperCase())}
            placeholder="CJA-8821"
          />
        </Field>
        <Field label="Nombre del chofer">
          <Input
            required
            value={form.driverName}
            onChange={(e) => set("driverName", e.target.value)}
            placeholder="Luis Hernández Mora"
          />
        </Field>
        <Field label="Licencia">
          <Input
            required
            value={form.driverLicense}
            onChange={(e) => set("driverLicense", e.target.value)}
            placeholder="QRO-184392"
          />
        </Field>
        <Field label="Celular">
          <Input
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="442 155 0198"
          />
        </Field>
      </section>

      <section className="grid gap-4 rounded-xl bg-card p-4 ring-1 ring-foreground/10 sm:grid-cols-2">
        <h2 className="font-heading sm:col-span-2 text-base">Operación</h2>
        <Field label="Tipo">
          <div className="grid grid-cols-2 gap-2">
            {(["descarga", "carga"] as const).map((op) => (
              <Button
                key={op}
                type="button"
                variant={form.operation === op ? "default" : "outline"}
                onClick={() => set("operation", op)}
              >
                {op === "descarga" ? "Descarga" : "Carga"}
              </Button>
            ))}
          </div>
        </Field>
        <Field label="Ventana de cita">
          <Input
            required
            type="datetime-local"
            value={form.scheduledAt}
            onChange={(e) => set("scheduledAt", e.target.value)}
          />
        </Field>
        <Field label="Pedido / referencia">
          <Input
            value={form.referenceCode}
            onChange={(e) => set("referenceCode", e.target.value)}
            placeholder="OC-88421"
          />
        </Field>
        <Field label="Carga">
          <Input
            value={form.cargo}
            onChange={(e) => set("cargo", e.target.value)}
            placeholder="18 tarimas de bebidas"
          />
        </Field>
      </section>

      <section className="space-y-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
        <h2 className="font-heading text-base">Documentación previa</h2>
        <p className="text-sm text-muted-foreground">
          Confirma que el chofer lleva originales. Si falta un documento, la caseta no
          abre pluma.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <DocCheck
            label="Licencia federal vigente"
            checked={form.docsLicense}
            onChange={(v) => set("docsLicense", v)}
          />
          <DocCheck
            label="Tarjeta de circulación"
            checked={form.docsCirculation}
            onChange={(v) => set("docsCirculation", v)}
          />
          <DocCheck
            label="Póliza de seguro"
            checked={form.docsInsurance}
            onChange={(v) => set("docsInsurance", v)}
          />
          <DocCheck
            label="Carta porte / complemento"
            checked={form.docsCartaPorte}
            onChange={(v) => set("docsCartaPorte", v)}
          />
        </div>
      </section>

      <Button type="submit" size="lg" disabled={busy} className="h-11 w-full sm:w-auto">
        {busy ? "Registrando…" : "Generar pase QR"}
      </Button>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5 text-sm">
      <Label className="text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function DocCheck({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 rounded-md bg-muted/40 px-3 py-2 text-sm">
      <Checkbox
        checked={checked}
        onCheckedChange={(value) => onChange(Boolean(value))}
      />
      {label}
    </label>
  );
}
