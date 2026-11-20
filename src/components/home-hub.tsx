"use client";

import Link from "next/link";
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  ArrowUpRightIcon,
  ChartColumnIcon,
  LayoutDashboardIcon,
  QrCodeIcon,
  ScanLineIcon,
  TimerIcon,
  TruckIcon,
  WarehouseIcon,
} from "lucide-react";
import { cn } from "cn";
import { ButtonLink } from "@/components/ui/button";
import { displayPlate, formatDuration } from "@/lib/format";
import { useYard } from "@/hooks/use-yard";
import { Dwell } from "@/components/dwell";
import { FACILITY } from "@/lib/constants";
import type { YardSnapshot } from "@/lib/types";

export function HomeHub({ initial }: { initial: YardSnapshot }) {
  const { yard } = useYard(5000, initial);
  const demo = yard?.appointments.find((a) => a.token === "PT-NORTE1");
  const demoPlate = demo ? displayPlate(demo.plate) : "ABC-45-01";

  const steps = [
    {
      title: "Abre el pase de muestra",
      body: `Transportes Ortega · ${demoPlate}. El QR contiene el token PT-NORTE1.`,
    },
    {
      title: "Valida la entrada en caseta",
      body: "Escanea el QR o pega el token. La pluma se abre y se asigna andén.",
    },
    {
      title: "Cierra el ciclo en patio",
      body: "Inicia la carga o descarga y registra la salida de la unidad.",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-16 px-4 py-12 sm:px-6 lg:py-16">
      <section
        className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center"
        data-tour="tour-hero"
      >
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
            </span>
            Operación en vivo · {FACILITY.site}, {FACILITY.city}
          </span>
          <h1 className="mt-6 max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Control de acceso y patio para centros de distribución
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-pretty text-muted-foreground">
            Citas con QR para transportistas, validación en caseta y un tablero de
            patio en tiempo real que detecta cuellos de botella antes de que afecten
            la operación.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/portal/nueva" size="lg" className="h-10 px-4">
              Registrar cita
              <ArrowRightIcon data-icon="inline-end" />
            </ButtonLink>
            <ButtonLink
              href="/caseta"
              size="lg"
              variant="outline"
              className="h-10 px-4"
            >
              Abrir caseta
            </ButtonLink>
          </div>
        </div>

        <div
          className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
          data-tour="tour-kpis"
        >
          <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
            <p className="text-sm font-medium">Estado del patio</p>
            <span className="text-xs text-muted-foreground">
              Actualización automática
            </span>
          </div>
          <dl className="grid grid-cols-2 gap-px bg-border">
            <Stat
              icon={<TruckIcon />}
              label="Unidades en sitio"
              value={yard ? String(yard.kpis.inYard) : "—"}
            />
            <Stat
              icon={<WarehouseIcon />}
              label="Andenes ocupados"
              value={
                yard ? `${yard.kpis.docksBusy}/${yard.kpis.docksTotal}` : "—"
              }
            />
            <Stat
              icon={<TimerIcon />}
              label="Estancia promedio"
              value={yard ? formatDuration(yard.kpis.avgDwellMinutes) : "—"}
            />
            <Stat
              icon={<AlertTriangleIcon />}
              label="Alertas activas"
              value={yard ? String(yard.kpis.overdue) : "—"}
              hot={Boolean(yard && yard.kpis.overdue > 0)}
            />
          </dl>
        </div>
      </section>

      <section className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Módulos</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Un flujo, cuatro roles. Cada módulo funciona de forma independiente y
            comparte los mismos datos en tiempo real.
          </p>
        </div>
        <div
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
          data-tour="tour-roles"
        >
          <RoleCard
            href="/portal"
            icon={<QrCodeIcon className="size-5" />}
            kicker="Transportista"
            title="Portal de citas"
            body="El chofer registra placa, documentación y ventana de llegada. Recibe un QR para no hacer fila en caseta."
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
            body="Entrada, inicio de carga o descarga y salida. Los andenes lentos se marcan antes de que se forme un tapón."
          />
          <RoleCard
            href="/analisis"
            icon={<ChartColumnIcon className="size-5" />}
            kicker="Gerencia"
            title="Análisis operativo"
            body="Tiempos promedio por andén y supervisor, cumplimiento de SLA y tendencias por día, mes o año."
          />
        </div>
      </section>

      <section
        className="grid overflow-hidden rounded-xl border border-border bg-card shadow-sm lg:grid-cols-2"
        data-tour="tour-demo"
      >
        <div className="p-6 sm:p-8">
          <h2 className="text-lg font-semibold tracking-tight">
            Recorre el ciclo completo
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Usa la cita de muestra para ver cómo fluye una unidad de la puerta al
            andén.
          </p>
          <ol className="mt-6 space-y-5">
            {steps.map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <span className="grid size-7 shrink-0 place-items-center rounded-full border border-border bg-background text-xs font-semibold tabular-nums">
                  {index + 1}
                </span>
                <div>
                  <p className="text-sm font-medium">{step.title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-8 flex flex-wrap gap-2">
            {demo ? (
              <ButtonLink href={`/portal/${demo.id}`}>
                Ver pase PT-NORTE1
                <ArrowRightIcon data-icon="inline-end" />
              </ButtonLink>
            ) : (
              <ButtonLink href="/portal">
                Ir al portal
                <ArrowRightIcon data-icon="inline-end" />
              </ButtonLink>
            )}
            <ButtonLink href="/caseta" variant="outline">
              Caseta
            </ButtonLink>
            <ButtonLink href="/patio" variant="outline">
              Tablero
            </ButtonLink>
          </div>
        </div>
        <div className="border-t border-border bg-background/40 p-6 sm:p-8 lg:border-t-0 lg:border-l">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Unidades en patio</h3>
            <ButtonLink href="/patio" variant="link" size="sm" className="px-0">
              Ver tablero
            </ButtonLink>
          </div>
          <LiveUnits yard={yard} />
        </div>
      </section>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  hot,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hot?: boolean;
}) {
  return (
    <div className="bg-card p-5">
      <dt className="flex items-center gap-2 text-xs text-muted-foreground [&_svg]:size-3.5">
        {icon}
        {label}
      </dt>
      <dd
        className={cn(
          "mt-2 text-2xl font-semibold tracking-tight tabular-nums",
          hot && "text-red-400",
        )}
      >
        {value}
      </dd>
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
      className="group flex flex-col rounded-xl border border-border bg-card p-6 shadow-sm transition-colors hover:border-primary/50"
    >
      <div className="flex items-center justify-between">
        <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </span>
        <ArrowUpRightIcon className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" />
      </div>
      <p className="mt-6 text-xs font-medium text-muted-foreground">{kicker}</p>
      <h3 className="mt-1 text-base font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </Link>
  );
}

function LiveUnits({ yard }: { yard: YardSnapshot | null }) {
  const active = (yard?.appointments ?? []).filter((a) =>
    ["en_sitio", "en_anden", "en_operacion"].includes(a.status),
  );

  if (active.length === 0) {
    return (
      <div className="mt-4 rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
        Patio en calma. Las unidades en sitio aparecerán aquí.
      </div>
    );
  }

  return (
    <ul className="mt-4 divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
      {active.slice(0, 5).map((appt) => (
        <li key={appt.id} className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
              <TruckIcon className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="plate-type text-sm">{displayPlate(appt.plate)}</p>
              <p className="truncate text-xs text-muted-foreground">
                {appt.dockLabel ?? "En espera"} · {appt.carrier}
              </p>
            </div>
          </div>
          <span className="text-sm">
            <Dwell from={appt.arrivedAt} warnAfter={90} />
          </span>
        </li>
      ))}
    </ul>
  );
}
