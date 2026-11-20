import { DELAY_CATEGORIES, SUPERVISORS } from "./constants";
import { operationSlaMinutes } from "./sla";
import { addDays, localDay, splitDay, weekday, zonedDate } from "./dates";
import { sql } from "./db";

const HISTORY_DAYS = 430;
const BATCH_SIZE = 200;

const CARRIERS = [
  "Transportes Ortega",
  "Grupo Traxión",
  "TUM",
  "Transportes Castores",
  "Estafeta",
  "Paquetexpress",
  "FEMSA Logística",
  "Alianza Mexicana de Transporte",
  "Fletes México",
  "Transportes Monroy",
];

const DRIVERS = [
  "Luis Hernández",
  "María Ruiz",
  "Óscar Beltrán",
  "Pedro Aguilar",
  "Ana Méndez",
  "Ricardo Nava",
  "Jorge Salas",
  "Elena Vázquez",
  "Iván Cordero",
  "Raúl Domínguez",
  "Patricia León",
  "Héctor Campos",
];

/** Andenes con ritmos distintos para que el análisis muestre contrastes. */
const DOCK_SPEED: Record<string, number> = {
  A1: 0.92,
  A2: 1,
  A3: 1.24,
  A4: 0.97,
  A5: 1.03,
  A6: 1,
  A7: 1.15,
  A8: 0.86,
  A9: 1.05,
};

const SUPERVISOR_SPEED = [0.9, 1.08, 0.97, 0.88, 1.16];

const MONTH_LOAD = [0.85, 0.9, 1, 1, 1.02, 0.98, 0.95, 1, 1.05, 1.1, 1.22, 1.3];

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const LETTERS = "ABCDEFGHJKLMNPRSTUVWXYZ";

export async function seedHistory() {
  const rand = mulberry32(20261119);
  const pick = <T>(list: readonly T[]) => list[Math.floor(rand() * list.length)];
  const docks = Object.keys(DOCK_SPEED);
  const today = localDay(new Date());
  const rows: unknown[][] = [];
  let serial = 0;

  for (let offset = HISTORY_DAYS; offset >= 1; offset -= 1) {
    const day = addDays(today, -offset);
    const dow = weekday(day);
    const base = dow === 0 ? 1.2 : dow === 6 ? 6 : 11;
    const { month } = splitDay(day);
    const growth = 0.85 + 0.25 * (1 - offset / HISTORY_DAYS);
    const count = Math.round(base * MONTH_LOAD[month - 1] * growth * (0.75 + rand() * 0.5));
    const improvement = 0.94 + 0.14 * (offset / HISTORY_DAYS);

    for (let i = 0; i < count; i += 1) {
      serial += 1;
      const dock = pick(docks);
      const supervisorIndex = Math.floor(rand() * SUPERVISORS.length);
      const operation = rand() < 0.56 ? "descarga" : "carga";
      const arrived = zonedDate(day, 6 + Math.floor(rand() * 14), Math.floor(rand() * 60));
      const scheduled = new Date(arrived.getTime() - (Math.round(rand() * 50) - 20) * 60_000);
      const wait =
        4 +
        Math.round(rand() * 16 * SUPERVISOR_SPEED[supervisorIndex]) +
        (rand() < 0.1 ? Math.round(rand() * 35) : 0);
      const baseOp = operation === "carga" ? 47 : 70;
      const outlier = rand() < 0.08 ? 1.4 + rand() * 0.4 : 1;
      const opMinutes = Math.round(
        baseOp *
          DOCK_SPEED[dock] *
          SUPERVISOR_SPEED[supervisorIndex] *
          improvement *
          (0.78 + rand() * 0.5) *
          outlier,
      );
      const started = new Date(arrived.getTime() + wait * 60_000);
      const departed = new Date(started.getTime() + opMinutes * 60_000);
      const plate =
        LETTERS[Math.floor(rand() * LETTERS.length)] +
        LETTERS[Math.floor(rand() * LETTERS.length)] +
        LETTERS[Math.floor(rand() * LETTERS.length)] +
        String(10 + Math.floor(rand() * 90)) +
        String(10 + Math.floor(rand() * 90));

      const sla = operationSlaMinutes(operation);
      const slow = opMinutes > sla || wait > 20;
      const delayCategory =
        slow && rand() < 0.62
          ? pick(DELAY_CATEGORIES.map((c) => c.id))
          : null;
      const delayNotes =
        delayCategory && rand() < 0.28 ? "Registro histórico de muestra" : null;

      rows.push([
        `hist-${serial}`,
        `PT-H${serial.toString(36).toUpperCase().padStart(5, "0")}`,
        pick(CARRIERS),
        plate,
        pick(DRIVERS),
        `HIS-${100000 + serial}`,
        operation,
        scheduled.toISOString(),
        dock,
        new Date(scheduled.getTime() - 86_400_000).toISOString(),
        arrived.toISOString(),
        started.toISOString(),
        departed.toISOString(),
        SUPERVISORS[supervisorIndex],
        delayCategory,
        delayNotes,
        delayCategory ? departed.toISOString() : null,
      ]);
    }
  }

  for (let start = 0; start < rows.length; start += BATCH_SIZE) {
    const batch = rows.slice(start, start + BATCH_SIZE);
    const params: unknown[] = [];
    const values = batch.map((row) => {
      const at = params.length;
      params.push(...row);
      const p = (n: number) => `$${at + n}`;
      return `(${p(1)},${p(2)},${p(3)},${p(4)},${p(5)},${p(6)},${p(7)},${p(8)},true,true,true,true,'completa',${p(9)},${p(10)},${p(11)},${p(12)},${p(13)},${p(14)},${p(15)},${p(16)},${p(17)})`;
    });
    await sql(
      `insert into appointments (
        id, token, carrier, plate, driver_name, driver_license, operation, scheduled_at,
        docs_license, docs_circulation, docs_insurance, docs_carta_porte, status, dock_id,
        created_at, arrived_at, load_started_at, departed_at, supervisor,
        delay_category, delay_notes, delay_recorded_at
      ) values ${values.join(",")}`,
      params,
    );
  }
}
