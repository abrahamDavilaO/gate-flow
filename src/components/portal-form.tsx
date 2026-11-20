"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckIcon } from "lucide-react";
import { cn } from "cn";
import { Button, ButtonLink } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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

const inputClass =
  "h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 py-1 text-sm text-foreground shadow-xs transition-colors outline-none placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30";

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

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
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
    <form onSubmit={onSubmit} className="space-y-6" noValidate={false}>
      <FormSection
        title="Unidad y chofer"
        description="Datos que la caseta usa para identificar la unidad."
        className="grid gap-5 sm:grid-cols-2"
      >
        <Field label="Transportista" htmlFor="carrier">
          <input
            id="carrier"
            name="carrier"
            required
            className={inputClass}
            value={form.carrier}
            onChange={(e) => set("carrier", e.target.value)}
            placeholder="Ej. Transportes Ortega"
          />
        </Field>
        <Field label="Placa del tracto" htmlFor="plate">
          <input
            id="plate"
            name="plate"
            required
            autoCapitalize="characters"
            className={`${inputClass} plate-type`}
            value={form.plate}
            onChange={(e) => set("plate", e.target.value.toUpperCase())}
            placeholder="Ej. ABC-45-01"
          />
        </Field>
        <Field label="Placa de caja (opcional)" htmlFor="trailerPlate">
          <input
            id="trailerPlate"
            name="trailerPlate"
            className={`${inputClass} plate-type`}
            value={form.trailerPlate}
            onChange={(e) => set("trailerPlate", e.target.value.toUpperCase())}
            placeholder="Ej. CJA-8821"
          />
        </Field>
        <Field label="Nombre del chofer" htmlFor="driverName">
          <input
            id="driverName"
            name="driverName"
            required
            className={inputClass}
            value={form.driverName}
            onChange={(e) => set("driverName", e.target.value)}
            placeholder="Ej. Luis Hernández Mora"
          />
        </Field>
        <Field label="Licencia" htmlFor="driverLicense">
          <input
            id="driverLicense"
            name="driverLicense"
            required
            className={inputClass}
            value={form.driverLicense}
            onChange={(e) => set("driverLicense", e.target.value)}
            placeholder="Ej. QRO-184392"
          />
        </Field>
        <Field label="Celular" htmlFor="phone">
          <input
            id="phone"
            name="phone"
            className={inputClass}
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="Ej. 442 155 0198"
          />
        </Field>
      </FormSection>

      <FormSection
        title="Operación"
        description="Tipo de maniobra y ventana de llegada al CEDIS."
        className="grid gap-5 sm:grid-cols-2"
      >
        <Field label="Tipo">
          <div className="grid h-10 grid-cols-2 gap-1 rounded-lg border border-input bg-background p-1">
            {(["descarga", "carga"] as const).map((op) => (
              <button
                key={op}
                type="button"
                aria-pressed={form.operation === op}
                onClick={() => set("operation", op)}
                className={cn(
                  "rounded-md text-sm font-medium transition-colors",
                  form.operation === op
                    ? "bg-muted text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {op === "descarga" ? "Descarga" : "Carga"}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Ventana de cita" htmlFor="scheduledAt">
          <input
            id="scheduledAt"
            name="scheduledAt"
            required
            type="datetime-local"
            className={inputClass}
            value={form.scheduledAt}
            onChange={(e) => set("scheduledAt", e.target.value)}
          />
        </Field>
        <Field label="Pedido / referencia" htmlFor="referenceCode">
          <input
            id="referenceCode"
            name="referenceCode"
            className={inputClass}
            value={form.referenceCode}
            onChange={(e) => set("referenceCode", e.target.value)}
            placeholder="Ej. OC-88421"
          />
        </Field>
        <Field label="Carga" htmlFor="cargo">
          <input
            id="cargo"
            name="cargo"
            className={inputClass}
            value={form.cargo}
            onChange={(e) => set("cargo", e.target.value)}
            placeholder="Ej. 18 tarimas de bebidas"
          />
        </Field>
      </FormSection>

      <FormSection
        title="Documentación previa"
        description="Confirma que el chofer lleva originales. Si falta un documento, la caseta no abre pluma."
      >
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
      </FormSection>

      <div className="flex flex-col-reverse gap-2 border-t border-border pt-6 sm:flex-row sm:justify-end">
        <ButtonLink href="/portal" variant="outline" size="lg" className="h-10 px-4">
          Cancelar
        </ButtonLink>
        <Button type="submit" size="lg" disabled={busy} className="h-10 px-4">
          {busy ? "Registrando…" : "Generar pase QR"}
        </Button>
      </div>
    </form>
  );
}

function FormSection({
  title,
  description,
  className,
  children,
}: {
  title: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card shadow-sm">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-sm font-semibold">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className={cn("p-5", className)}>{children}</div>
    </section>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2 text-sm">
      <Label htmlFor={htmlFor}>{label}</Label>
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
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "flex items-center gap-3 rounded-lg border px-3.5 py-3 text-left text-sm transition-colors",
        checked
          ? "border-primary/50 bg-primary/5"
          : "border-border bg-background hover:bg-muted/40",
      )}
    >
      <span
        className={cn(
          "grid size-4 shrink-0 place-items-center rounded-[4px] border",
          checked
            ? "border-primary bg-primary text-primary-foreground"
            : "border-input",
        )}
      >
        {checked ? <CheckIcon className="size-3" /> : null}
      </span>
      {label}
    </button>
  );
}
