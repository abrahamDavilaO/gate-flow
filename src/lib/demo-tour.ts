export const DEMO_TOUR_STORAGE_KEY = "patio-demo-tour-v1";

export type TourStep = {
  id: string;
  /** Valor de `data-tour` en el DOM; sin target = tarjeta centrada */
  target?: string;
  title: string;
  body: string;
};

export type TourKey = "home" | "portal" | "caseta" | "patio" | "analisis";

export const DEMO_TOURS: Record<TourKey, TourStep[]> = {
  home: [
    {
      id: "welcome",
      title: "Bienvenido al demo de Patio",
      body: "Este CEDIS de muestra muestra el ciclo completo: cita con QR, validación en caseta y tablero de patio en tiempo real. Tarda unos 90 segundos recorrerlo.",
    },
    {
      id: "nav",
      target: "main-nav",
      title: "Tres roles, una sola operación",
      body: "Portal (transportista), Caseta (seguridad / pluma), Patio (jefe de andenes) y Análisis (gerencia). En móvil, abre el menú ≡ para cambiar de módulo.",
    },
    {
      id: "hero",
      target: "tour-hero",
      title: "De la cita al andén",
      body: "El transportista se registra antes de llegar. Caseta valida el pase y asigna andén. Patio marca tiempos y detecta estancias largas.",
    },
    {
      id: "kpis",
      target: "tour-kpis",
      title: "Patio en vivo",
      body: "Estos números se actualizan solos. Útiles para ver cuántas unidades hay, andenes ocupados y alertas de cuello de botella.",
    },
    {
      id: "roles",
      target: "tour-roles",
      title: "Elige por dónde empezar",
      body: "Cada tarjeta abre un módulo distinto. Si solo quieres probar el flujo feliz, sigue los pasos de la sección «Prueba el ciclo» abajo.",
    },
    {
      id: "demo",
      target: "tour-demo",
      title: "Ruta recomendada con datos de muestra",
      body: "1) Abre el pase PT-NORTE1 · 2) En caseta pega el token PT-NORTE1 o escanea el QR · 3) En patio inicia operación y libera la unidad.",
    },
  ],
  portal: [
    {
      id: "portal-intro",
      target: "tour-portal-intro",
      title: "Portal del transportista",
      body: "Aquí el chofer o el despachador ve citas activas y su estado. En producción, cada fila abre el pase con QR para caseta.",
    },
    {
      id: "portal-new",
      target: "tour-portal-new",
      title: "Registrar una cita",
      body: "«Nueva cita» pide placa, chofer y documentos. También puedes abrir la cita de muestra Transportes Ortega desde el inicio.",
    },
  ],
  caseta: [
    {
      id: "caseta-search",
      target: "tour-caseta-search",
      title: "Validación de entrada",
      body: "Escribe el token PT-NORTE1, la placa o escanea el QR del pase. Pulsa Validar para ver expediente, documentos y andén sugerido.",
    },
    {
      id: "caseta-lpr",
      target: "tour-caseta-lpr",
      title: "Lectura de placas",
      body: "Las citas programadas aparecen aquí. En el demo puedes tocar una placa para simular que la cámara LPR la leyó al aproximarse.",
    },
    {
      id: "caseta-gate",
      target: "tour-caseta-gate",
      title: "Pluma y admisión",
      body: "Tras validar, confirma documentación y pulsa «Abrir pluma». La unidad pasa a patio y el tablero la muestra al instante.",
    },
  ],
  patio: [
    {
      id: "yard-kpis",
      target: "tour-yard-kpis",
      title: "Indicadores del patio",
      body: "Unidades en sitio, andenes ocupados, estancia promedio y alertas. Las reglas de SLA marcan cuellos de botella en rojo.",
    },
    {
      id: "yard-map",
      target: "tour-yard-map",
      title: "Mapa de andenes",
      body: "Cada celda es un andén o cajón. Puedes asignar manualmente una unidad en espera haciendo clic en un andén libre.",
    },
    {
      id: "yard-table",
      target: "tour-yard-table",
      title: "Acciones por unidad",
      body: "«Iniciar» pide supervisor. Si la unidad pasa de SLA, usa «Incidencia» o documenta al dar «Salida». Eso alimenta Análisis.",
    },
  ],
  analisis: [
    {
      id: "analytics-filters",
      target: "tour-analytics-filters",
      title: "Elige el periodo",
      body: "Analiza los últimos 30 días, un mes o un año específico, y agrupa por día, semana, mes o año. También puedes separar carga y descarga.",
    },
    {
      id: "analytics-kpis",
      target: "tour-analytics-kpis",
      title: "Indicadores clave",
      body: "Tiempo de operación, espera para iniciar, estancia y cumplimiento de SLA, comparados contra el periodo anterior.",
    },
    {
      id: "analytics-chart",
      target: "tour-analytics-chart",
      title: "Tendencia",
      body: "Cambia la métrica de la gráfica. Al agrupar por año o mes, haz clic en una barra para ver su detalle.",
    },
    {
      id: "analytics-docks",
      target: "tour-analytics-docks",
      title: "Andenes y supervisores",
      body: "Revisa motivos de incidencia, la lista de operaciones fuera de SLA y el desempeño por andén y supervisor.",
    },
    {
      id: "analytics-slow",
      target: "tour-analytics-slow",
      title: "Investigar un retraso",
      body: "Aquí ves si el problema fue espera u operación y si alguien documentó la causa en patio.",
    },
  ],
};

export function tourKeyFromPath(pathname: string): TourKey | null {
  if (pathname === "/") return "home";
  if (pathname === "/portal" || pathname === "/portal/nueva") return "portal";
  if (pathname === "/caseta") return "caseta";
  if (pathname === "/patio") return "patio";
  if (pathname === "/analisis") return "analisis";
  return null;
}

type TourState = { seen: TourKey[] };

export function readTourState(): TourState {
  if (typeof window === "undefined") return { seen: [] };
  try {
    const raw = localStorage.getItem(DEMO_TOUR_STORAGE_KEY);
    if (!raw) return { seen: [] };
    const parsed = JSON.parse(raw) as TourState;
    if (!Array.isArray(parsed.seen)) return { seen: [] };
    return parsed;
  } catch {
    return { seen: [] };
  }
}

export function markTourSeen(key: TourKey) {
  const state = readTourState();
  if (state.seen.includes(key)) return;
  state.seen.push(key);
  localStorage.setItem(DEMO_TOUR_STORAGE_KEY, JSON.stringify(state));
}

export function resetTourState() {
  localStorage.removeItem(DEMO_TOUR_STORAGE_KEY);
}