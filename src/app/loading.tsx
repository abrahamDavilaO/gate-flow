export default function Loading() {
  return (
    <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-16 text-sm text-muted-foreground sm:px-6">
      <span className="size-4 animate-spin rounded-full border-2 border-border border-t-primary" />
      Cargando…
    </div>
  );
}
