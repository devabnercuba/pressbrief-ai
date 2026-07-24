import { cn } from "@/lib/utils";
import type { EditorialAnalysis } from "@/types";

interface Props {
  score: number;
  level?: EditorialAnalysis["level"];
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}

function levelFromScore(score: number): EditorialAnalysis["level"] {
  if (score >= 85) return "Alta";
  if (score >= 65) return "Média";
  return "Baixa";
}

function tone(level: EditorialAnalysis["level"]) {
  return level === "Alta"
    ? { text: "text-success", ring: "stroke-success", bg: "bg-success/10", border: "border-success/30" }
    : level === "Média"
      ? { text: "text-warning", ring: "stroke-warning", bg: "bg-warning/10", border: "border-warning/30" }
      : { text: "text-muted-foreground", ring: "stroke-muted-foreground", bg: "bg-muted/40", border: "border-border" };
}

export function EditorialScore({ score, level, size = "md", label = "Editorial Score", className }: Props) {
  const lvl = level ?? levelFromScore(score);
  const t = tone(lvl);
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
            className={cn("fill-none transition-[stroke-dashoffset]", t.ring)}
          />
        </svg>
        <span className={cn("absolute inset-0 flex items-center justify-center font-semibold tabular-nums", textSize, t.text)}>
          {score}
        </span>
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <span className={cn("mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium", t.bg, t.border, t.text)}>
          {lvl}
        </span>
      </div>
    </div>
  );
}
