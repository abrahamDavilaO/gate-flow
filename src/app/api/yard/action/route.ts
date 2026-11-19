import { json, requireViewer } from "@/lib/auth";
import {
  assignDock,
  completeAndExit,
  resetYard,
  startOperation,
} from "@/lib/yard";

export async function POST(request: Request) {
  const viewer = await requireViewer(request);
  if (viewer instanceof Response) return viewer;
  let body: { action?: string; id?: string; dockId?: string };
  try {
    body = (await request.json()) as {
      action?: string;
      id?: string;
      dockId?: string;
    };
  } catch {
    return json({ error: "JSON inválido." }, { status: 400 });
  }
  try {
    if (body.action === "reset") {
      await resetYard();
      return json({ ok: true });
    }
    if (!body.id) {
      return json({ error: "Falta la unidad." }, { status: 400 });
    }
    if (body.action === "start") {
      return json({ appointment: await startOperation(body.id) });
    }
    if (body.action === "exit") {
      return json({ appointment: await completeAndExit(body.id) });
    }
    if (body.action === "assign") {
      if (!body.dockId) {
        return json({ error: "Falta el andén." }, { status: 400 });
      }
      return json({ appointment: await assignDock(body.id, body.dockId) });
    }
    return json({ error: "Acción no reconocida." }, { status: 400 });
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : "No se pudo actualizar." },
      { status: 400 },
    );
  }
}
