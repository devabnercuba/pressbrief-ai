import { cn } from "@/lib/utils";
import type { Opportunity } from "@/types";

const map: Record<Opportunity, { label: string; className: string; dot: string }> = {
  high: {
    label: "Alta oportunidade",
    className: "bg-success/10 text-success border-success/20",
    dot: "bg-success",
  },
  medium: {
    label: "Média",
    className: "bg-warning/10 text-warning border-warning/20",
    dot: "bg-warning",
  },
  low: {
    label: "Baixa",
    className: "bg-destructive/10 text-destructive border-destructive/20",
    dot: "bg-destructive",
  },
};

export function ScoreBadge({ opportunity }: { opportunity: Opportunity }) {
  const cfg = map[opportunity];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        cfg.className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
      {cfg.label}
    </span>
  );
}

export function CoverageScore({ score }: { score: number }) {
  const color =
    score >= 85 ? "text-success" : score >= 65 ? "text-warning" : "text-muted-foreground";
  return (
    <div className="flex flex-col items-end">
      <span className={cn("text-2xl font-semibold tabular-nums tracking-tight", color)}>
        {score}
      </span>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
        Coverage Score
      </span>
    </div>
  );
}
