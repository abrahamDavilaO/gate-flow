import { Suspense } from "react";
import { PortalHome } from "@/components/portal-home";
import { getYard } from "@/lib/yard";

export default function PortalPage() {
  return (
    <Suspense fallback={<p className="px-4 py-10 text-sm text-muted-foreground">Cargando citas…</p>}>
      <PortalLoaded />
    </Suspense>
  );
}

async function PortalLoaded() {
  const yard = await getYard();
  return <PortalHome initial={yard} />;
}
