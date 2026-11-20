"use client";

import { cn } from "cn";

export function BarrierGate({ open }: { open: boolean }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <h2 className="text-sm font-medium">Pluma de acceso</h2>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium",
            open
              ? "bg-emerald-500/10 text-emerald-300"
              : "bg-red-500/10 text-red-300",
          )}
        >
          <span className="size-1.5 rounded-full bg-current" />
          {open ? "Abierta" : "Cerrada"}
        </span>
      </div>
      <div className="flex h-36 items-end justify-center bg-[radial-gradient(circle_at_top,oklch(0.26_0.02_260),transparent_60%)]">
        <div className="relative h-28 w-56">
          <div className="absolute bottom-0 left-6 h-24 w-3 rounded-sm bg-zinc-500" />
          <div
            className="absolute bottom-20 left-8 h-3 w-40 origin-left rounded-sm transition-transform duration-700"
            style={{
              transform: open ? "rotate(-78deg)" : "rotate(-8deg)",
              backgroundImage:
                "repeating-linear-gradient(90deg, oklch(0.64 0.2 25) 0 16px, oklch(0.95 0 0) 16px 32px)",
            }}
          />
          <div className="absolute right-2 bottom-2 left-2 h-1.5 rounded-full bg-zinc-700" />
        </div>
      </div>
    </div>
  );
}
