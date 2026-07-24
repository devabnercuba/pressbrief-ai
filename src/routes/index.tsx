import { createFileRoute, Link } from "@tanstack/react-router";
import { Sunrise, Sparkles, TicketCheck, FileText, ArrowUpRight, Radar as RadarIcon, Clock } from "lucide-react";
import { Layout } from "@/components/app/Layout";
import { FilterBar } from "@/components/app/FilterBar";
import { GameCard } from "@/components/app/GameCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { listGames, listRecommendedGames, listPendingCredentials, getDaySummary, getUserProfile } from "@/services/gameService";
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
  const games = listGames();
  const recommended = listRecommendedGames(3);
  const credentials = listPendingCredentials();
  const summary = getDaySummary();
  const profile = getUserProfile();
  const today = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });


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
          <SummaryCard icon={Sunrise} label="Jogos hoje" value={summary.gamesToday} />
          <SummaryCard icon={Sparkles} label="Novas oportunidades" value={summary.newOpportunities} tone="primary" />
          <SummaryCard icon={TicketCheck} label="Credenciamentos pendentes" value={summary.pendingCredentials} tone="warning" />
          <SummaryCard icon={FileText} label="Pautas mapeadas" value={summary.totalPautas} />
        </div>
      </header>

      {/* Recommended games */}
      <section className="mt-8">
        <SectionHeader
          title="Jogos recomendados"
          subtitle="Selecionados por Coverage Score e demanda editorial"
          icon={<Sparkles className="h-4 w-4" />}
        />
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {recommended.map((g) => (
            <RecommendedCard key={g.id} game={g} />
          ))}
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
          subtitle="Todos os jogos mapeados para as próximas datas"
          icon={<RadarIcon className="h-4 w-4" />}
        />
        <div className="mt-4">
          <FilterBar />
        </div>
        <div className="mt-4 space-y-4">
          {games.map((g) => (
            <GameCard key={g.id} game={g} />
          ))}
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

function RecommendedCard({ game }: { game: (typeof mockGames)[number] }) {
  return (
    <Link
      to="/briefing/$id"
      params={{ id: game.id }}
      className="group flex flex-col justify-between rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
    >
      <div>
        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">
            <img src={game.homeCrest} alt="" className="h-9 w-9 rounded-md ring-2 ring-card" />
            <img src={game.awayCrest} alt="" className="h-9 w-9 rounded-md ring-2 ring-card" />
          </div>
          <span className="text-lg font-semibold tabular-nums text-success">{game.coverageScore}</span>
        </div>
        <h3 className="mt-3 text-sm font-semibold text-foreground">
          {game.homeTeam} vs {game.awayTeam}
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground">{game.competition}</p>
      </div>
      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>{game.stadium}</span>
        <span className="inline-flex items-center gap-1 text-primary opacity-0 transition-opacity group-hover:opacity-100">
          Abrir briefing <ArrowUpRight className="h-3 w-3" />
        </span>
      </div>
    </Link>
  );
}
