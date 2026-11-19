"use client";

import { useEffect, useState } from "react";
import { TIME_ZONE } from "@/lib/constants";

export function LiveClock({ className }: { className?: string }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    const id = window.setInterval(tick, 1000);
    const start = window.setTimeout(tick, 0);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(start);
    };
  }, []);

  if (!now) {
    return <span className={className}>—</span>;
  }

  const time = new Intl.DateTimeFormat("es-MX", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(now);
  const date = new Intl.DateTimeFormat("es-MX", {
    timeZone: TIME_ZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(now);

  return (
    <span className={className}>
      <span className="font-mono tracking-wider">{time}</span>
      <span className="ml-2 text-muted-foreground">{date}</span>
    </span>
  );
}
