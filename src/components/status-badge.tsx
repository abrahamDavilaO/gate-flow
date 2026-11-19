import { Badge } from "@/components/ui/badge";
import { statusLabel } from "@/lib/format";
import type { AppointmentStatus } from "@/lib/types";

const styles: Record<AppointmentStatus, string> = {
  programada: "border-sky-400/30 bg-sky-400/10 text-sky-200",
  en_sitio: "border-amber-400/40 bg-amber-400/15 text-amber-200",
  en_anden: "border-orange-400/40 bg-orange-400/15 text-orange-200",
  en_operacion: "border-emerald-400/40 bg-emerald-400/15 text-emerald-200",
  completa: "border-zinc-400/30 bg-zinc-400/10 text-zinc-300",
  cancelada: "border-zinc-500/30 bg-zinc-500/10 text-zinc-400",
  rechazada: "border-red-400/40 bg-red-400/15 text-red-200",
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return (
    <Badge variant="outline" className={styles[status]}>
      {statusLabel(status)}
    </Badge>
  );
}
