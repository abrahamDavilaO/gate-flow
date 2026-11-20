"use client";

import { DownloadIcon, ShareIcon, SmartphoneIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isIosStandaloneCapable() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const ios = /iPad|iPhone|iPod/.test(ua);
  const safari =
    /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
  return ios && safari;
}

function isStandaloneDisplay() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches;
}

export function PwaInstall() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [hidden, setHidden] = useState(false);
  const [installed, setInstalled] = useState(isStandaloneDisplay);
  const [iosHint] = useState(isIosStandaloneCapable);

  useEffect(() => {
    if (installed) return;
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [installed]);

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted") {
      setHidden(true);
    }
    setDeferred(null);
  }

  if (installed || hidden) return null;

  if (deferred) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => void install()}
        data-tour="pwa-install"
      >
        <DownloadIcon className="size-3.5" />
        <span className="hidden sm:inline">Instalar</span>
      </Button>
    );
  }

  if (!iosHint) return null;

  return <PwaIosInstallHint />;
}

function PwaIosInstallHint() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        data-tour="pwa-install"
        onClick={() => setOpen(true)}
      >
        <SmartphoneIcon className="size-3.5" />
        <span className="hidden sm:inline">Instalar</span>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Instalar en el teléfono</DialogTitle>
            <DialogDescription>
              En iPhone/iPad se agrega desde Safari, sin Play Store.
            </DialogDescription>
          </DialogHeader>
          <ol className="list-decimal space-y-2 pl-4 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <ShareIcon className="mt-0.5 size-4 shrink-0 text-foreground" />
              Toca <span className="text-foreground">Compartir</span> en la barra
              inferior de Safari.
            </li>
            <li>
              Elige <span className="text-foreground">Agregar a inicio</span>.
            </li>
            <li>
              Confirma; el ícono de Patio quedará en tu pantalla de inicio.
            </li>
          </ol>
        </DialogContent>
      </Dialog>
    </>
  );
}