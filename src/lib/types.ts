export type DockKind = "anden" | "cajon";
export type DockStatus = "libre" | "ocupado" | "mantenimiento";
export type Operation = "carga" | "descarga";
export type AppointmentStatus =
  | "programada"
  | "en_sitio"
  | "en_anden"
  | "en_operacion"
  | "completa"
  | "cancelada"
  | "rechazada";

export type Dock = {
  id: string;
  label: string;
  kind: DockKind;
  bayOrder: number;
  status: DockStatus;
  current?: AppointmentSummary | null;
};

export type AppointmentSummary = {
  id: string;
  token: string;
  carrier: string;
  plate: string;
  trailerPlate: string | null;
  driverName: string;
  driverLicense: string;
  phone: string | null;
  operation: Operation;
  referenceCode: string | null;
  cargo: string | null;
  scheduledAt: string;
  docs: {
    license: boolean;
    circulation: boolean;
    insurance: boolean;
    cartaPorte: boolean;
  };
  docsComplete: boolean;
  status: AppointmentStatus;
  dockId: string | null;
  dockLabel: string | null;
  dockKind: DockKind | null;
  createdAt: string;
  arrivedAt: string | null;
  loadStartedAt: string | null;
  departedAt: string | null;
  rejectedReason: string | null;
};

export type YardEvent = {
  id: string;
  appointmentId: string;
  kind: string;
  at: string;
  detail: string | null;
};

export type Alert = {
  id: string;
  severity: "warning" | "critical";
  title: string;
  detail: string;
  appointmentId: string;
  plate: string;
};

export type YardSnapshot = {
  generatedAt: string;
  facility: {
    name: string;
    site: string;
    city: string;
  };
  kpis: {
    inYard: number;
    docksBusy: number;
    docksTotal: number;
    waitingSpotsBusy: number;
    waitingSpotsTotal: number;
    avgDwellMinutes: number | null;
    overdue: number;
    scheduledToday: number;
  };
  docks: Dock[];
  appointments: AppointmentSummary[];
  events: YardEvent[];
  alerts: Alert[];
  sampleData: boolean;
};

export type GateLookup = {
  query: string;
  appointment: AppointmentSummary | null;
  suggestedDock: Dock | null;
  freeAndenes: Dock[];
  freeCajones: Dock[];
  reason: string | null;
};

export type CreateAppointmentInput = {
  carrier: string;
  plate: string;
  trailerPlate?: string;
  driverName: string;
  driverLicense: string;
  phone?: string;
  operation: Operation;
  referenceCode?: string;
  cargo?: string;
  scheduledAt: string;
  docsLicense: boolean;
  docsCirculation: boolean;
  docsInsurance: boolean;
  docsCartaPorte: boolean;
};
