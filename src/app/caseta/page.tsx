import { Suspense } from "react";
import { CasetaKiosk } from "@/components/caseta-kiosk";
import { getYard } from "@/lib/yard";

export default function CasetaPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <Suspense fallback={<p className="text-sm text-muted-foreground">Cargando caseta…</p>}>
        <CasetaLoaded />
      </Suspense>
    </div>
  );
}

async function CasetaLoaded() {
  const yard = await getYard();
  return <CasetaKiosk initial={yard} />;
}
