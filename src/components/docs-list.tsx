import { CheckIcon, XIcon } from "lucide-react";
import { cn } from "cn";
import type { AppointmentSummary } from "@/lib/types";

const items = [
  ["license", "Licencia federal"],
  ["circulation", "Tarjeta de circulación"],
  ["insurance", "Seguro vigente"],
  ["cartaPorte", "Carta porte"],
] as const;

export function DocsList({ appointment }: { appointment: AppointmentSummary }) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {items.map(([key, label]) => {
        const ok = appointment.docs[key];
        return (
          <li
            key={key}
            className="flex items-center gap-2.5 rounded-lg border border-border bg-background/50 px-3 py-2.5 text-sm"
          >
            <span
              className={cn(
                "grid size-5 shrink-0 place-items-center rounded-full",
                ok ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400",
              )}
            >
              {ok ? <CheckIcon className="size-3" /> : <XIcon className="size-3" />}
            </span>
            <span className={ok ? "text-foreground" : "text-red-300"}>{label}</span>
          </li>
        );
      })}
    </ul>
  );
}
