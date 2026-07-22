import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Calendar, Clock, MapPin, Trophy } from "lucide-react";
import { Layout } from "@/components/app/Layout";
import { Header } from "@/components/app/Header";
import { ScoreBadge, CoverageScore } from "@/components/app/ScoreBadge";
import { Button } from "@/components/ui/button";
import { getGameById } from "@/lib/mock-games";

export const Route = createFileRoute("/briefing/$id")({
  head: () => ({
    meta: [
      { title: "Briefing — PressBrief AI" },
      { name: "description", content: "Briefing completo do jogo selecionado." },
      { property: "og:title", content: "Briefing — PressBrief AI" },
      { property: "og:description", content: "Dossiê editorial para cobertura fotográfica." },
    ],
  }),
  loader: ({ params }) => {
    const game = getGameById(params.id);
    if (!game) throw notFound();
    return { game };
  },
  component: BriefingPage,
});

function BriefingPage() {
  const { game } = Route.useLoaderData();

  return (
    <Layout>
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2 text-muted-foreground">
        <Link to="/">
          <ArrowLeft className="mr-1 h-4 w-4" /> Voltar ao Radar
        </Link>
      </Button>

      <Header
        title={`${game.homeTeam} vs ${game.awayTeam}`}
        subtitle={`${game.competition} • ${game.stadium}, ${game.city}`}
        actions={<CoverageScore score={game.coverageScore} />}
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between gap-6">
              <TeamBlock name={game.homeTeam} crest={game.homeCrest} />
              <span className="text-sm font-medium text-muted-foreground">vs</span>
              <TeamBlock name={game.awayTeam} crest={game.awayCrest} align="right" />
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-6 sm:grid-cols-4">
              <Meta icon={Calendar} label="Data" value={game.date} />
              <Meta icon={Clock} label="Horário" value={game.time} />
              <Meta icon={MapPin} label="Estádio" value={game.stadium} />
              <Meta icon={Trophy} label="Competição" value={game.competition} />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Análise Editorial
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-foreground/90">
              Este confronto reúne fatores de alta demanda editorial, com destaque para narrativas
              de rivalidade histórica, jogadores em momento de valorização de mercado e condições
              técnicas favoráveis para captura fotográfica. Recomenda-se chegada com 3h de
              antecedência para posicionamento em zonas privilegiadas.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Por que este jogo?
            </h2>
            <ul className="mt-3 space-y-2.5">
              {game.reasons.map((r) => (
                <li key={r} className="flex gap-3 text-sm text-foreground/90">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Nível de oportunidade
            </p>
            <div className="mt-3">
              <ScoreBadge opportunity={game.opportunity} />
            </div>
            <div className="mt-6 space-y-3 text-sm">
              <Stat label="Demanda de agências" value="Alta" tone="success" />
              <Stat label="Concorrência local" value="Média" tone="warning" />
              <Stat label="Iluminação prevista" value="Ótima" tone="success" />
              <Stat label="Credenciamento" value="Aberto" tone="success" />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="text-sm font-semibold text-foreground">Logística</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Estimativa de deslocamento e infraestrutura serão calculadas quando o módulo de
              geolocalização estiver ativo.
            </p>
          </div>
        </aside>
      </div>
    </Layout>
  );
}

function TeamBlock({
  name,
  crest,
  align = "left",
}: {
  name: string;
  crest: string;
  align?: "left" | "right";
}) {
  return (
    <div className={`flex items-center gap-3 ${align === "right" ? "flex-row-reverse" : ""}`}>
      <img src={crest} alt={name} className="h-16 w-16 rounded-xl" />
      <div className={align === "right" ? "text-right" : ""}>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          {align === "right" ? "Visitante" : "Mandante"}
        </p>
        <p className="text-lg font-semibold text-foreground">{name}</p>
      </div>
    </div>
  );
}

function Meta({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "success" | "warning" | "destructive";
}) {
  const toneMap = {
    success: "text-success",
    warning: "text-warning",
    destructive: "text-destructive",
  } as const;
  return (
    <div className="flex items-center justify-between border-b border-border/60 pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium ${toneMap[tone]}`}>{value}</span>
    </div>
  );
}
