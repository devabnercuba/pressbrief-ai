import { Star } from "lucide-react";
import type { PriorityPlayer } from "@/lib/mock-games";
import { cn } from "@/lib/utils";

const demandColor: Record<PriorityPlayer["demand"], string> = {
  Alta: "text-success border-success/30 bg-success/10",
  Média: "text-warning border-warning/30 bg-warning/10",
  Baixa: "text-muted-foreground border-border bg-muted/40",
};

export function PlayerPriorityCard({ player }: { player: PriorityPlayer }) {
  return (
    <div className="flex gap-4 rounded-lg border border-border bg-card/60 p-4 transition-colors hover:border-border/80">
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-primary/10 text-lg font-bold text-primary">
        {player.number}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="truncate text-sm font-semibold text-foreground">{player.name}</h4>
              <Star className="h-3 w-3 fill-warning text-warning" />
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {player.position} • {player.team}
            </p>
          </div>
          <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium", demandColor[player.demand])}>
            {player.demand}
          </span>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-foreground/80">{player.reason}</p>
        <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
          <span>Valor de mercado: <span className="font-medium text-foreground">{player.marketValue}</span></span>
        </div>
      </div>
    </div>
  );
}
