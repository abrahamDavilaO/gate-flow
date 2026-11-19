import { CheckIcon, XIcon } from "lucide-react";
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
            className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-sm"
          >
            {ok ? (
              <CheckIcon className="size-4 text-emerald-400" />
            ) : (
              <XIcon className="size-4 text-red-400" />
            )}
            <span className={ok ? "text-foreground" : "text-red-200"}>{label}</span>
          </li>
        );
      })}
    </ul>
  );
}
