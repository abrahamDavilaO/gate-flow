import { Suspense } from "react";
import { AnalyticsDashboard } from "@/components/analytics-dashboard";
import { getAnalytics } from "@/lib/analytics";

export default function AnalisisPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <Suspense
        fallback={<p className="text-sm text-muted-foreground">Calculando análisis…</p>}
      >
        <AnalisisLoaded />
      </Suspense>
    </div>
  );
}

async function AnalisisLoaded() {
  const report = await getAnalytics({});
  return <AnalyticsDashboard initial={report} />;
}
