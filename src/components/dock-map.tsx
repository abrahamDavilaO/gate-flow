"use client";

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
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-xs tracking-[0.2em] text-muted-foreground uppercase">
          Muelle · andenes
        </p>
        <div className="rounded-lg bg-zinc-900 p-3 ring-1 ring-foreground/10">
          <div className="mb-3 h-6 rounded-sm bg-zinc-800 text-center text-[10px] leading-6 tracking-[0.3em] text-zinc-400 uppercase">
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
        <p className="mb-2 text-xs tracking-[0.2em] text-muted-foreground uppercase">
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
      ? "border-zinc-600 bg-zinc-800 text-zinc-500"
      : dock.status === "ocupado"
        ? "border-primary/40 bg-primary/10"
        : "border-emerald-500/30 bg-emerald-500/5";
  return (
    <button
      type="button"
      onClick={() => onSelect?.(dock.id)}
      className={`rounded-md border px-1.5 py-2 text-left ${tone} ${
        compact ? "min-h-16" : "min-h-24"
      }`}
    >
      <p className="text-[10px] tracking-wide text-muted-foreground uppercase">
        {dock.label}
      </p>
      {dock.status === "mantenimiento" ? (
        <p className="mt-1 text-[11px]">Fuera de servicio</p>
      ) : dock.current ? (
        <>
          <p className="plate-type mt-1 text-[11px] leading-tight">
            {displayPlate(dock.current.plate)}
          </p>
          <p className="text-[10px] text-muted-foreground">
            <Dwell from={dock.current.arrivedAt} warnAfter={90} />
          </p>
        </>
      ) : (
        <p className="mt-2 text-[11px] text-emerald-300">Libre</p>
      )}
    </button>
  );
}
