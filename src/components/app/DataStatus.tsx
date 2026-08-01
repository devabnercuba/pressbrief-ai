import { cn } from "@/lib/utils";

export type DataSource = "fresh" | "cache" | "stale";

interface Props {
  source: DataSource;
  updatedAt?: number;
  className?: string;
}

const TONES: Record<DataSource, { dot: string; label: string }> = {
  fresh: { dot: "bg-success", label: "Online" },
  cache: { dot: "bg-warning", label: "Cache" },
  stale: { dot: "bg-destructive", label: "Offline" },
};

export function DataStatus({ source, updatedAt, className }: Props) {
  const tone = TONES[source];
  const time = updatedAt
    ? new Date(updatedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground",
        className,
      )}
    >
      <span className="inline-flex items-center gap-1.5">
        <span className={cn("h-2 w-2 rounded-full", tone.dot)} aria-hidden />
        {tone.label}
      </span>
      <span>Fonte: Football-Data</span>
      {time && <span>Atualizado às {time}</span>}
      {source === "stale" && (
        <span className="text-warning">Exibindo dados armazenados.</span>
      )}
    </div>
  );
}
