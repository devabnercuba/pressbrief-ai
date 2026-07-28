import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { CalendarCheck, Trophy, MapPin, Calendar, Clock, ArrowUpRight } from "lucide-react";
import { Layout, EmptyState } from "@/components/app/Layout";
import { Header } from "@/components/app/Header";
import { Button } from "@/components/ui/button";
import { useCredentialsStore } from "@/lib/credentials-store";
import { approvedRequests, type CredentialRequest } from "@/lib/credentials";

export const Route = createFileRoute("/agenda")({
  head: () => ({
    meta: [
      { title: "Agenda — PressBrief AI" },
      { name: "description", content: "Coberturas aprovadas e confirmadas na sua agenda." },
      { property: "og:title", content: "Agenda — PressBrief AI" },
      { property: "og:description", content: "Todas as partidas com credenciamento aprovado." },
    ],
  }),
  component: AgendaPage,
});

function formatDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
}

function AgendaPage() {
  const { requests } = useCredentialsStore();
  const approved = useMemo(
    () =>
      approvedRequests(requests).sort((a, b) => a.game.date.localeCompare(b.game.date)),
    [requests],
  );

  return (
    <Layout>
      <Header
        title="Agenda"
        subtitle={
          approved.length
            ? `${approved.length} cobertura(s) aprovada(s).`
            : "Suas coberturas aprovadas aparecerão aqui."
        }
      />
      {approved.length === 0 ? (
        <EmptyState
          icon={<CalendarCheck className="h-8 w-8" />}
          title="Nenhuma cobertura aprovada"
          description="Assim que um credenciamento for aprovado, o jogo aparece automaticamente aqui."
        />
      ) : (
        <section className="mt-6 space-y-3">
          {approved.map((r) => <AgendaCard key={r.id} req={r} />)}
        </section>
      )}
    </Layout>
  );
}

function AgendaCard({ req }: { req: CredentialRequest }) {
  const g = req.game;
  return (
    <article className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-5">
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex -space-x-2">
          <img src={g.homeCrest} alt="" className="h-11 w-11 rounded-lg ring-2 ring-card" />
          <img src={g.awayCrest} alt="" className="h-11 w-11 rounded-lg ring-2 ring-card" />
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-foreground">
            {g.homeTeam} <span className="text-muted-foreground">vs</span> {g.awayTeam}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Trophy className="h-3 w-3" />{g.competition}</span>
            <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{g.stadium} · {g.city}</span>
            <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(g.date)}</span>
            <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{g.time}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="rounded-full border border-success/30 bg-success/10 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-success">
          Aprovado
        </span>
        <Button asChild size="sm" variant="outline">
          <Link to="/briefing/$id" params={{ id: g.id }}>
            Briefing <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </article>
  );
}
