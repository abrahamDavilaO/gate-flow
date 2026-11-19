"use client";

import { useEffect, useState } from "react";
import { formatDuration, minutesBetween } from "@/lib/format";

export function Dwell({
  from,
  until,
  warnAfter,
}: {
  from: string | null;
  until?: string | null;
  warnAfter?: number;
}) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    if (until) return;
    const tick = () => setNow(Date.now());
    const id = window.setInterval(tick, 1000);
    const start = window.setTimeout(tick, 0);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(start);
    };
  }, [until]);

  if (!from) return <span className="text-muted-foreground">—</span>;
  const end = until ? new Date(until).getTime() : now;
  if (end == null) return <span className="font-mono">…</span>;
  const minutes = minutesBetween(from, end);
  const hot = warnAfter != null && minutes > warnAfter;
  return (
    <span className={hot ? "font-mono text-red-300" : "font-mono text-foreground"}>
      {formatDuration(minutes)}
    </span>
  );
}
