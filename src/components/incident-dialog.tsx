"use client";

import { useState } from "react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DELAY_CATEGORIES } from "@/lib/constants";
import { breachLabel, type SlaBreach } from "@/lib/sla";

export function IncidentDialog({
  open,
  plate,
  dockLabel,
  breaches,
  requireForExit,
  existingCategory,
  existingNotes,
  busy,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  plate: string;
  dockLabel: string | null;
  breaches: SlaBreach[];
  requireForExit: boolean;
  existingCategory: string | null;
  existingNotes: string | null;
  busy: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (category: string, notes: string) => void;
}) {
  const [category, setCategory] = useState(existingCategory ?? "");
  const [notes, setNotes] = useState(existingNotes ?? "");
  const valid = category.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-5 p-5 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {requireForExit ? "Registrar incidencia antes de salida" : "Registrar incidencia"}
          </DialogTitle>
          <DialogDescription>
            {plate}
            {dockLabel ? ` · ${dockLabel}` : ""}. Documenta por qué la unidad superó el SLA.
            {breaches.length > 0 ? (
              <span className="mt-2 flex flex-wrap gap-1">
                {breaches.map((b) => (
                  <span
                    key={b}
                    className="rounded-md bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-300"
                  >
                    Fuera de SLA: {breachLabel(b)}
                  </span>
                ))}
              </span>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        <form
          id="incident-form"
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (valid) onConfirm(category, notes.trim());
          }}
        >
          <fieldset className="grid gap-2">
            <legend className="text-xs font-medium text-muted-foreground">
              Motivo principal
            </legend>
            <div className="grid gap-1.5">
              {DELAY_CATEGORIES.map((item) => {
                const selected = category === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCategory(item.id)}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                      selected
                        ? "border-primary/60 bg-primary/10"
                        : "border-border bg-background hover:bg-muted/40",
                    )}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
          <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
            Detalle (opcional)
            <textarea
              className="min-h-20 resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
              placeholder="Ej. Se reforzó personal en andén 3; montacargas 2 en mantenimiento."
              maxLength={500}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
        </form>

        <DialogFooter className="-mx-5 -mb-5 px-5">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" form="incident-form" disabled={!valid || busy}>
            {busy
              ? "Guardando…"
              : requireForExit
                ? "Guardar y dar salida"
                : "Guardar incidencia"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}