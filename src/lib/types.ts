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
  supervisor: string | null;
  delayCategory: string | null;
  delayNotes: string | null;
  delayRecordedAt: string | null;
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

export type AnalyticsGroup = "day" | "week" | "month" | "year";
export type AnalyticsOperation = "all" | Operation;

export type AnalyticsMetrics = {
  operations: number;
  avgOperation: number | null;
  avgWait: number | null;
  avgDwell: number | null;
  slaPct: number | null;
};

export type AnalyticsBucket = AnalyticsMetrics & {
  key: string;
  label: string;
};

export type AnalyticsReport = {
  range: { key: string; label: string; startDay: string; endDay: string };
  group: AnalyticsGroup;
  operation: AnalyticsOperation;
  options: {
    years: string[];
    months: { key: string; label: string }[];
  };
  summary: AnalyticsMetrics;
  previous: AnalyticsMetrics | null;
  series: AnalyticsBucket[];
  byDock: (AnalyticsMetrics & {
    id: string;
    label: string;
    avgCarga: number | null;
    avgDescarga: number | null;
  })[];
  bySupervisor: (AnalyticsMetrics & { name: string })[];
  byCarrier: (AnalyticsMetrics & { name: string })[];
  slowOperations: AnalyticsSlowOperation[];
  delayBreakdown: { category: string; label: string; count: number }[];
};

export type AnalyticsSlowOperation = {
  id: string;
  plate: string;
  day: string;
  dockLabel: string;
  supervisor: string;
  carrier: string;
  operation: Operation;
  waitMin: number;
  opMin: number;
  dwellMin: number;
  slaTarget: number;
  breach: "wait" | "operation" | "both";
  delayCategory: string | null;
  delayNotes: string | null;
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
