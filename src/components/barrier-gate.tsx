"use client";

export function BarrierGate({ open }: { open: boolean }) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-zinc-950 ring-1 ring-foreground/10">
      <div className="flex h-36 items-end justify-center bg-[radial-gradient(circle_at_top,oklch(0.3_0.03_95),transparent_55%)]">
        <div className="relative h-28 w-56">
          <div className="absolute bottom-0 left-6 h-24 w-3 rounded-sm bg-zinc-500" />
          <div
            className="absolute bottom-20 left-8 h-3 w-40 origin-left rounded-sm transition-transform duration-700"
            style={{
              transform: open ? "rotate(-78deg)" : "rotate(-8deg)",
              backgroundImage:
                "repeating-linear-gradient(90deg, oklch(0.84 0.15 85) 0 16px, oklch(0.18 0.02 95) 16px 32px)",
            }}
          />
          <div className="absolute bottom-2 left-2 right-2 h-2 rounded-full bg-zinc-700" />
        </div>
      </div>
      <div
        className={`px-4 py-2 text-center font-mono text-sm tracking-[0.25em] ${
          open ? "bg-emerald-500/20 text-emerald-200" : "bg-red-500/15 text-red-200"
        }`}
      >
        {open ? "PLUMA ABIERTA" : "PLUMA CERRADA"}
      </div>
    </div>
  );
}
