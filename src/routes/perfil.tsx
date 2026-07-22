import { createFileRoute } from "@tanstack/react-router";
import { User } from "lucide-react";
import { Layout, EmptyState } from "@/components/app/Layout";
import { Header } from "@/components/app/Header";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: "Perfil — PressBrief AI" },
      { name: "description", content: "Seu perfil profissional na PressBrief AI." },
      { property: "og:title", content: "Perfil — PressBrief AI" },
      { property: "og:description", content: "Perfil do fotógrafo esportivo." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  return (
    <Layout>
      <Header title="Perfil" subtitle="Suas informações e preferências profissionais." />
      <EmptyState
        icon={<User className="h-8 w-8" />}
        title="Perfil em construção"
        description="Em breve você poderá configurar sua bio, portfólio e agências parceiras."
      />
    </Layout>
  );
}
