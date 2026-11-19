"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/client";
import type { YardSnapshot } from "@/lib/types";

export function useYard(intervalMs = 4000) {
  const [yard, setYard] = useState<YardSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const data = await api<YardSnapshot>("/api/yard");
      setYard(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sin conexión al patio.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => void reload(), intervalMs);
    const start = window.setTimeout(() => void reload(), 0);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(start);
    };
  }, [reload, intervalMs]);

  return { yard, error, loading, reload };
}
