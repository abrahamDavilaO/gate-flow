import { json, requireViewer } from "@/lib/auth";
import { admitAppointment, lookupGate, rejectAppointment } from "@/lib/yard";

export async function GET(request: Request) {
  const viewer = await requireViewer(request);
  if (viewer instanceof Response) return viewer;
  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? "";
  const result = await lookupGate(q);
  return json(result);
}

export async function POST(request: Request) {
  const viewer = await requireViewer(request);
  if (viewer instanceof Response) return viewer;
  let body: { action?: string; id?: string; dockId?: string; reason?: string };
  try {
    body = (await request.json()) as {
      action?: string;
      id?: string;
      dockId?: string;
      reason?: string;
    };
  } catch {
    return json({ error: "JSON inválido." }, { status: 400 });
  }
  if (!body.id) {
    return json({ error: "Falta la cita." }, { status: 400 });
  }
  try {
    if (body.action === "reject") {
      const appointment = await rejectAppointment(
        body.id,
        body.reason?.trim() || "Documentación incompleta o cita inválida.",
      );
      return json({ appointment });
    }
    const appointment = await admitAppointment(body.id, body.dockId);
    return json({ appointment, barrier: "open" });
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : "No se pudo validar." },
      { status: 400 },
    );
  }
}
