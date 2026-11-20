"use client";

import { cn } from "cn";
import { displayPlate } from "@/lib/format";
import type { Dock } from "@/lib/types";
import { Dwell } from "@/components/dwell";

export function DockMap({
  docks,
  onSelect,
}: {
  docks: Dock[];
  onSelect?: (dockId: string) => void;
}) {
  const andenes = docks.filter((d) => d.kind === "anden");
  const cajones = docks.filter((d) => d.kind === "cajon");

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2.5 text-xs font-medium text-muted-foreground">
          Muelle · Andenes
        </p>
        <div className="rounded-lg border border-border bg-background/50 p-3">
          <div className="mb-3 rounded-md bg-muted py-1.5 text-center text-[11px] font-medium text-muted-foreground">
            Bodega CEDIS Norte
          </div>
          <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
            {andenes.map((dock) => (
              <DockCell key={dock.id} dock={dock} onSelect={onSelect} />
            ))}
          </div>
        </div>
      </div>
      <div>
        <p className="mb-2.5 text-xs font-medium text-muted-foreground">
          Patio de espera
        </p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {cajones.map((dock) => (
            <DockCell key={dock.id} dock={dock} onSelect={onSelect} compact />
          ))}
        </div>
      </div>
    </div>
  );
}

function DockCell({
  dock,
  onSelect,
  compact,
}: {
  dock: Dock;
  onSelect?: (dockId: string) => void;
  compact?: boolean;
}) {
  const tone =
    dock.status === "mantenimiento"
      ? "border-dashed border-border bg-muted/30 text-muted-foreground"
      : dock.status === "ocupado"
        ? "border-primary/40 bg-primary/10 hover:border-primary/70"
        : "border-emerald-500/25 bg-emerald-500/5 hover:border-emerald-500/50";
  return (
    <button
      type="button"
      onClick={() => onSelect?.(dock.id)}
      className={cn(
        "rounded-md border px-2 py-2 text-left transition-colors",
        tone,
        compact ? "min-h-16" : "min-h-24",
      )}
    >
      <p className="text-[11px] font-medium text-muted-foreground">{dock.label}</p>
      {dock.status === "mantenimiento" ? (
        <p className="mt-1 text-[11px]">Fuera de servicio</p>
      ) : dock.current ? (
        <>
          <p className="plate-type mt-1 text-[11px] leading-tight">
            {displayPlate(dock.current.plate)}
          </p>
          <p className="text-[11px] text-muted-foreground">
            <Dwell from={dock.current.arrivedAt} warnAfter={90} />
          </p>
        </>
      ) : (
        <p className="mt-2 text-[11px] font-medium text-emerald-400">Libre</p>
      )}
    </button>
  );
}
