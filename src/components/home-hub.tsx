"use client";

import Link from "next/link";
import { QrCodeIcon, ScanLineIcon, LayoutDashboardIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { displayPlate, formatDuration } from "@/lib/format";
import { useYard } from "@/hooks/use-yard";
import { Dwell } from "@/components/dwell";
import { FACILITY } from "@/lib/constants";

export function HomeHub() {
  const { yard } = useYard(5000);
  const demo = yard?.appointments.find((a) => a.token === "PT-NORTE1");

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-8">
      <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
        <div>
          <p className="text-xs tracking-[0.3em] text-primary uppercase">
            {FACILITY.site} · {FACILITY.city}
          </p>
          <h1 className="mt-3 max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">
            El tracto llega con cita. La pluma ya sabe a qué andén mandarlo.
          </h1>
          <p className="mt-4 max-w-xl text-muted-foreground">
            Portal para el transportista, validación en caseta con QR o placa, y
            tablero de patio que marca entrada, inicio de carga y salida. Si alguien
            se estaciona de más, el cuello de botella aparece en el momento.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button render={<Link href="/portal/nueva" />} size="lg">
              Registrar cita
            </Button>
            <Button render={<Link href="/caseta" />} size="lg" variant="outline">
              Abrir caseta
            </Button>
          </div>
        </div>
        <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
          <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
            Patio ahora
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-3">
            <Stat label="En sitio" value={yard ? String(yard.kpis.inYard) : "—"} />
            <Stat
              label="Andenes"
              value={
                yard ? `${yard.kpis.docksBusy}/${yard.kpis.docksTotal}` : "—"
              }
            />
            <Stat
              label="Estancia"
              value={yard ? formatDuration(yard.kpis.avgDwellMinutes) : "—"}
            />
            <Stat
              label="Alertas"
              value={yard ? String(yard.kpis.overdue) : "—"}
              hot={Boolean(yard && yard.kpis.overdue > 0)}
            />
          </dl>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <RoleCard
          href="/portal"
          icon={<QrCodeIcon className="size-5" />}
          kicker="Transportista"
          title="Portal de citas"
          body="El chofer registra placa, documentación y ventana. Recibe un QR para no hacer fila en caseta."
        />
        <RoleCard
          href="/caseta"
          icon={<ScanLineIcon className="size-5" />}
          kicker="Caseta"
          title="Validación y pluma"
          body="Escanea el QR o lee la placa. Si el expediente está completo, se abre la pluma y se asigna andén."
        />
        <RoleCard
          href="/patio"
          icon={<LayoutDashboardIcon className="size-5" />}
          kicker="Jefe de patio"
          title="Tablero en tiempo real"
          body="Entrada, inicio de carga/descarga y salida. Los andenes lentos se marcan antes de que se arme el tapón."
        />
      </section>

      <section className="grid gap-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10 lg:grid-cols-[1fr_1fr]">
        <div>
          <h2 className="text-lg font-medium">Prueba el ciclo con datos de muestra</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
            <li>
              Abre la cita de Transportes Ortega ({demo ? displayPlate(demo.plate) : "ABC-45-01"})
              y enseña el QR <span className="font-mono text-primary">PT-NORTE1</span>.
            </li>
            <li>En caseta, escanea o pega el token. La pluma asigna andén al instante.</li>
            <li>En el tablero, inicia la operación y suelta la unidad al terminar.</li>
          </ol>
          <div className="mt-4 flex flex-wrap gap-2">
            {demo ? (
              <Button render={<Link href={`/portal/${demo.id}`} />} variant="outline">
                Ver pase PT-NORTE1
              </Button>
            ) : (
              <Button render={<Link href="/portal" />} variant="outline">
                Ir al portal
              </Button>
            )}
            <Button render={<Link href="/caseta" />} variant="outline">
              Caseta
            </Button>
            <Button render={<Link href="/patio" />} variant="outline">
              Tablero
            </Button>
          </div>
        </div>
        <LiveUnits />
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  hot,
}: {
  label: string;
  value: string;
  hot?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={`font-mono text-2xl ${hot ? "text-red-300" : ""}`}>{value}</dd>
    </div>
  );
}

function RoleCard({
  href,
  icon,
  kicker,
  title,
  body,
}: {
  href: string;
  icon: React.ReactNode;
  kicker: string;
  title: string;
  body: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl bg-card p-5 ring-1 ring-foreground/10 transition hover:ring-primary/40"
    >
      <div className="flex size-9 items-center justify-center rounded-md bg-primary/15 text-primary">
        {icon}
      </div>
      <p className="mt-4 text-xs tracking-[0.2em] text-muted-foreground uppercase">
        {kicker}
      </p>
      <h2 className="mt-1 text-lg font-medium">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </Link>
  );
}

function LiveUnits() {
  const { yard } = useYard(4000);
  const active = (yard?.appointments ?? []).filter((a) =>
    ["en_sitio", "en_anden", "en_operacion"].includes(a.status),
  );

  if (active.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Patio en calma. Las unidades en sitio se listan aquí.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {active.slice(0, 4).map((appt) => (
        <li
          key={appt.id}
          className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2"
        >
          <span>
            <span className="plate-type block text-sm">
              {displayPlate(appt.plate)}
            </span>
            <span className="text-xs text-muted-foreground">
              {appt.dockLabel ?? "En espera"} · {appt.carrier}
            </span>
          </span>
          <Dwell from={appt.arrivedAt} warnAfter={90} />
        </li>
      ))}
    </ul>
  );
}
