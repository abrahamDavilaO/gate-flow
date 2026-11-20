"use client";

import { DemoTourProvider } from "@/components/demo-tour";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider delay={200}>
      <DemoTourProvider>
        {children}
        <Toaster theme="dark" position="top-right" />
      </DemoTourProvider>
    </TooltipProvider>
  );
}
