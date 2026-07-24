import { Link } from "@tanstack/react-router";
import { Calendar, Clock, MapPin, Trophy, Check, Plus, ArrowUpRight, Navigation, Cloud, Sun, CloudRain, Moon, FileText, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScoreBadge } from "./ScoreBadge";
import { CoverageScore } from "./CoverageScore";
import { EditorialScore } from "./EditorialScore";
import { useGamesStore } from "@/lib/games-store";
import type { Game } from "@/types";


const weatherIcon = { sun: Sun, cloud: Cloud, rain: CloudRain, night: Moon } as const;

function formatDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function GameCard({ game }: { game: Game }) {
  const { addGame, removeGame, hasGame } = useGamesStore();
  const saved = hasGame(game.id);
  const WIcon = weatherIcon[game.weather.icon];

  return (
    <article className="group relative rounded-xl border border-border bg-card p-6 transition-colors hover:border-border/80">
      <div className="flex items-start justify-between gap-6">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex -space-x-2">
            <img src={game.homeCrest} alt={game.homeTeam} className="h-12 w-12 rounded-lg ring-2 ring-card" />
            <img src={game.awayCrest} alt={game.awayTeam} className="h-12 w-12 rounded-lg ring-2 ring-card" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-foreground">
              {game.homeTeam} <span className="text-muted-foreground">vs</span> {game.awayTeam}
            </h3>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Trophy className="h-3.5 w-3.5" />
              {game.competition}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <CoverageScore score={game.coverageScore} size="sm" label="Coverage" />
          <EditorialScore score={game.editorialScore} size="sm" label="Editorial" />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
        <MetaItem icon={Calendar} label={formatDate(game.date)} />
        <MetaItem icon={Clock} label={game.time} />
        <MetaItem icon={MapPin} label={`${game.stadium}, ${game.city}`} />
        <MetaItem icon={Navigation} label={`${game.distanceKm} km`} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Metric icon={WIcon} label="Clima" value={`${game.weather.tempC}°`} sub={game.weather.condition} />
        <Metric icon={FileText} label="Pautas" value={String(game.pautasCount)} sub="encontradas" />
        <Metric icon={Star} label="Jogadores" value={String(game.priorityPlayersCount)} sub="prioritários" />
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <ScoreBadge opportunity={game.opportunity} />
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/briefing/$id" params={{ id: game.id }}>
              Ver Briefing
              <ArrowUpRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
          <Button size="sm" variant={saved ? "secondary" : "default"} onClick={() => (saved ? removeGame(game.id) : addGame(game))}>
            {saved ? (<><Check className="mr-1 h-4 w-4" /> Salvo</>) : (<><Plus className="mr-1 h-4 w-4" /> Tenho Interesse</>)}
          </Button>
        </div>
      </div>
    </article>
  );
}

function MetaItem({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate text-foreground/90">{label}</span>
    </div>
  );
}

function Metric({ icon: Icon, label, value, sub }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; sub: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/40 p-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">{value}</p>
      <p className="text-[11px] text-muted-foreground">{sub}</p>
    </div>
  );
}
