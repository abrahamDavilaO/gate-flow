"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/client";
import type { YardSnapshot } from "@/lib/types";

export function useYard(intervalMs = 4000, initial: YardSnapshot | null = null) {
  const [yard, setYard] = useState<YardSnapshot | null>(initial);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(initial == null);

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

  const waitForFirstPoll = initial != null;

  useEffect(() => {
    const id = window.setInterval(() => void reload(), intervalMs);
    const start = window.setTimeout(
      () => void reload(),
      waitForFirstPoll ? intervalMs : 0,
    );
    return () => {
      window.clearInterval(id);
      window.clearTimeout(start);
    };
  }, [reload, intervalMs, waitForFirstPoll]);

  return { yard, error, loading, reload };
}
