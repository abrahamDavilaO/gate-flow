"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export function QrScanner({
  onRead,
  active,
}: {
  onRead: (value: string) => void;
  active: boolean;
}) {
  const hostId = "patio-qr-reader";
  const [error, setError] = useState<string | null>(null);
  const last = useRef("");
  const onReadRef = useRef(onRead);

  useEffect(() => {
    onReadRef.current = onRead;
  }, [onRead]);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    let scanner: { stop: () => Promise<void>; clear: () => void | Promise<void> } | null =
      null;

    async function start() {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled) return;
        const instance = new Html5Qrcode(hostId);
        scanner = instance;
        await instance.start(
          { facingMode: "environment" },
          { fps: 8, qrbox: { width: 220, height: 220 } },
          (decoded) => {
            const value = decoded.trim();
            if (!value || value === last.current) return;
            last.current = value;
            onReadRef.current(value);
          },
          () => undefined,
        );
      } catch {
        if (!cancelled) {
          setError("No se pudo abrir la cámara. Captura el código o la placa a mano.");
        }
      }
    }

    void start();
    return () => {
      cancelled = true;
      if (scanner) {
        void scanner.stop().then(() => scanner?.clear()).catch(() => undefined);
      }
    };
  }, [active]);

  if (!active) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div
        id={hostId}
        className="overflow-hidden rounded-lg bg-black ring-1 ring-foreground/15"
      />
      {error ? (
        <p className="text-sm text-amber-200">{error}</p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Apunta al QR del chofer. La lectura llena el campo sola.
        </p>
      )}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setError(null)}
      >
        Reintentar cámara
      </Button>
    </div>
  );
}
