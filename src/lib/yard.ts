import { randomBytes, randomUUID } from "node:crypto";
import { connection } from "next/server";
import { DELAY_CATEGORIES, FACILITY, SLA_MINUTES, SUPERVISORS } from "./constants";
import { delayCategoryLabel } from "./sla";
import { sql } from "./db";
import { seedHistory } from "./history";
import { docsOk, minutesBetween, normalizePlate } from "./format";
import type {
  Alert,
  AppointmentSummary,
  CreateAppointmentInput,
  Dock,
  DockKind,
  GateLookup,
  YardEvent,
  YardSnapshot,
} from "./types";

type DockRow = {
  id: string;
  label: string;
  kind: DockKind;
  bay_order: number;
  status: "libre" | "ocupado" | "mantenimiento";
};

type AppointmentRow = {
  id: string;
  token: string;
  carrier: string;
  plate: string;
  trailer_plate: string | null;
  driver_name: string;
  driver_license: string;
  phone: string | null;
  operation: "carga" | "descarga";
  reference_code: string | null;
  cargo: string | null;
  scheduled_at: string;
  docs_license: boolean;
  docs_circulation: boolean;
  docs_insurance: boolean;
  docs_carta_porte: boolean;
  status: AppointmentSummary["status"];
  dock_id: string | null;
  created_at: string;
  arrived_at: string | null;
  load_started_at: string | null;
  departed_at: string | null;
  rejected_reason: string | null;
  supervisor: string | null;
  delay_category: string | null;
  delay_notes: string | null;
  delay_recorded_at: string | null;
  dock_label: string | null;
  dock_kind: DockKind | null;
};

type EventRow = {
  id: string;
  appointment_id: string;
  kind: string;
  at: string;
  detail: string | null;
};

let ready: Promise<void> | undefined;

function iso(value: Date | string) {
  return new Date(value).toISOString();
}

function minutesAgo(minutes: number) {
  return new Date(Date.now() - minutes * 60_000);
}

function minutesFromNow(minutes: number) {
  return new Date(Date.now() + minutes * 60_000);
}

function token() {
  return `PT-${randomBytes(3).toString("hex").toUpperCase()}`;
}

function mapAppointment(row: AppointmentRow): AppointmentSummary {
  const docs = {
    license: row.docs_license,
    circulation: row.docs_circulation,
    insurance: row.docs_insurance,
    cartaPorte: row.docs_carta_porte,
  };
  return {
    id: row.id,
    token: row.token,
    carrier: row.carrier,
    plate: row.plate,
    trailerPlate: row.trailer_plate,
    driverName: row.driver_name,
    driverLicense: row.driver_license,
    phone: row.phone,
    operation: row.operation,
    referenceCode: row.reference_code,
    cargo: row.cargo,
    scheduledAt: iso(row.scheduled_at),
    docs,
    docsComplete: docsOk(docs),
    status: row.status,
    dockId: row.dock_id,
    dockLabel: row.dock_label,
    dockKind: row.dock_kind,
    createdAt: iso(row.created_at),
    arrivedAt: row.arrived_at ? iso(row.arrived_at) : null,
    loadStartedAt: row.load_started_at ? iso(row.load_started_at) : null,
    departedAt: row.departed_at ? iso(row.departed_at) : null,
    rejectedReason: row.rejected_reason,
    supervisor: row.supervisor,
    delayCategory: row.delay_category,
    delayNotes: row.delay_notes,
    delayRecordedAt: row.delay_recorded_at
      ? iso(row.delay_recorded_at)
      : null,
  };
}

export async function ensureReady() {
  await connection();
  ready ??= seedIfEmpty().catch((error: unknown) => {
    ready = undefined;
    throw error;
  });
  await ready;
}

async function seedIfEmpty() {
  const [{ n }] = await sql<{ n: string }>(
    "select count(*)::text as n from docks",
  );
  if (Number(n) > 0) return;
  await seedYard();
}

export async function resetYard() {
  await sql("delete from yard_events");
  await sql("delete from appointments");
  await sql("delete from docks");
  await sql("delete from app_meta");
  await seedYard();
}

async function seedYard() {
  const docks: Array<{
    id: string;
    label: string;
    kind: DockKind;
    bay: number;
    status: DockRow["status"];
  }> = [];
  for (let i = 1; i <= 10; i += 1) {
    docks.push({
      id: `A${i}`,
      label: `Andén ${i}`,
      kind: "anden",
      bay: i,
      status: i === 10 ? "mantenimiento" : "libre",
    });
  }
  for (let i = 1; i <= 6; i += 1) {
    docks.push({
      id: `E${i}`,
      label: `Cajón E${i}`,
      kind: "cajon",
      bay: 100 + i,
      status: "libre",
    });
  }
  for (const dock of docks) {
    await sql(
      "insert into docks (id, label, kind, bay_order, status) values ($1, $2, $3, $4, $5)",
      [dock.id, dock.label, dock.kind, dock.bay, dock.status],
    );
  }

  const samples: Array<{
    token: string;
    carrier: string;
    plate: string;
    trailer?: string;
    driver: string;
    license: string;
    phone: string;
    operation: "carga" | "descarga";
    reference: string;
    cargo: string;
    scheduled: Date;
    docs: boolean;
    status: AppointmentSummary["status"];
    dock?: string;
    arrived?: Date;
    started?: Date;
    departed?: Date;
    supervisor?: string;
  }> = [
    {
      token: "PT-NORTE1",
      carrier: "Transportes Ortega",
      plate: "ABC-45-01",
      trailer: "CJA-8821",
      driver: "Luis Hernández Mora",
      license: "QRO-184392",
      phone: "442 155 0198",
      operation: "descarga",
      reference: "OC-88421",
      cargo: "Bebidas · 18 tarimas",
      scheduled: minutesFromNow(25),
      docs: true,
      status: "programada",
    },
    {
      token: "PT-DOCSX2",
      carrier: "Grupo Traxión",
      plate: "DEF-88-09",
      driver: "María del Carmen Ruiz",
      license: "MEX-220441",
      phone: "55 8120 4471",
      operation: "carga",
      reference: "PED-1209",
      cargo: "Abarrotes secos",
      scheduled: minutesFromNow(70),
      docs: true,
      status: "programada",
    },
    {
      token: token(),
      carrier: "TUM",
      plate: "93-UW-6A",
      trailer: "TUM-4410",
      driver: "Óscar Beltrán Díaz",
      license: "NL-908821",
      phone: "81 3004 1190",
      operation: "descarga",
      reference: "ASN-3301",
      cargo: "Línea blanca",
      scheduled: minutesAgo(160),
      docs: true,
      status: "en_operacion",
      dock: "A3",
      arrived: minutesAgo(140),
      started: minutesAgo(118),
      supervisor: SUPERVISORS[0],
    },
    {
      token: token(),
      carrier: "Transportes Castores",
      plate: "JKL-82-15",
      trailer: "CST-1902",
      driver: "Pedro Aguilar Soto",
      license: "GTO-441902",
      phone: "477 210 8834",
      operation: "carga",
      reference: "SAL-774",
      cargo: "Refacciones automotrices",
      scheduled: minutesAgo(80),
      docs: true,
      status: "en_anden",
      dock: "A7",
      arrived: minutesAgo(38),
    },
    {
      token: token(),
      carrier: "Estafeta",
      plate: "12-AB-34",
      driver: "Ana Paola Méndez",
      license: "MEX-118203",
      phone: "55 4400 2211",
      operation: "descarga",
      reference: "GUIA-99210",
      cargo: "Paquetería consolidada",
      scheduled: minutesAgo(50),
      docs: true,
      status: "en_sitio",
      dock: "E2",
      arrived: minutesAgo(24),
    },
    {
      token: token(),
      carrier: "Paquetexpress",
      plate: "XYZ-10-22",
      trailer: "PQX-2201",
      driver: "Ricardo Nava Peña",
      license: "JAL-330118",
      phone: "33 3612 0098",
      operation: "descarga",
      reference: "OC-90112",
      cargo: "Consumibles de almacén",
      scheduled: minutesAgo(70),
      docs: true,
      status: "en_operacion",
      dock: "A1",
      arrived: minutesAgo(40),
      started: minutesAgo(35),
      supervisor: SUPERVISORS[1],
    },
    {
      token: token(),
      carrier: "FEMSA Logística",
      plate: "MNO-33-44",
      trailer: "FEM-1188",
      driver: "Jorge Iván Salas",
      license: "MEX-774120",
      phone: "55 9120 3344",
      operation: "carga",
      reference: "TRF-441",
      cargo: "Ruta tiendas · 22 tarimas",
      scheduled: minutesAgo(30),
      docs: true,
      status: "en_operacion",
      dock: "A5",
      arrived: minutesAgo(22),
      started: minutesAgo(12),
      supervisor: SUPERVISORS[3],
    },
    {
      token: token(),
      carrier: "Alianza Mexicana de Transporte",
      plate: "GHI-11-22",
      trailer: "AMT-0091",
      driver: "Elena Vázquez Cruz",
      license: "PUE-220911",
      phone: "222 140 8890",
      operation: "descarga",
      reference: "OC-77002",
      cargo: "Empaque y cartón",
      scheduled: minutesAgo(280),
      docs: true,
      status: "completa",
      dock: "A2",
      arrived: minutesAgo(260),
      started: minutesAgo(240),
      departed: minutesAgo(165),
      supervisor: SUPERVISORS[2],
    },
    {
      token: token(),
      carrier: "Transportes Castores",
      plate: "RST-61-08",
      driver: "Iván Cordero",
      license: "QRO-4411",
      phone: "442 100 2290",
      operation: "carga",
      reference: "SAL-801",
      cargo: "Exportación Laredo",
      scheduled: minutesFromNow(140),
      docs: true,
      status: "programada",
    },
  ];

  for (const sample of samples) {
    const id = randomUUID();
    await sql(
      `insert into appointments (
        id, token, carrier, plate, trailer_plate, driver_name, driver_license, phone,
        operation, reference_code, cargo, scheduled_at, docs_license, docs_circulation,
        docs_insurance, docs_carta_porte, status, dock_id, created_at, arrived_at,
        load_started_at, departed_at, supervisor
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)`,
      [
        id,
        sample.token,
        sample.carrier,
        normalizePlate(sample.plate),
        sample.trailer ? normalizePlate(sample.trailer) : null,
        sample.driver,
        sample.license,
        sample.phone,
        sample.operation,
        sample.reference,
        sample.cargo,
        sample.scheduled.toISOString(),
        sample.docs,
        sample.docs,
        sample.docs,
        sample.docs && sample.token !== "PT-DOCSX2",
        sample.status,
        sample.dock ?? null,
        minutesAgo(300).toISOString(),
        sample.arrived?.toISOString() ?? null,
        sample.started?.toISOString() ?? null,
        sample.departed?.toISOString() ?? null,
        sample.supervisor ?? null,
      ],
    );
    if (sample.dock && sample.status !== "completa") {
      await sql("update docks set status = 'ocupado' where id = $1", [
        sample.dock,
      ]);
    }
    await addEvent(id, "creada", `Cita ${sample.token} · ${sample.carrier}`);
    if (sample.arrived) {
      await addEvent(
        id,
        "entrada",
        `Pluma abierta · ${sample.dock ?? "sin andén"}`,
        sample.arrived,
      );
    }
    if (sample.started) {
      await addEvent(id, "inicio_operacion", "Inicio de carga/descarga", sample.started);
    }
    if (sample.departed) {
      await addEvent(id, "salida", "Unidad liberada", sample.departed);
    }
  }

  await seedHistory();

  await sql("insert into app_meta (key, value) values ('sample', 'true')");
}

async function addEvent(
  appointmentId: string,
  kind: string,
  detail: string,
  at = new Date(),
) {
  await sql(
    "insert into yard_events (id, appointment_id, kind, at, detail) values ($1,$2,$3,$4,$5)",
    [randomUUID(), appointmentId, kind, at.toISOString(), detail],
  );
}

async function appointmentQuery(where: string, params: unknown[]) {
  return sql<AppointmentRow>(
    `select a.*, d.label as dock_label, d.kind as dock_kind
     from appointments a
     left join docks d on d.id = a.dock_id
     where ${where}`,
    params,
  );
}

function mapDock(row: DockRow, current?: AppointmentSummary | null): Dock {
  return {
    id: row.id,
    label: row.label,
    kind: row.kind,
    bayOrder: row.bay_order,
    status: row.status,
    current: current ?? null,
  };
}

export async function listDocks() {
  await ensureReady();
  return sql<DockRow>("select * from docks order by bay_order");
}

export async function getAppointment(idOrToken: string) {
  await ensureReady();
  const key = idOrToken.trim();
  const rows = await appointmentQuery(
    "a.id = $1 or a.token = $2",
    [key, key.toUpperCase()],
  );
  return rows[0] ? mapAppointment(rows[0]) : null;
}

export async function listAppointments() {
  await ensureReady();
  const rows = await appointmentQuery(
    `a.status not in ('completa','rechazada','cancelada')
     or coalesce(a.departed_at, a.scheduled_at) >= now() - interval '24 hours'`,
    [],
  );
  return rows
    .map(mapAppointment)
    .sort(
      (a, b) =>
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
    );
}

export async function createAppointment(input: CreateAppointmentInput) {
  await ensureReady();
  const plate = normalizePlate(input.plate);
  if (plate.length < 5) {
    throw new Error("La placa no es válida.");
  }
  const existing = await sql<{ n: string }>(
    `select count(*)::text as n from appointments
     where plate = $1 and status in ('programada','en_sitio','en_anden','en_operacion')`,
    [plate],
  );
  if (Number(existing[0]?.n ?? 0) > 0) {
    throw new Error("Esa placa ya tiene una cita abierta.");
  }
  const id = randomUUID();
  const newToken = token();
  await sql(
    `insert into appointments (
      id, token, carrier, plate, trailer_plate, driver_name, driver_license, phone,
      operation, reference_code, cargo, scheduled_at, docs_license, docs_circulation,
      docs_insurance, docs_carta_porte, status
    ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,'programada')`,
    [
      id,
      newToken,
      input.carrier.trim(),
      plate,
      input.trailerPlate ? normalizePlate(input.trailerPlate) : null,
      input.driverName.trim(),
      input.driverLicense.trim(),
      input.phone?.trim() || null,
      input.operation,
      input.referenceCode?.trim() || null,
      input.cargo?.trim() || null,
      new Date(input.scheduledAt).toISOString(),
      Boolean(input.docsLicense),
      Boolean(input.docsCirculation),
      Boolean(input.docsInsurance),
      Boolean(input.docsCartaPorte),
    ],
  );
  await addEvent(id, "creada", "Cita registrada por el transportista");
  const created = await getAppointment(id);
  if (!created) throw new Error("No se pudo crear la cita.");
  return created;
}

function isActive(status: AppointmentSummary["status"]) {
  return ["en_sitio", "en_anden", "en_operacion"].includes(status);
}

function buildAlerts(appointments: AppointmentSummary[]): Alert[] {
  const alerts: Alert[] = [];
  for (const appt of appointments) {
    if (!isActive(appt.status) || !appt.arrivedAt) continue;
    const waitDock = appt.loadStartedAt
      ? minutesBetween(appt.arrivedAt, new Date(appt.loadStartedAt).getTime())
      : minutesBetween(appt.arrivedAt);
    if (appt.status === "en_sitio" && waitDock > SLA_MINUTES.waitForDock) {
      alerts.push({
        id: `${appt.id}-wait-dock`,
        severity: waitDock > 30 ? "critical" : "warning",
        title: `${appt.plate} espera andén`,
        detail: `${waitDock} min en cajón. Objetivo: ${SLA_MINUTES.waitForDock} min.`,
        appointmentId: appt.id,
        plate: appt.plate,
      });
    }
    if (appt.status === "en_anden" && waitDock > SLA_MINUTES.waitToStart) {
      alerts.push({
        id: `${appt.id}-wait-start`,
        severity: "critical",
        title: `${appt.dockLabel ?? "Andén"} sin arranque`,
        detail: `${appt.plate} lleva ${waitDock} min parado. Objetivo: ${SLA_MINUTES.waitToStart} min para iniciar.`,
        appointmentId: appt.id,
        plate: appt.plate,
      });
    }
    if (appt.status === "en_operacion" && appt.loadStartedAt) {
      const opMin = minutesBetween(appt.loadStartedAt);
      const sla =
        appt.operation === "carga" ? SLA_MINUTES.carga : SLA_MINUTES.descarga;
      if (opMin > sla) {
        alerts.push({
          id: `${appt.id}-sla`,
          severity: opMin > sla + 20 ? "critical" : "warning",
          title: `${appt.dockLabel ?? "Andén"} sobre SLA`,
          detail: `${appt.operation} de ${appt.plate}: ${opMin} min / ${sla} min.`,
          appointmentId: appt.id,
          plate: appt.plate,
        });
      }
    }
    const dwell = minutesBetween(appt.arrivedAt);
    if (dwell > SLA_MINUTES.dwell) {
      alerts.push({
        id: `${appt.id}-dwell`,
        severity: "critical",
        title: `Estancia larga · ${appt.plate}`,
        detail: `${dwell} min en patio. Límite: ${SLA_MINUTES.dwell} min.`,
        appointmentId: appt.id,
        plate: appt.plate,
      });
    }
  }
  return alerts.sort((a, b) =>
    a.severity === b.severity ? 0 : a.severity === "critical" ? -1 : 1,
  );
}

export async function getYard(): Promise<YardSnapshot> {
  await ensureReady();
  const [dockRows, appointments, eventRows, meta] = await Promise.all([
    sql<DockRow>("select * from docks order by bay_order"),
    listAppointments(),
    sql<EventRow>(
      "select * from yard_events order by at desc limit 40",
    ),
    sql<{ value: string }>("select value from app_meta where key = 'sample'"),
  ]);
  const active = appointments.filter((a) => isActive(a.status));
  const byDock = new Map(active.filter((a) => a.dockId).map((a) => [a.dockId!, a]));
  const docks = dockRows.map((row) => mapDock(row, byDock.get(row.id) ?? null));
  const andenes = docks.filter((d) => d.kind === "anden" && d.status !== "mantenimiento");
  const cajones = docks.filter((d) => d.kind === "cajon");
  const dwells = active
    .filter((a) => a.arrivedAt)
    .map((a) => minutesBetween(a.arrivedAt!));
  const alerts = buildAlerts(appointments);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const events: YardEvent[] = eventRows.map((row) => ({
    id: row.id,
    appointmentId: row.appointment_id,
    kind: row.kind,
    at: iso(row.at),
    detail: row.detail,
  }));
  return {
    generatedAt: new Date().toISOString(),
    facility: FACILITY,
    kpis: {
      inYard: active.length,
      docksBusy: andenes.filter((d) => d.status === "ocupado").length,
      docksTotal: andenes.length,
      waitingSpotsBusy: cajones.filter((d) => d.status === "ocupado").length,
      waitingSpotsTotal: cajones.length,
      avgDwellMinutes:
        dwells.length === 0
          ? null
          : Math.round(dwells.reduce((sum, n) => sum + n, 0) / dwells.length),
      overdue: alerts.length,
      scheduledToday: appointments.filter(
        (a) => new Date(a.scheduledAt) >= start && a.status === "programada",
      ).length,
    },
    docks,
    appointments,
    events,
    alerts,
    sampleData: meta[0]?.value === "true",
  };
}

function suggestDock(docks: Dock[], prefer: DockKind): Dock | null {
  const match = docks.find(
    (d) => d.kind === prefer && d.status === "libre",
  );
  if (match) return match;
  return docks.find((d) => d.status === "libre") ?? null;
}

export async function lookupGate(query: string): Promise<GateLookup> {
  await ensureReady();
  const raw = query.trim();
  if (!raw) {
    return {
      query: raw,
      appointment: null,
      suggestedDock: null,
      freeAndenes: [],
      freeCajones: [],
      reason: "Escanea el QR o captura la placa.",
    };
  }
  const plate = normalizePlate(raw);
  const tokenMatch = raw.toUpperCase().match(/PT-[A-Z0-9]+/);
  let rows: AppointmentRow[] = [];
  if (tokenMatch) {
    rows = await appointmentQuery("a.token = $1", [tokenMatch[0]]);
  }
  if (rows.length === 0 && plate) {
    rows = await appointmentQuery(
      "a.plate = $1 and a.status not in ('completa','cancelada')",
      [plate],
    );
  }
  const dockRows = await sql<DockRow>("select * from docks order by bay_order");
  const appointments = (await listAppointments()).filter((a) => isActive(a.status));
  const byDock = new Map(appointments.map((a) => [a.dockId, a]));
  const docks = dockRows.map((row) => mapDock(row, byDock.get(row.id) ?? null));
  const freeAndenes = docks.filter(
    (d) => d.kind === "anden" && d.status === "libre",
  );
  const freeCajones = docks.filter(
    (d) => d.kind === "cajon" && d.status === "libre",
  );
  const appointment = rows[0] ? mapAppointment(rows[0]) : null;
  if (!appointment) {
    return {
      query: raw,
      appointment: null,
      suggestedDock: null,
      freeAndenes,
      freeCajones,
      reason: "Sin cita vigente para esa placa o código.",
    };
  }
  const suggestedDock =
    appointment.dockId
      ? docks.find((d) => d.id === appointment.dockId) ?? null
      : suggestDock(docks, "anden");
  return {
    query: raw,
    appointment,
    suggestedDock,
    freeAndenes,
    freeCajones,
    reason: null,
  };
}

async function occupyDock(dockId: string | null, previousId: string | null) {
  if (previousId && previousId !== dockId) {
    await sql("update docks set status = 'libre' where id = $1", [previousId]);
  }
  if (dockId) {
    await sql("update docks set status = 'ocupado' where id = $1", [dockId]);
  }
}

export async function admitAppointment(id: string, dockId?: string) {
  await ensureReady();
  const appointment = await getAppointment(id);
  if (!appointment) throw new Error("No encontramos la cita.");
  if (appointment.status === "completa" || appointment.status === "cancelada") {
    throw new Error("Esa cita ya está cerrada.");
  }
  if (appointment.status === "rechazada") {
    throw new Error("La cita fue rechazada. Hay que registrar otra.");
  }
  if (!appointment.docsComplete) {
    throw new Error("Falta documentación. No se abre pluma.");
  }
  const docks = await listDocks();
  const chosenId = dockId || appointment.dockId || suggestDock(
    docks.map((d) => mapDock(d)),
    "anden",
  )?.id;
  if (!chosenId) throw new Error("No hay andén ni cajón libre.");
  const dock = docks.find((d) => d.id === chosenId);
  if (!dock) throw new Error("Andén inválido.");
  if (dock.status === "mantenimiento") {
    throw new Error(`${dock.label} está en mantenimiento.`);
  }
  if (
    dock.status === "ocupado" &&
    appointment.dockId !== dock.id
  ) {
    throw new Error(`${dock.label} ya está ocupado.`);
  }
  const nextStatus = dock.kind === "anden" ? "en_anden" : "en_sitio";
  const arrivedAt = appointment.arrivedAt ?? new Date().toISOString();
  await occupyDock(dock.id, appointment.dockId);
  await sql(
    "update appointments set status = $1, dock_id = $2, arrived_at = $3, rejected_reason = null where id = $4",
    [nextStatus, dock.id, arrivedAt, appointment.id],
  );
  await addEvent(
    appointment.id,
    "entrada",
    `Pluma abierta · asignado ${dock.label}`,
  );
  return getAppointment(appointment.id);
}

export async function rejectAppointment(id: string, reason: string) {
  await ensureReady();
  const appointment = await getAppointment(id);
  if (!appointment) throw new Error("No encontramos la cita.");
  if (appointment.dockId) {
    await sql("update docks set status = 'libre' where id = $1", [
      appointment.dockId,
    ]);
  }
  await sql(
    "update appointments set status = 'rechazada', dock_id = null, rejected_reason = $1 where id = $2",
    [reason, appointment.id],
  );
  await addEvent(appointment.id, "rechazo", reason);
  return getAppointment(appointment.id);
}

export async function startOperation(id: string, supervisor: string) {
  await ensureReady();
  const name = supervisor.trim().replace(/\s+/g, " ");
  if (name.length < 3) {
    throw new Error("Indica el supervisor que atiende la unidad.");
  }
  if (name.length > 80) {
    throw new Error("El nombre del supervisor es demasiado largo.");
  }
  const appointment = await getAppointment(id);
  if (!appointment) throw new Error("No encontramos la cita.");
  if (!appointment.dockId || appointment.dockKind !== "anden") {
    throw new Error("La unidad tiene que estar en andén para iniciar.");
  }
  await sql(
    "update appointments set status = 'en_operacion', load_started_at = coalesce(load_started_at, now()), supervisor = $2 where id = $1",
    [appointment.id, name],
  );
  await addEvent(
    appointment.id,
    "inicio_operacion",
    `Inicio en ${appointment.dockLabel} · ${name}`,
  );
  return getAppointment(appointment.id);
}

export async function assignDock(id: string, dockId: string) {
  await ensureReady();
  const appointment = await getAppointment(id);
  if (!appointment) throw new Error("No encontramos la cita.");
  if (!isActive(appointment.status) && appointment.status !== "programada") {
    throw new Error("Esa cita no puede moverse de andén.");
  }
  const docks = await listDocks();
  const dock = docks.find((d) => d.id === dockId);
  if (!dock) throw new Error("Andén inválido.");
  if (dock.status === "mantenimiento") throw new Error("Ese andén está en mantenimiento.");
  if (dock.status === "ocupado" && appointment.dockId !== dock.id) {
    throw new Error(`${dock.label} ya está ocupado.`);
  }
  await occupyDock(dock.id, appointment.dockId);
  const nextStatus =
    dock.kind === "anden"
      ? appointment.loadStartedAt
        ? "en_operacion"
        : "en_anden"
      : "en_sitio";
  await sql("update appointments set status = $1, dock_id = $2 where id = $3", [
    nextStatus,
    dock.id,
    appointment.id,
  ]);
  await addEvent(appointment.id, "reasignacion", `Movido a ${dock.label}`);
  return getAppointment(appointment.id);
}

export async function recordDelay(
  id: string,
  category: string,
  notes?: string,
) {
  await ensureReady();
  const allowed = DELAY_CATEGORIES.some((c) => c.id === category);
  if (!allowed) throw new Error("Motivo de incidencia no válido.");
  const appointment = await getAppointment(id);
  if (!appointment) throw new Error("No encontramos la cita.");
  const trimmed = notes?.trim().replace(/\s+/g, " ") ?? "";
  if (trimmed.length > 500) {
    throw new Error("Las notas son demasiado largas.");
  }
  const label = delayCategoryLabel(category) ?? category;
  await sql(
    `update appointments
     set delay_category = $2, delay_notes = $3, delay_recorded_at = now()
     where id = $1`,
    [id, category, trimmed || null],
  );
  await addEvent(
    appointment.id,
    "incidencia",
    trimmed ? `${label}: ${trimmed}` : label,
  );
  return getAppointment(id);
}

export async function completeAndExit(id: string) {
  await ensureReady();
  const appointment = await getAppointment(id);
  if (!appointment) throw new Error("No encontramos la cita.");
  if (appointment.dockId) {
    await sql("update docks set status = 'libre' where id = $1", [
      appointment.dockId,
    ]);
  }
  await sql(
    "update appointments set status = 'completa', departed_at = now() where id = $1",
    [appointment.id],
  );
  await addEvent(appointment.id, "salida", "Pluma de salida · patio liberado");
  return getAppointment(appointment.id);
}
