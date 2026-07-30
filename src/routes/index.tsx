import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  Sparkles,
  ArrowUpRight,
  Star,
  Check,
  Calendar as CalendarIcon,
  Trophy,
  Navigation,
  MapPin,
  Clock,
  SlidersHorizontal,
} from "lucide-react";
import { Layout } from "@/components/app/Layout";
import { GameCardSkeleton } from "@/components/app/GameCardSkeleton";
import { ApiErrorState } from "@/components/app/ApiErrorState";
import { MonthCalendar } from "@/components/app/MonthCalendar";
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
import { getUserProfile } from "@/services/gameService";
import { listMatchesForCalendar } from "@/services/footballDataService";
import {
  analyzeCoverageFromGame,
  analyzeEditorialFromGame,
  analyzeAssignment,
  type AssignmentAnalysis,
} from "@/intelligence";
import { useGamesStore } from "@/lib/games-store";
import { useCredentialsStore } from "@/lib/credentials-store";
import { approvedRequests, pendingRequests } from "@/lib/credentials";
import {
  DEFAULT_FILTERS,
  filterRanked,
  gamesOnDate,
  summarizeByDay,
  toISO,
  type CalendarFilters,
  type RankedGame,
} from "@/lib/calendar-utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Calendário Inteligente — PressBrief AI" },
      {
        name: "description",
        content:
          "Calendário mensal com priorização automática de jogos para fotógrafos esportivos.",
      },
      { property: "og:title", content: "Calendário Inteligente — PressBrief AI" },
      {
        property: "og:description",
        content: "Planeje suas coberturas por mês com scores e recomendações.",
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

function DashboardPage() {
  const profile = getUserProfile();
  // Saudação depende do horário local: calculada apenas no cliente para
  // evitar divergência de hidratação com o SSR.
  const [greet, setGreet] = useState("");
  useEffect(() => setGreet(greeting()), []);
  const today = new Date();
  const todayISO = toISO(today);

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedISO, setSelectedISO] = useState(todayISO);
  const [filters, setFilters] = useState<CalendarFilters>(DEFAULT_FILTERS);

  const matchesQuery = useQuery({
    queryKey: ["fd-calendar", year, month],
    queryFn: () => listMatchesForCalendar(new Date(year, month, 1)),
    staleTime: 60_000,
    retry: 1,
  });

  const games = matchesQuery.data ?? [];

  const ranked: RankedGame[] = useMemo(
    () =>
      games.map((g) => {
        const coverage = analyzeCoverageFromGame(g);
        const editorial = analyzeEditorialFromGame(g);
        const assignment = analyzeAssignment(coverage, editorial);
        return {
          game: g,
          assignment,
          coverageScore: coverage.coverageScore,
          editorialScore: editorial.editorialScore,
        };
      }),
    [games],
  );

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

  const filtered = useMemo(() => filterRanked(ranked, filters), [ranked, filters]);
  const summaries = useMemo(() => summarizeByDay(filtered), [filtered]);
  const dayGames = useMemo(() => gamesOnDate(filtered, selectedISO), [filtered, selectedISO]);

  const { savedGames } = useGamesStore();

  return (
    <Layout>
      <header className="border-b border-border pb-6">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          {today.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {greet ? `${greet}, ` : ""}{profile.firstName}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Calendário inteligente de coberturas — clique em um dia para ver as partidas.
        </p>
      </header>

      <DashboardKPIs monthGames={ranked.length} />


      <div className="mt-6 grid gap-6 lg:grid-cols-[380px_1fr]">
        <div className="space-y-4">
          <MonthCalendar
            year={year}
            month={month}
            selectedISO={selectedISO}
            summaries={summaries}
            onSelect={setSelectedISO}
            onNavigate={(y, m) => {
              setYear(y);
              setMonth(m);
            }}
          />

          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filtros
            </div>
            <div className="mt-3 space-y-2">
              <Select
                value={filters.competition}
                onValueChange={(v) => setFilters((f) => ({ ...f, competition: v }))}
              >
                <SelectTrigger className="h-9 bg-background/50 text-xs">
                  <SelectValue placeholder="Competição" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as competições</SelectItem>
                  {competitions.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.state}
                onValueChange={(v) => setFilters((f) => ({ ...f, state: v }))}
              >
                <SelectTrigger className="h-9 bg-background/50 text-xs">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os estados</SelectItem>
                  {states.length === 0 && (
                    <SelectItem value="__none" disabled>Sem estados</SelectItem>
                  )}
                  {states.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.maxDistanceKm == null ? "any" : String(filters.maxDistanceKm)}
                onValueChange={(v) =>
                  setFilters((f) => ({ ...f, maxDistanceKm: v === "any" ? null : Number(v) }))
                }
              >
                <SelectTrigger className="h-9 bg-background/50 text-xs">
                  <SelectValue placeholder="Distância máxima" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Qualquer distância</SelectItem>
                  <SelectItem value="50">Até 50 km</SelectItem>
                  <SelectItem value="100">Até 100 km</SelectItem>
                  <SelectItem value="300">Até 300 km</SelectItem>
                  <SelectItem value="500">Até 500 km</SelectItem>
                </SelectContent>
              </Select>

              <label className="flex items-center justify-between gap-2 rounded-md border border-border bg-background/50 px-3 py-2 text-xs">
                <span className="text-muted-foreground">Só recomendados</span>
                <Switch
                  checked={filters.onlyRecommended}
                  onCheckedChange={(v) => setFilters((f) => ({ ...f, onlyRecommended: v }))}
                />
              </label>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <section>
            <div className="flex items-end justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                  <CalendarIcon className="h-4 w-4 text-primary" /> Jogos do dia
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatSelected(selectedISO)} · {dayGames.length} partida(s)
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {matchesQuery.isLoading &&
                Array.from({ length: 3 }).map((_, i) => <GameCardSkeleton key={i} />)}
              {matchesQuery.isError && <ApiErrorState onRetry={() => matchesQuery.refetch()} />}
              {matchesQuery.isSuccess && dayGames.length === 0 && (
                <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
                  Nenhuma partida neste dia com os filtros atuais.
                </div>
              )}
              {matchesQuery.isSuccess &&
                dayGames.map((r) => <CalendarGameCard key={r.game.id} ranked={r} />)}
            </div>
          </section>

          <section>
            <div className="flex items-end justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                  <Sparkles className="h-4 w-4 text-primary" /> Meus jogos
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {savedGames.length} jogo(s) marcado(s) como interesse.
                </p>
              </div>
              <Button asChild size="sm" variant="ghost">
                <Link to="/meus-jogos">
                  Ver todos <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
            <div className="mt-3 rounded-xl border border-border bg-card">
              {savedGames.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  Clique em "Tenho Interesse" em qualquer partida para adicioná-la aqui.
                </div>
              ) : (
                <ul className="divide-y divide-border/60">
                  {savedGames.slice(0, 5).map((g) => (
                    <li key={g.id} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div className="min-w-0 text-sm">
                        <p className="truncate font-medium text-foreground">
                          {g.homeTeam} <span className="text-muted-foreground">vs</span> {g.awayTeam}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatShort(g.date)} · {g.time} · {g.competition}
                        </p>
                      </div>
                      <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary">
                        Interesse
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}

function formatSelected(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
}

function formatShort(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
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
          className={cn("h-3 w-3", i < count ? "fill-warning text-warning" : "text-muted-foreground/40")}
        />
      ))}
    </span>
  );
}

function CalendarGameCard({ ranked }: { ranked: RankedGame }) {
  const { game, assignment, coverageScore, editorialScore } = ranked;
  const { addGame, removeGame, hasGame } = useGamesStore();
  const saved = hasGame(game.id);
  return (
    <article className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-border/80">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex -space-x-2">
            <img src={game.homeCrest} alt="" className="h-11 w-11 rounded-lg ring-2 ring-card" />
            <img src={game.awayCrest} alt="" className="h-11 w-11 rounded-lg ring-2 ring-card" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-foreground">
              {game.homeTeam} <span className="text-muted-foreground">vs</span> {game.awayTeam}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Trophy className="h-3.5 w-3.5" />{game.competition}</span>
              <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{game.stadium} · {game.city}</span>
              <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{game.time}</span>
              {game.distanceKm > 0 && (
                <span className="inline-flex items-center gap-1"><Navigation className="h-3.5 w-3.5" />{game.distanceKm} km</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className={cn("rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider", recommendationTone(assignment.recommendation))}>
            {assignment.recommendation}
          </span>
          <PriorityStars count={assignment.priority} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <ScoreStat label="Final Score" value={assignment.finalScore} tone="primary" />
        <ScoreStat label="Coverage" value={coverageScore} />
        <ScoreStat label="Editorial" value={editorialScore} />
      </div>

      <p className="mt-3 text-xs text-foreground/80">{assignment.summary}</p>

      <div className="mt-4 flex items-center justify-end gap-2">
        <Button asChild variant="outline" size="sm">
          <Link to="/briefing/$id" params={{ id: game.id }}>
            Ver Briefing <ArrowUpRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
        <Button
          size="sm"
          variant={saved ? "secondary" : "default"}
          onClick={() => (saved ? removeGame(game.id) : addGame(game))}
        >
          {saved ? (<><Check className="mr-1 h-4 w-4" /> Salvo</>) : (<><Star className="mr-1 h-4 w-4" /> Tenho Interesse</>)}
        </Button>
      </div>
    </article>
  );
}

function ScoreStat({ label, value, tone = "default" }: { label: string; value: number; tone?: "default" | "primary" }) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/40 p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-xl font-semibold tabular-nums", tone === "primary" ? "text-primary" : "text-foreground")}>
        {value}
      </p>
    </div>
  );
}

function DashboardKPIs({ monthGames }: { monthGames: number }) {
  const { savedGames } = useGamesStore();
  const { requests } = useCredentialsStore();
  const pending = pendingRequests(requests).length;
  const approved = approvedRequests(requests).length;
  const items = [
    { label: "Jogos do mês", value: monthGames },
    { label: "Jogos de interesse", value: savedGames.length },
    { label: "Credenciamentos pendentes", value: pending },
    { label: "Jogos aprovados", value: approved },
  ];
  return (
    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((it) => (
        <div key={it.label} className="rounded-xl border border-border bg-card p-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{it.label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{it.value}</p>
        </div>
      ))}
    </div>
  );
}
