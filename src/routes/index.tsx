import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Sunrise,
  Sparkles,
  TicketCheck,
  FileText,
  ArrowUpRight,
  Radar as RadarIcon,
  Clock,
  Star,
  Check,
  Plus,
  Calendar,
  Trophy,
  Navigation,
  SlidersHorizontal,
} from "lucide-react";
import { Layout } from "@/components/app/Layout";
import { GameCardSkeleton } from "@/components/app/GameCardSkeleton";
import { ApiErrorState } from "@/components/app/ApiErrorState";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  listPendingCredentials,
  getDaySummary,
  getUserProfile,
} from "@/services/gameService";
import { listMatches } from "@/services/footballDataService";
import {
  analyzeCoverageFromGame,
  analyzeEditorialFromGame,
  analyzeAssignment,
  type AssignmentAnalysis,
} from "@/intelligence";
import { useGamesStore } from "@/lib/games-store";
import type { Game } from "@/types";
import type { CoverageAnalysis, EditorialAnalysis } from "@/intelligence/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — PressBrief AI" },
      {
        name: "description",
        content:
          "Lista de partidas priorizadas automaticamente pelo Assignment Engine.",
      },
      { property: "og:title", content: "Dashboard — PressBrief AI" },
      {
        property: "og:description",
        content: "Priorização inteligente de coberturas fotográficas esportivas.",
      },
    ],
  }),
  component: DashboardPage,
});

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

interface RankedGame {
  game: Game;
  coverage: CoverageAnalysis;
  editorial: EditorialAnalysis;
  assignment: AssignmentAnalysis;
}

function DashboardPage() {
  const credentials = listPendingCredentials();
  const summary = getDaySummary();
  const profile = getUserProfile();
  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });

  const matchesQuery = useQuery({
    queryKey: ["fd-matches"],
    queryFn: () => listMatches(),
    staleTime: 60_000,
    retry: 1,
  });

  const games = matchesQuery.data ?? [];

  const ranked: RankedGame[] = useMemo(
    () =>
      games
        .map((g) => {
          const coverage = analyzeCoverageFromGame(g);
          const editorial = analyzeEditorialFromGame(g);
          const assignment = analyzeAssignment(coverage, editorial);
          return { game: g, coverage, editorial, assignment };
        })
        .sort((a, b) => b.assignment.finalScore - a.assignment.finalScore),
    [games],
  );

  // Filters
  const [competition, setCompetition] = useState<string>("all");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [maxDistance, setMaxDistance] = useState<string>("any");
  const [onlyRecommended, setOnlyRecommended] = useState<boolean>(false);

  const competitions = useMemo(
    () => Array.from(new Set(games.map((g) => g.competition).filter(Boolean))).sort(),
    [games],
  );
  const states = useMemo(
    () =>
      Array.from(
        new Set(games.map((g) => g.state).filter((s): s is string => !!s && s !== "—")),
      ).sort(),
    [games],
  );

  const filtered = useMemo(
    () =>
      ranked.filter((r) => {
        if (competition !== "all" && r.game.competition !== competition) return false;
        if (stateFilter !== "all" && r.game.state !== stateFilter) return false;
        if (maxDistance !== "any" && r.game.distanceKm > Number(maxDistance))
          return false;
        if (onlyRecommended && r.assignment.recommendation !== "Recomendado")
          return false;
        return true;
      }),
    [ranked, competition, stateFilter, maxDistance, onlyRecommended],
  );

  const todayISO = new Date().toISOString().slice(0, 10);
  const gamesToday = games.filter((g) => g.date === todayISO).length;

  return (
    <Layout>
      {/* Greeting header */}
      <header className="border-b border-border pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              {today}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {greeting()}, {profile.firstName}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Partidas priorizadas automaticamente pelo Assignment Engine.
            </p>
          </div>
          <Button asChild size="sm">
            <Link to="/meus-jogos">
              <TicketCheck className="mr-1.5 h-4 w-4" /> Meus jogos
            </Link>
          </Button>
        </div>

        {/* Day summary */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryCard
            icon={Sunrise}
            label="Jogos hoje"
            value={matchesQuery.isSuccess ? gamesToday : summary.gamesToday}
          />
          <SummaryCard
            icon={Sparkles}
            label="Partidas disponíveis"
            value={matchesQuery.isSuccess ? games.length : summary.newOpportunities}
            tone="primary"
          />
          <SummaryCard
            icon={TicketCheck}
            label="Credenciamentos pendentes"
            value={summary.pendingCredentials}
            tone="warning"
          />
          <SummaryCard
            icon={FileText}
            label="Pautas mapeadas"
            value={summary.totalPautas}
          />
        </div>
      </header>

      {/* Assignment list */}
      <section className="mt-8">
        <SectionHeader
          title="Partidas priorizadas"
          subtitle="Ordenadas pelo Final Score do Assignment Engine"
          icon={<RadarIcon className="h-4 w-4" />}
        />

        {/* Filters */}
        <div className="mt-4 rounded-xl border border-border bg-card p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filtros
            </div>
            <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              <Select value={competition} onValueChange={setCompetition}>
                <SelectTrigger className="h-9 bg-background/50 text-xs">
                  <SelectValue placeholder="Competição" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as competições</SelectItem>
                  {competitions.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={stateFilter} onValueChange={setStateFilter}>
                <SelectTrigger className="h-9 bg-background/50 text-xs">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os estados</SelectItem>
                  {states.length === 0 && (
                    <SelectItem value="__none" disabled>
                      Sem estados
                    </SelectItem>
                  )}
                  {states.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={maxDistance} onValueChange={setMaxDistance}>
                <SelectTrigger className="h-9 bg-background/50 text-xs">
                  <SelectValue placeholder="Distância" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Qualquer distância</SelectItem>
                  <SelectItem value="50">Até 50 km</SelectItem>
                  <SelectItem value="100">Até 100 km</SelectItem>
                  <SelectItem value="300">Até 300 km</SelectItem>
                  <SelectItem value="500">Até 500 km</SelectItem>
                </SelectContent>
              </Select>

              <label className="flex items-center justify-between gap-2 rounded-md border border-border bg-background/50 px-3 text-xs">
                <span className="text-muted-foreground">Só recomendados</span>
                <Switch
                  checked={onlyRecommended}
                  onCheckedChange={setOnlyRecommended}
                />
              </label>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="mt-4 space-y-3">
          {matchesQuery.isLoading &&
            Array.from({ length: 3 }).map((_, i) => <GameCardSkeleton key={i} />)}
          {matchesQuery.isError && (
            <ApiErrorState onRetry={() => matchesQuery.refetch()} />
          )}
          {matchesQuery.isSuccess && filtered.length === 0 && (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              Nenhuma partida corresponde aos filtros selecionados.
            </div>
          )}
          {matchesQuery.isSuccess &&
            filtered.map((r) => <AssignmentCard key={r.game.id} ranked={r} />)}
        </div>
      </section>

      {/* Pending credentials */}
      <section className="mt-10">
        <SectionHeader
          title="Credenciamentos pendentes"
          subtitle="Confirme antes das datas de corte"
          icon={<TicketCheck className="h-4 w-4" />}
        />
        <div className="mt-4 rounded-xl border border-border bg-card">
          <ul className="divide-y divide-border/60">
            {credentials.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-4 px-5 py-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {c.homeTeam}{" "}
                    <span className="text-muted-foreground">vs</span> {c.awayTeam}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    Prazo: {c.deadline}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
                      c.status === "pendente" &&
                        "border-destructive/30 bg-destructive/10 text-destructive",
                      c.status === "aguardando" &&
                        "border-warning/30 bg-warning/10 text-warning",
                      c.status === "aprovado" &&
                        "border-success/30 bg-success/10 text-success",
                    )}
                  >
                    {c.status}
                  </span>
                  <Button asChild size="sm" variant="ghost">
                    <Link to="/briefing/$id" params={{ id: c.gameId }}>
                      Abrir <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </Layout>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  tone?: "default" | "primary" | "warning";
}) {
  const toneCls =
    tone === "primary"
      ? "text-primary"
      : tone === "warning"
        ? "text-warning"
        : "text-foreground";
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <p
        className={cn(
          "mt-2 text-2xl font-semibold tabular-nums tracking-tight",
          toneCls,
        )}
      >
        {value}
      </p>
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          <span className="text-primary">{icon}</span>
          {title}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

function recommendationTone(rec: AssignmentAnalysis["recommendation"]) {
  if (rec === "Recomendado") return "text-success border-success/30 bg-success/10";
  if (rec === "Opcional") return "text-warning border-warning/30 bg-warning/10";
  return "text-muted-foreground border-border bg-muted/30";
}

function PriorityStars({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${count} de 5 estrelas`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "h-3 w-3",
            i < count ? "fill-warning text-warning" : "text-muted-foreground/40",
          )}
        />
      ))}
    </span>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function AssignmentCard({ ranked }: { ranked: RankedGame }) {
  const { game, coverage, editorial, assignment } = ranked;
  const { addGame, removeGame, hasGame } = useGamesStore();
  const saved = hasGame(game.id);
  return (
    <article className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-border/80">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex -space-x-2">
            <img
              src={game.homeCrest}
              alt=""
              className="h-11 w-11 rounded-lg ring-2 ring-card"
            />
            <img
              src={game.awayCrest}
              alt=""
              className="h-11 w-11 rounded-lg ring-2 ring-card"
            />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-foreground">
              {game.homeTeam} <span className="text-muted-foreground">vs</span>{" "}
              {game.awayTeam}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Trophy className="h-3.5 w-3.5" />
                {game.competition}
              </span>
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(game.date)} · {game.time}
              </span>
              <span className="inline-flex items-center gap-1">
                <Navigation className="h-3.5 w-3.5" />
                {game.distanceKm} km
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <span
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider",
              recommendationTone(assignment.recommendation),
            )}
          >
            {assignment.recommendation}
          </span>
          <PriorityStars count={assignment.priority} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <ScoreStat label="Final Score" value={assignment.finalScore} tone="primary" />
        <ScoreStat label="Coverage" value={coverage.coverageScore} />
        <ScoreStat label="Editorial" value={editorial.editorialScore} />
      </div>

      <p className="mt-3 text-xs text-foreground/80">{assignment.summary}</p>

      <div className="mt-4 flex items-center justify-end gap-2">
        <Button asChild variant="outline" size="sm">
          <Link to="/briefing/$id" params={{ id: game.id }}>
            Ver Briefing
            <ArrowUpRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
        <Button
          size="sm"
          variant={saved ? "secondary" : "default"}
          onClick={() => (saved ? removeGame(game.id) : addGame(game))}
        >
          {saved ? (
            <>
              <Check className="mr-1 h-4 w-4" /> Salvo
            </>
          ) : (
            <>
              <Plus className="mr-1 h-4 w-4" /> Tenho Interesse
            </>
          )}
        </Button>
      </div>
    </article>
  );
}

function ScoreStat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "primary";
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/40 p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-xl font-semibold tabular-nums",
          tone === "primary" ? "text-primary" : "text-foreground",
        )}
      >
        {value}
      </p>
    </div>
  );
}
