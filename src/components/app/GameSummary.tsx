import { Calendar, Clock, MapPin, Trophy, Cloud, Sun, CloudRain, Moon, Navigation } from "lucide-react";
import type { Game } from "@/types";

const weatherIcon = {
  sun: Sun,
  cloud: Cloud,
  rain: CloudRain,
  night: Moon,
} as const;

export function GameSummary({ game }: { game: Game }) {
  const WIcon = weatherIcon[game.weather.icon];
  return (
    <div>
      <div className="flex items-center justify-between gap-6">
        <TeamBlock name={game.homeTeam} crest={game.homeCrest} label="Mandante" />
        <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">vs</span>
        <TeamBlock name={game.awayTeam} crest={game.awayCrest} label="Visitante" align="right" />
      </div>

      <p className="mt-5 text-sm leading-relaxed text-foreground/85">{game.summary}</p>

      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border/60 pt-5 sm:grid-cols-3 lg:grid-cols-6">
        <Meta icon={Calendar} label="Data" value={formatDate(game.date)} />
        <Meta icon={Clock} label="Horário" value={game.time} />
        <Meta icon={MapPin} label="Estádio" value={game.stadium} />
        <Meta icon={Trophy} label="Competição" value={game.competition} />
        <Meta icon={Navigation} label="Distância" value={`${game.distanceKm} km`} />
        <Meta icon={WIcon} label="Clima" value={`${game.weather.condition} • ${game.weather.tempC}°`} />
      </div>
    </div>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function TeamBlock({ name, crest, label, align = "left" }: { name: string; crest: string; label: string; align?: "left" | "right" }) {
  return (
    <div className={`flex items-center gap-3 ${align === "right" ? "flex-row-reverse text-right" : ""}`}>
      <img src={crest} alt={name} className="h-14 w-14 rounded-xl" />
      <div>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-base font-semibold text-foreground">{name}</p>
      </div>
    </div>
  );
}

function Meta({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
