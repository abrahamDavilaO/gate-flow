export const FACILITY = {
  name: "Patio",
  site: "CEDIS Norte",
  city: "Tepotzotlán, Edo. Méx.",
  address: "Autopista México–Querétaro km 42.5",
};

export const SLA_MINUTES = {
  waitForDock: 15,
  waitToStart: 20,
  carga: 60,
  descarga: 90,
  dwell: 120,
} as const;

export const TIME_ZONE = "America/Mexico_City";

export const DELAY_CATEGORIES = [
  { id: "carga_pesada", label: "Carga voluminosa o tarimas extra" },
  { id: "falta_personal", label: "Falta de personal en muelle" },
  { id: "equipo", label: "Montacargas o equipo fuera de servicio" },
  { id: "documentacion", label: "Documentación o validación pendiente" },
  { id: "transportista", label: "Retraso del transportista o chofer" },
  { id: "reasignacion", label: "Cambio de andén o reasignación" },
  { id: "producto", label: "Tipo de producto o desestiba lenta" },
  { id: "cola_patio", label: "Congestión en patio o acceso" },
  { id: "otro", label: "Otro motivo" },
] as const;

export const SUPERVISORS = [
  "Carlos Medina",
  "Laura Gutiérrez",
  "Fernando Ríos",
  "Sofía Navarro",
  "Miguel Ángel Torres",
] as const;
