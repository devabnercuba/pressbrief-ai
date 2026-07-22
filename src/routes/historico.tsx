import { createFileRoute } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";
import { Layout, EmptyState } from "@/components/app/Layout";
import { Header } from "@/components/app/Header";

export const Route = createFileRoute("/historico")({
  head: () => ({
    meta: [
      { title: "Histórico — PressBrief AI" },
      { name: "description", content: "Histórico de coberturas realizadas." },
      { property: "og:title", content: "Histórico — PressBrief AI" },
      { property: "og:description", content: "Suas coberturas passadas e métricas." },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  return (
    <Layout>
      <Header title="Histórico" subtitle="Registro das suas coberturas anteriores." />
      <EmptyState
        icon={<BarChart3 className="h-8 w-8" />}
        title="Sem histórico ainda"
        description="Suas coberturas concluídas aparecerão aqui, com métricas e insights."
      />
    </Layout>
  );
}
