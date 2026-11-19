import { Suspense } from "react";
import { YardBoard } from "@/components/yard-board";
import { getYard } from "@/lib/yard";

export default function PatioPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Suspense fallback={<p className="text-sm text-muted-foreground">Sincronizando patio…</p>}>
        <PatioLoaded />
      </Suspense>
    </div>
  );
}

async function PatioLoaded() {
  const yard = await getYard();
  return <YardBoard initial={yard} />;
}
