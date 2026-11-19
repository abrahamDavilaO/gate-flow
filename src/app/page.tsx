import { Suspense } from "react";
import { HomeHub } from "@/components/home-hub";
import { getYard } from "@/lib/yard";

export default function HomePage() {
  return (
    <Suspense fallback={<p className="px-4 py-10 text-sm text-muted-foreground">Cargando Patio…</p>}>
      <HomeLoaded />
    </Suspense>
  );
}

async function HomeLoaded() {
  const yard = await getYard();
  return <HomeHub initial={yard} />;
}
