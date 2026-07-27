import { createFileRoute, Link } from "@tanstack/react-router";
import { Star, X, Calendar, Trophy, MapPin, ArrowUpRight } from "lucide-react";
import { Layout, EmptyState } from "@/components/app/Layout";
import { Header } from "@/components/app/Header";
import { Button } from "@/components/ui/button";
import { useGamesStore } from "@/lib/games-store";
import type { Game } from "@/types";

export const Route = createFileRoute("/meus-jogos")({
  head: () => ({
    meta: [
      { title: "Meus Jogos — PressBrief AI" },
      { name: "description", content: "Jogos marcados como interesse." },
      { property: "og:title", content: "Meus Jogos — PressBrief AI" },
      { property: "og:description", content: "Sua lista de coberturas planejadas." },
    ],
  }),
  component: MyGamesPage,
});

function formatDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function MyGamesPage() {
  const { savedGames, removeGame } = useGamesStore();

  return (
    <Layout>
      <Header
        title="Meus Jogos"
        subtitle={
          savedGames.length
            ? `${savedGames.length} jogo(s) marcado(s) como interesse.`
            : "Marque jogos no Calendário para acompanhá-los aqui."
        }
      />
      {savedGames.length === 0 ? (
        <EmptyState
          icon={<Star className="h-8 w-8" />}
          title="Nenhum jogo salvo ainda"
          description="Volte ao Calendário e clique em 'Tenho Interesse' para adicionar jogos."
        />
      ) : (
        <section className="mt-6 space-y-3">
          {savedGames.map((g) => (
            <SavedRow key={g.id} game={g} onRemove={() => removeGame(g.id)} />
          ))}
        </section>
      )}
    </Layout>
  );
}

function SavedRow({ game, onRemove }: { game: Game; onRemove: () => void }) {
  return (
    <article className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex -space-x-2">
          <img src={game.homeCrest} alt="" className="h-10 w-10 rounded-lg ring-2 ring-card" />
          <img src={game.awayCrest} alt="" className="h-10 w-10 rounded-lg ring-2 ring-card" />
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-foreground">
            {game.homeTeam} <span className="text-muted-foreground">vs</span> {game.awayTeam}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Trophy className="h-3 w-3" />{game.competition}</span>
            <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(game.date)} · {game.time}</span>
            {game.stadium !== "Estádio a confirmar" && (
              <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{game.stadium}</span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary">
          Interesse
        </span>
        <Button asChild size="sm" variant="outline">
          <Link to="/briefing/$id" params={{ id: game.id }}>
            Briefing <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </Button>
        <Button size="sm" variant="ghost" onClick={onRemove} aria-label="Remover">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </article>
  );
}
