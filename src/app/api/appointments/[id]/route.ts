import { json, requireViewer } from "@/lib/auth";
import { getAppointment } from "@/lib/yard";

export async function GET(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const viewer = await requireViewer(request);
  if (viewer instanceof Response) return viewer;
  const { id } = await ctx.params;
  const appointment = await getAppointment(id);
  if (!appointment) {
    return json({ error: "Cita no encontrada." }, { status: 404 });
  }
  return json({ appointment });
}
