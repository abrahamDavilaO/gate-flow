"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { CircleHelpIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "cn";
import {
  DEMO_TOURS,
  markTourSeen,
  readTourState,
  tourKeyFromPath,
  type TourKey,
  type TourStep,
} from "@/lib/demo-tour";

type DemoTourContextValue = {
  startTour: (key?: TourKey) => void;
  isActive: boolean;
};

const DemoTourContext = createContext<DemoTourContextValue | null>(null);

export function useDemoTour() {
  const ctx = useContext(DemoTourContext);
  if (!ctx) {
    throw new Error("useDemoTour debe usarse dentro de DemoTourProvider");
  }
  return ctx;
}

type Rect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

function padRect(rect: DOMRect, padding = 6): Rect {
  return {
    top: rect.top - padding,
    left: rect.left - padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
  };
}

function findTarget(target: string | undefined): Element | null {
  if (!target || typeof document === "undefined") return null;
  const candidates = document.querySelectorAll(`[data-tour="${target}"]`);
  for (const el of candidates) {
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) return el;
  }
  return null;
}

function measureTarget(target: string | undefined): Rect | null {
  const el = findTarget(target);
  return el ? padRect(el.getBoundingClientRect()) : null;
}

export function DemoTourProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [activeKey, setActiveKey] = useState<TourKey | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<Rect | null>(null);

  const steps = activeKey ? DEMO_TOURS[activeKey] : [];
  const step: TourStep | undefined = steps[stepIndex];
  const isActive = activeKey != null && step != null;

  const closeTour = useCallback((key: TourKey) => {
    markTourSeen(key);
    setActiveKey(null);
    setStepIndex(0);
    setTargetRect(null);
  }, []);

  const spotlightRect = step?.target ? targetRect : null;

  const startTour = useCallback(
    (key?: TourKey) => {
      const resolved = key ?? tourKeyFromPath(pathname);
      if (!resolved) return;
      setActiveKey(resolved);
      setStepIndex(0);
    },
    [pathname],
  );

  useEffect(() => {
    const key = tourKeyFromPath(pathname);
    if (!key || activeKey) return;
    const state = readTourState();
    if (state.seen.includes(key)) return;
    const timer = window.setTimeout(() => startTour(key), 900);
    return () => window.clearTimeout(timer);
  }, [pathname, activeKey, startTour]);

  useEffect(() => {
    if (!isActive || !step) return;

    const sync = () => setTargetRect(measureTarget(step.target));

    sync();
    findTarget(step.target)?.scrollIntoView({
      block: "center",
      behavior: "smooth",
      inline: "nearest",
    });

    window.addEventListener("resize", sync);
    window.addEventListener("scroll", sync, true);
    const interval = window.setInterval(sync, 400);

    return () => {
      window.removeEventListener("resize", sync);
      window.removeEventListener("scroll", sync, true);
      window.clearInterval(interval);
    };
  }, [isActive, step]);

  useEffect(() => {
    if (!isActive) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isActive]);

  const goNext = () => {
    if (!activeKey) return;
    if (stepIndex >= steps.length - 1) {
      closeTour(activeKey);
      return;
    }
    setStepIndex((i) => i + 1);
  };

  const goBack = () => {
    if (stepIndex > 0) setStepIndex((i) => i - 1);
  };

  const contextValue = useMemo(
    () => ({ startTour, isActive }),
    [startTour, isActive],
  );

  const progress = steps.length > 0 ? `${stepIndex + 1} / ${steps.length}` : "";

  const cardStyle = useMemo((): React.CSSProperties | undefined => {
    if (!spotlightRect) return undefined;
    const targetRect = spotlightRect;
    const cardWidth = Math.min(352, window.innerWidth - 32);
    const left = Math.min(
      Math.max(16, targetRect.left),
      window.innerWidth - cardWidth - 16,
    );
    const spaceBelow = window.innerHeight - (targetRect.top + targetRect.height);
    const belowTop = targetRect.top + targetRect.height + 12;
    const aboveTop = targetRect.top - 12;
    let top =
      spaceBelow >= 180
        ? belowTop
        : Math.max(16, aboveTop - 220);
    if (top + 220 > window.innerHeight - 16) {
      top = Math.max(16, window.innerHeight - 236);
    }
    return { top, left, width: cardWidth, maxWidth: "calc(100vw - 2rem)" };
  }, [spotlightRect]);

  return (
    <DemoTourContext.Provider value={contextValue}>
      {children}
      {isActive && step && activeKey ? (
        <div className="fixed inset-0 z-[200]" role="presentation">
          <button
            type="button"
            className={cn(
              "absolute inset-0",
              !spotlightRect ? "bg-black/70" : "bg-transparent",
            )}
            aria-label="Cerrar visita guiada"
            onClick={() => closeTour(activeKey)}
          />
          {spotlightRect ? (
            <div
              className="pointer-events-none absolute rounded-lg ring-2 ring-primary ring-offset-2 ring-offset-transparent"
              style={{
                top: spotlightRect.top,
                left: spotlightRect.left,
                width: spotlightRect.width,
                height: spotlightRect.height,
                boxShadow: "0 0 0 9999px rgba(0,0,0,0.7)",
              }}
            />
          ) : null}
          <div
            className={cn(
              "pointer-events-auto absolute z-[201] rounded-xl border border-border bg-popover p-4 text-popover-foreground shadow-xl",
              !spotlightRect &&
                "top-1/2 left-1/2 w-[min(100%,22rem)] -translate-x-1/2 -translate-y-1/2",
            )}
            style={spotlightRect ? cardStyle : undefined}
            role="dialog"
            aria-modal="true"
            aria-labelledby="demo-tour-title"
          >
            <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              Visita guiada · {progress}
            </p>
            <h2 id="demo-tour-title" className="mt-1 text-base font-semibold">
              {step.title}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => closeTour(activeKey)}
              >
                Saltar
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={stepIndex === 0}
                  onClick={goBack}
                >
                  Atrás
                </Button>
                <Button type="button" size="sm" onClick={goNext}>
                  {stepIndex >= steps.length - 1 ? "Listo" : "Siguiente"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </DemoTourContext.Provider>
  );
}

export function DemoTourLauncher({ className }: { className?: string }) {
  const { startTour, isActive } = useDemoTour();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn("text-muted-foreground hover:text-foreground", className)}
      disabled={isActive}
      onClick={() => startTour()}
      data-tour="tour-launcher"
    >
      <CircleHelpIcon />
      <span className="hidden sm:inline">Visita guiada</span>
    </Button>
  );
}