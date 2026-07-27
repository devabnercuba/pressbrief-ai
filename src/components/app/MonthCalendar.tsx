import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { buildMonthGrid, toISO, type DaySummary } from "@/lib/calendar-utils";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

interface Props {
  year: number;
  month: number; // 0..11
  selectedISO: string;
  summaries: Map<string, DaySummary>;
  onSelect: (iso: string) => void;
  onNavigate: (year: number, month: number) => void;
}

function priorityTone(avg: number): string {
  if (avg >= 4) return "bg-success";
  if (avg >= 2.5) return "bg-warning";
  if (avg > 0) return "bg-muted-foreground/50";
  return "bg-transparent";
}

export function MonthCalendar({
  year,
  month,
  selectedISO,
  summaries,
  onSelect,
  onNavigate,
}: Props) {
  const cells = buildMonthGrid(year, month);
  const todayISO = toISO(new Date());

  const prev = () => {
    const d = new Date(year, month - 1, 1);
    onNavigate(d.getFullYear(), d.getMonth());
  };
  const next = () => {
    const d = new Date(year, month + 1, 1);
    onNavigate(d.getFullYear(), d.getMonth());
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Calendário
          </p>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            {MONTHS[month]} {year}
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" onClick={prev} aria-label="Mês anterior">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={next} aria-label="Próximo mês">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
        {WEEKDAYS.map((d) => (
          <div key={d} className="p-1 text-center">{d}</div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((c) => {
          const s = summaries.get(c.dateISO);
          const isSelected = c.dateISO === selectedISO;
          const isToday = c.dateISO === todayISO;
          const hasGames = !!s && s.total > 0;
          return (
            <button
              key={c.dateISO}
              type="button"
              onClick={() => onSelect(c.dateISO)}
              className={cn(
                "group relative aspect-square rounded-md border p-1.5 text-left transition-colors",
                "border-border/50 bg-background/30 hover:border-border",
                !c.inMonth && "opacity-40",
                isSelected && "border-primary bg-primary/10 hover:border-primary",
                isToday && !isSelected && "border-primary/40",
              )}
              aria-label={`${c.day} — ${s?.total ?? 0} jogos`}
            >
              <div className="flex items-start justify-between">
                <span
                  className={cn(
                    "text-xs font-medium tabular-nums",
                    isSelected ? "text-primary" : "text-foreground",
                  )}
                >
                  {c.day}
                </span>
                {hasGames && (
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      priorityTone(s!.avgPriority),
                    )}
                    aria-hidden
                  />
                )}
              </div>
              {hasGames && (
                <div className="absolute inset-x-1 bottom-1 flex items-center justify-between text-[9px] leading-none">
                  <span className="tabular-nums text-muted-foreground">{s!.total}j</span>
                  {s!.recommended > 0 && (
                    <span className="rounded-sm bg-success/15 px-1 py-[1px] tabular-nums text-success">
                      ★{s!.recommended}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
        <LegendDot cls="bg-success" label="Alta prioridade" />
        <LegendDot cls="bg-warning" label="Média" />
        <LegendDot cls="bg-muted-foreground/50" label="Baixa" />
        <span className="ml-auto">★ = recomendados</span>
      </div>
    </div>
  );
}

function LegendDot({ cls, label }: { cls: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={cn("h-1.5 w-1.5 rounded-full", cls)} />
      {label}
    </span>
  );
}
