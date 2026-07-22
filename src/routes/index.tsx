import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/app/Layout";
import { Header } from "@/components/app/Header";
import { FilterBar } from "@/components/app/FilterBar";
import { GameCard } from "@/components/app/GameCard";
import { mockGames } from "@/lib/mock-games";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Radar — PressBrief AI" },
      {
        name: "description",
        content:
          "Radar de oportunidades para fotógrafos esportivos: os melhores jogos para cobertura hoje.",
      },
      { property: "og:title", content: "Radar — PressBrief AI" },
      {
        property: "og:description",
        content: "Inteligência para fotógrafos esportivos profissionais.",
      },
    ],
  }),
  component: RadarPage,
});

function RadarPage() {
  return (
    <Layout>
      <Header
        title="Radar de Oportunidades"
        subtitle="Os melhores jogos para cobertura hoje."
      />
      <div className="mt-6">
        <FilterBar />
      </div>
      <section className="mt-6 space-y-4">
        {mockGames.map((g) => (
          <GameCard key={g.id} game={g} />
        ))}
      </section>
    </Layout>
  );
}
