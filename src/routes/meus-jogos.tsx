import { createFileRoute } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { Layout, EmptyState } from "@/components/app/Layout";
import { Header } from "@/components/app/Header";
import { GameCard } from "@/components/app/GameCard";
import { useGamesStore } from "@/lib/games-store";

export const Route = createFileRoute("/meus-jogos")({
  head: () => ({
    meta: [
      { title: "Meus Jogos — PressBrief AI" },
      { name: "description", content: "Jogos que você marcou interesse em cobrir." },
      { property: "og:title", content: "Meus Jogos — PressBrief AI" },
      { property: "og:description", content: "Sua lista de coberturas planejadas." },
    ],
  }),
  component: MyGamesPage,
});

function MyGamesPage() {
  const { savedGames } = useGamesStore();

  return (
    <Layout>
      <Header
        title="Meus Jogos"
        subtitle={
          savedGames.length
            ? `${savedGames.length} jogo(s) na sua lista de interesse.`
            : "Marque jogos no Radar para acompanhá-los aqui."
        }
      />
      {savedGames.length === 0 ? (
        <EmptyState
          icon={<Star className="h-8 w-8" />}
          title="Nenhum jogo salvo ainda"
          description="Vá até o Radar e clique em 'Tenho Interesse' para adicionar jogos à sua lista."
        />
      ) : (
        <section className="mt-6 space-y-4">
          {savedGames.map((g) => (
            <GameCard key={g.id} game={g} />
          ))}
        </section>
      )}
    </Layout>
  );
}
