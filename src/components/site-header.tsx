"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChartColumnIcon,
  LayoutDashboardIcon,
  MenuIcon,
  QrCodeIcon,
  ScanLineIcon,
  WarehouseIcon,
} from "lucide-react";
import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";
import { DemoTourLauncher } from "@/components/demo-tour";
import { PwaInstall } from "@/components/pwa-install";
import { LiveClock } from "@/components/live-clock";
import { FACILITY } from "@/lib/constants";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const links = [
  { href: "/portal", label: "Portal", icon: QrCodeIcon },
  { href: "/caseta", label: "Caseta", icon: ScanLineIcon },
  { href: "/patio", label: "Patio", icon: LayoutDashboardIcon },
  { href: "/analisis", label: "Análisis", icon: ChartColumnIcon },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-8 px-4 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <WarehouseIcon className="size-4" />
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block text-sm font-semibold tracking-tight">
              {FACILITY.name}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {FACILITY.site}
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" data-tour="main-nav">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive(href)
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground lg:inline-flex">
            <span className="size-1.5 rounded-full bg-emerald-400" />
            Demo
          </span>
          <LiveClock className="hidden rounded-md border border-border px-2.5 py-1 text-xs sm:inline-flex" />
          <PwaInstall />
          <DemoTourLauncher />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              data-tour="main-nav"
              className={buttonVariants({
                variant: "outline",
                size: "icon",
                className: "md:hidden",
              })}
            >
              <MenuIcon />
              <span className="sr-only">Menú</span>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle>Módulos</SheetTitle>
              </SheetHeader>
              <nav className="grid gap-1 px-2">
                {links.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium",
                      isActive(href)
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4" />
                    {label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
