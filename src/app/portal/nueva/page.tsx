import Link from "next/link";
import { PortalForm } from "@/components/portal-form";

export default function NuevaCitaPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <Link href="/portal" className="text-sm text-muted-foreground hover:text-foreground">
          ← Citas
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Registrar unidad</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Completa placa, chofer y documentos. El QR se genera al guardar.
        </p>
      </div>
      <PortalForm />
    </div>
  );
}
