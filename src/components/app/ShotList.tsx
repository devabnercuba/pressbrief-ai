import { useState } from "react";
import { Camera, Check } from "lucide-react";
import type { ShotItem } from "@/lib/mock-games";
import { cn } from "@/lib/utils";

const priorityConfig: Record<ShotItem["priority"], { label: string; className: string }> = {
  essencial: { label: "Essencial", className: "bg-destructive/10 text-destructive border-destructive/30" },
  recomendada: { label: "Recomendada", className: "bg-warning/10 text-warning border-warning/30" },
  extra: { label: "Extra", className: "bg-muted/40 text-muted-foreground border-border" },
};

export function ShotList({ shots }: { shots: ShotItem[] }) {
  const [done, setDone] = useState<Set<string>>(new Set());
  const toggle = (id: string) => {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  return (
    <ul className="space-y-2">
      {shots.map((s) => {
        const isDone = done.has(s.id);
        const cfg = priorityConfig[s.priority];
        return (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => toggle(s.id)}
              className={cn(
                "group flex w-full items-start gap-3 rounded-lg border border-border bg-background/40 p-3 text-left transition-colors hover:border-border/80",
                isDone && "opacity-60",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded border transition-colors",
                  isDone ? "border-success bg-success text-success-foreground" : "border-border bg-card",
                )}
              >
                {isDone ? <Check className="h-3 w-3" /> : <Camera className="h-3 w-3 text-muted-foreground" />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className={cn("text-sm font-medium text-foreground", isDone && "line-through")}>{s.title}</p>
                  <span className={cn("shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider", cfg.className)}>
                    {cfg.label}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{s.description}</p>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
