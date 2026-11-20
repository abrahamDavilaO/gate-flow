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
import { Input } from "@/components/ui/input";
import { SUPERVISORS } from "@/lib/constants";

const OTHER = "__other";

export function SupervisorDialog({
  open,
  plate,
  dockLabel,
  defaultName,
  busy,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  plate: string;
  dockLabel: string | null;
  defaultName: string | null;
  busy: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (name: string) => void;
}) {
  const known = (SUPERVISORS as readonly string[]).includes(defaultName ?? "");
  const [choice, setChoice] = useState<string>(
    defaultName ? (known ? defaultName : OTHER) : "",
  );
  const [other, setOther] = useState(defaultName && !known ? defaultName : "");

  const name = (choice === OTHER ? other : choice).trim();
  const valid = name.length >= 3;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-5 p-5 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Iniciar operación</DialogTitle>
          <DialogDescription>
            {plate}
            {dockLabel ? ` · ${dockLabel}` : ""}. Indica el supervisor responsable de
            la carga o descarga.
          </DialogDescription>
        </DialogHeader>

        <form
          id="supervisor-form"
          className="grid gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (valid) onConfirm(name);
          }}
        >
          <div role="radiogroup" aria-label="Supervisor" className="grid gap-2">
            {[...SUPERVISORS, OTHER].map((option) => {
              const selected = choice === option;
              return (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setChoice(option)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border px-3.5 py-2.5 text-left text-sm transition-colors",
                    selected
                      ? "border-primary/60 bg-primary/10"
                      : "border-border bg-background hover:bg-muted/40",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-4 shrink-0 place-items-center rounded-full border",
                      selected ? "border-primary" : "border-input",
                    )}
                  >
                    {selected ? <span className="size-2 rounded-full bg-primary" /> : null}
                  </span>
                  {option === OTHER ? "Otro supervisor…" : option}
                </button>
              );
            })}
          </div>
          {choice === OTHER ? (
            <Input
              autoFocus
              className="mt-1 h-10 bg-background"
              placeholder="Nombre y apellido"
              maxLength={80}
              value={other}
              onChange={(e) => setOther(e.target.value)}
            />
          ) : null}
        </form>

        <DialogFooter className="-mx-5 -mb-5 px-5">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" form="supervisor-form" disabled={!valid || busy}>
            {busy ? "Iniciando…" : "Iniciar operación"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
