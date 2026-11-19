import { json, requireViewer } from "@/lib/auth";
import { createAppointment, listAppointments } from "@/lib/yard";
import type { CreateAppointmentInput, Operation } from "@/lib/types";

export async function GET(request: Request) {
  const viewer = await requireViewer(request);
  if (viewer instanceof Response) return viewer;
  const appointments = await listAppointments();
  return json({ appointments });
}

export async function POST(request: Request) {
  const viewer = await requireViewer(request);
  if (viewer instanceof Response) return viewer;
  let body: Partial<CreateAppointmentInput>;
  try {
    body = (await request.json()) as Partial<CreateAppointmentInput>;
  } catch {
    return json({ error: "JSON inválido." }, { status: 400 });
  }
  const operation = body.operation;
  if (operation !== "carga" && operation !== "descarga") {
    return json({ error: "Indica si es carga o descarga." }, { status: 400 });
  }
  const required = [
    body.carrier,
    body.plate,
    body.driverName,
    body.driverLicense,
    body.scheduledAt,
  ];
  if (required.some((value) => !value || String(value).trim() === "")) {
    return json(
      { error: "Faltan datos del tracto, chofer o ventana de cita." },
      { status: 400 },
    );
  }
  try {
    const appointment = await createAppointment({
      carrier: String(body.carrier),
      plate: String(body.plate),
      trailerPlate: body.trailerPlate,
      driverName: String(body.driverName),
      driverLicense: String(body.driverLicense),
      phone: body.phone,
      operation: operation as Operation,
      referenceCode: body.referenceCode,
      cargo: body.cargo,
      scheduledAt: String(body.scheduledAt),
      docsLicense: Boolean(body.docsLicense),
      docsCirculation: Boolean(body.docsCirculation),
      docsInsurance: Boolean(body.docsInsurance),
      docsCartaPorte: Boolean(body.docsCartaPorte),
    });
    return json({ appointment }, { status: 201 });
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : "No se pudo registrar." },
      { status: 400 },
    );
  }
}
