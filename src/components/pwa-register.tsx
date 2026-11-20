"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV === "development") {
      // En dev también se puede probar la instalación en Chrome (localhost).
    }
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      /* ignorar si el SW no está disponible */
    });
  }, []);

  return null;
}