import { cn } from "@/lib/utils";

function scoreColor(score: number) {
  return score >= 85 ? "text-success" : score >= 65 ? "text-warning" : "text-muted-foreground";
}

function scoreRing(score: number) {
  return score >= 85 ? "stroke-success" : score >= 65 ? "stroke-warning" : "stroke-muted-foreground";
}

interface Props {
  score: number;
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}

export function CoverageScore({ score, size = "md", label = "Coverage Score", className }: Props) {
  return <ScoreDial score={score} size={size} label={label} className={className} />;
}

export function EditorialScore({ score, size = "md", label = "Editorial Score", className }: Props) {
  return <ScoreDial score={score} size={size} label={label} className={className} />;
}

function ScoreDial({ score, size, label, className }: Required<Pick<Props, "score" | "size" | "label">> & { className?: string }) {
  const dims = size === "lg" ? 72 : size === "sm" ? 40 : 56;
  const stroke = size === "lg" ? 6 : size === "sm" ? 4 : 5;
  const r = (dims - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score));
  const offset = c - (pct / 100) * c;
  const textSize = size === "lg" ? "text-xl" : size === "sm" ? "text-xs" : "text-sm";

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative shrink-0" style={{ width: dims, height: dims }}>
        <svg width={dims} height={dims} className="-rotate-90">
          <circle cx={dims / 2} cy={dims / 2} r={r} strokeWidth={stroke} className="stroke-border/60 fill-none" />
          <circle
            cx={dims / 2}
            cy={dims / 2}
            r={r}
            strokeWidth={stroke}
            strokeDasharray={c}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={cn("fill-none transition-[stroke-dashoffset]", scoreRing(score))}
          />
        </svg>
        <span className={cn("absolute inset-0 flex items-center justify-center font-semibold tabular-nums", textSize, scoreColor(score))}>
          {score}
        </span>
      </div>
      {label && (
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
        </div>
      )}
    </div>
  );
}
