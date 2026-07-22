import { createFileRoute } from "@tanstack/react-router";
import { Calendar } from "lucide-react";
import { Layout, EmptyState } from "@/components/app/Layout";
import { Header } from "@/components/app/Header";

export const Route = createFileRoute("/calendario")({
  head: () => ({
    meta: [
      { title: "Calendário — PressBrief AI" },
      { name: "description", content: "Visualize sua agenda de coberturas esportivas." },
      { property: "og:title", content: "Calendário — PressBrief AI" },
      { property: "og:description", content: "Agenda de coberturas do fotógrafo." },
    ],
  }),
  component: CalendarPage,
});

function CalendarPage() {
  return (
    <Layout>
      <Header title="Calendário" subtitle="Sua agenda de coberturas ao longo da temporada." />
      <EmptyState
        icon={<Calendar className="h-8 w-8" />}
        title="Calendário em construção"
        description="Em breve você verá aqui uma visão semanal e mensal dos seus jogos."
      />
    </Layout>
  );
}
