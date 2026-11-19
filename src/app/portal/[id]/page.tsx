import { Suspense } from "react";
import { AppointmentPass } from "@/components/appointment-pass";

export default async function CitaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<p className="px-4 py-10 text-sm text-muted-foreground">Cargando pase…</p>}>
      <AppointmentPass id={id} />
    </Suspense>
  );
}
