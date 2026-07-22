import { createFileRoute } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { Layout, EmptyState } from "@/components/app/Layout";
import { Header } from "@/components/app/Header";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — PressBrief AI" },
      { name: "description", content: "Preferências e configurações da conta." },
      { property: "og:title", content: "Configurações — PressBrief AI" },
      { property: "og:description", content: "Ajuste suas preferências." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <Layout>
      <Header title="Configurações" subtitle="Preferências da sua conta e notificações." />
      <EmptyState
        icon={<Settings className="h-8 w-8" />}
        title="Configurações em breve"
        description="Notificações, integrações e preferências de radar estarão disponíveis aqui."
      />
    </Layout>
  );
}
