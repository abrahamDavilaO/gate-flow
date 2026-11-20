import { cn } from "cn";
import { Badge } from "@/components/ui/badge";
import { statusLabel } from "@/lib/format";
import type { AppointmentStatus } from "@/lib/types";

const styles: Record<AppointmentStatus, string> = {
  programada: "border-sky-400/25 bg-sky-400/10 text-sky-300",
  en_sitio: "border-amber-400/25 bg-amber-400/10 text-amber-300",
  en_anden: "border-violet-400/25 bg-violet-400/10 text-violet-300",
  en_operacion: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
  completa: "border-zinc-400/20 bg-zinc-400/10 text-zinc-300",
  cancelada: "border-zinc-500/20 bg-zinc-500/10 text-zinc-400",
  rechazada: "border-red-400/25 bg-red-400/10 text-red-300",
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return (
    <Badge variant="outline" className={cn("gap-1.5 rounded-md", styles[status])}>
      <span className="size-1.5 rounded-full bg-current" />
      {statusLabel(status)}
    </Badge>
  );
}
