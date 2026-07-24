import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Sunrise, Sparkles, TicketCheck, FileText, ArrowUpRight, Radar as RadarIcon, Clock } from "lucide-react";
import { Layout } from "@/components/app/Layout";
import { FilterBar } from "@/components/app/FilterBar";
import { GameCard } from "@/components/app/GameCard";
import { GameCardSkeleton } from "@/components/app/GameCardSkeleton";
import { ApiErrorState } from "@/components/app/ApiErrorState";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { listPendingCredentials, getDaySummary, getUserProfile } from "@/services/gameService";
import { listMatches } from "@/services/footballDataService";
import { analyzeCoverageFromGame, analyzeEditorialFromGame } from "@/intelligence";
import type { Game } from "@/types";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — PressBrief AI" },
      { name: "description", content: "Seu resumo do dia, jogos recomendados e credenciamentos pendentes." },
      { property: "og:title", content: "Dashboard — PressBrief AI" },
      { property: "og:description", content: "Seu centro de comando para cobertura fotográfica esportiva." },
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
  const credentials = listPendingCredentials();
  const summary = getDaySummary();
  const profile = getUserProfile();
  const today = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });

  const matchesQuery = useQuery({
    queryKey: ["fd-matches"],
    queryFn: () => listMatches(),
    staleTime: 60_000,
    retry: 1,
  });

  const games = matchesQuery.data ?? [];
  const recommended = games.slice(0, 3);
  const todayISO = new Date().toISOString().slice(0, 10);
  const gamesToday = games.filter((g) => g.date === todayISO).length;

  return (
    <Layout>
      {/* Greeting header */}
      <header className="border-b border-border pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{today}</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {greeting()}, {profile.firstName}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Aqui está o resumo do seu dia. Foque no que importa.
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
          <SummaryCard icon={Sunrise} label="Jogos hoje" value={matchesQuery.isSuccess ? gamesToday : summary.gamesToday} />
          <SummaryCard icon={Sparkles} label="Partidas disponíveis" value={matchesQuery.isSuccess ? games.length : summary.newOpportunities} tone="primary" />
          <SummaryCard icon={TicketCheck} label="Credenciamentos pendentes" value={summary.pendingCredentials} tone="warning" />
          <SummaryCard icon={FileText} label="Pautas mapeadas" value={summary.totalPautas} />
        </div>
      </header>

      {/* Recommended games */}
      <section className="mt-8">
        <SectionHeader
          title="Jogos recomendados"
          subtitle="Próximas partidas retornadas pela API"
          icon={<Sparkles className="h-4 w-4" />}
        />
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {matchesQuery.isLoading &&
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-xl border border-border bg-card" />
            ))}
          {matchesQuery.isError && (
            <div className="lg:col-span-3">
              <ApiErrorState onRetry={() => matchesQuery.refetch()} />
            </div>
          )}
          {matchesQuery.isSuccess && recommended.length === 0 && (
            <p className="text-sm text-muted-foreground lg:col-span-3">
              Nenhuma partida disponível no momento.
            </p>
          )}
          {matchesQuery.isSuccess && recommended.map((g) => <RecommendedCard key={g.id} game={g} />)}
        </div>
      </section>

      {/* Pending credentials */}
      <section className="mt-8">
        <SectionHeader
          title="Credenciamentos pendentes"
          subtitle="Confirme antes das datas de corte"
          icon={<TicketCheck className="h-4 w-4" />}
        />
        <div className="mt-4 rounded-xl border border-border bg-card">
          <ul className="divide-y divide-border/60">
            {credentials.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {c.homeTeam} <span className="text-muted-foreground">vs</span> {c.awayTeam}
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
                      c.status === "pendente" && "border-destructive/30 bg-destructive/10 text-destructive",
                      c.status === "aguardando" && "border-warning/30 bg-warning/10 text-warning",
                      c.status === "aprovado" && "border-success/30 bg-success/10 text-success",
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

      {/* Radar */}
      <section className="mt-10">
        <SectionHeader
          title="Radar de oportunidades"
          subtitle="Partidas ao vivo da API Football-Data.org"
          icon={<RadarIcon className="h-4 w-4" />}
        />
        <div className="mt-4">
          <FilterBar />
        </div>
        <div className="mt-4 space-y-4">
          {matchesQuery.isLoading &&
            Array.from({ length: 3 }).map((_, i) => <GameCardSkeleton key={i} />)}
          {matchesQuery.isError && <ApiErrorState onRetry={() => matchesQuery.refetch()} />}
          {matchesQuery.isSuccess && games.length === 0 && (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              Nenhuma partida encontrada para o período atual.
            </div>
          )}
          {matchesQuery.isSuccess && games.map((g) => <GameCard key={g.id} game={g} />)}
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
    tone === "primary" ? "text-primary" : tone === "warning" ? "text-warning" : "text-foreground";
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <p className={cn("mt-2 text-2xl font-semibold tabular-nums tracking-tight", toneCls)}>{value}</p>
    </div>
  );
}

function SectionHeader({ title, subtitle, icon }: { title: string; subtitle: string; icon: React.ReactNode }) {
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

function RecommendedCard({ game }: { game: Game }) {
  const editorial = analyzeEditorialFromGame(game);
  const coverage = analyzeCoverageFromGame(game);
  const topFactors = editorial.positiveFactors.slice(0, 3);
  const ratingTone =
    editorial.rating === "Excelente"
      ? "text-success border-success/30 bg-success/10"
      : editorial.rating === "Bom"
        ? "text-primary border-primary/30 bg-primary/10"
        : editorial.rating === "Regular"
          ? "text-warning border-warning/30 bg-warning/10"
          : "text-muted-foreground border-border bg-muted/30";
  return (
    <Link
      to="/briefing/$id"
      params={{ id: game.id }}
      className="group flex flex-col justify-between rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex -space-x-2">
            <img src={game.homeCrest} alt="" className="h-9 w-9 rounded-md ring-2 ring-card" />
            <img src={game.awayCrest} alt="" className="h-9 w-9 rounded-md ring-2 ring-card" />
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end gap-2">
              <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider", ratingTone)}>
                {editorial.rating}
              </span>
              <span className="text-lg font-semibold tabular-nums text-foreground">{editorial.editorialScore}</span>
            </div>
            <p className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">Editorial</p>
          </div>
        </div>
        <h3 className="mt-3 text-sm font-semibold text-foreground">
          {game.homeTeam} vs {game.awayTeam}
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground">{game.competition}</p>
        <p className="mt-2 line-clamp-2 text-xs text-foreground/80">{editorial.summary}</p>
        {topFactors.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-1">
            {topFactors.map((f) => (
              <li
                key={f}
                className="rounded-full border border-border bg-background/60 px-2 py-0.5 text-[10px] text-muted-foreground"
              >
                {f}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-wider">Coverage</span>
          <span className="font-semibold tabular-nums text-foreground/90">{coverage.coverageScore}</span>
          <span className="text-[10px]">· {coverage.rating}</span>
        </span>
        <span className="inline-flex items-center gap-1 text-primary opacity-0 transition-opacity group-hover:opacity-100">
          Abrir briefing <ArrowUpRight className="h-3 w-3" />
        </span>
      </div>
    </Link>
  );
}
