import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { PortalForm } from "@/components/portal-form";

export default function NuevaCitaPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10 sm:px-6">
      <div className="space-y-4">
        <Link
          href="/portal"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeftIcon className="size-4" />
          Citas
        </Link>
        <PageHeader
          eyebrow="Nueva cita"
          title="Registrar unidad"
          description="Completa los datos de la unidad, el chofer y la documentación. El pase QR se genera al guardar."
        />
      </div>
      <PortalForm />
    </div>
  );
}
