import { Suspense } from "react";
import { AppointmentPass } from "@/components/appointment-pass";
import { getAppointment } from "@/lib/yard";

export default function CitaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<p className="px-4 py-10 text-sm text-muted-foreground">Cargando pase…</p>}>
      <CitaLoaded params={params} />
    </Suspense>
  );
}

async function CitaLoaded({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const appointment = await getAppointment(id);
  return <AppointmentPass id={id} initial={appointment} />;
}
