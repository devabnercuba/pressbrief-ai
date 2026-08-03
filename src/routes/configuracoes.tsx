import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, RefreshCw, Link2 } from "lucide-react";
import { toast } from "sonner";
import { Layout } from "@/components/app/Layout";
import { Header } from "@/components/app/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SOURCE_TYPE_LABELS, useDataSources } from "@/lib/data-sources-store";
import { dataSourceManager } from "@/dataSources/dataSourceManager";
import type { DataSourceType } from "@/dataSources/dataSourceTypes";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — PressBrief AI" },
      {
        name: "description",
        content: "Cadastre fontes de dados (CBF, federações, planilhas, APIs) do PressBrief AI.",
      },
      { property: "og:title", content: "Configurações — PressBrief AI" },
      { property: "og:description", content: "Gerencie as fontes de dados do seu calendário." },
    ],
  }),
  component: SettingsPage,
});

const SELECTABLE_TYPES: DataSourceType[] = ["url", "json", "rss", "excel", "pdf", "manual", "api"];

function SettingsPage() {
  const { sources, addSource, updateSource, removeSource, toggleSource } = useDataSources();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState<DataSourceType>("url");
  const [refreshing, setRefreshing] = useState(false);

  function handleAdd() {
    if (!name.trim()) {
      toast.error("Informe um nome para a fonte.");
      return;
    }
    if (type !== "manual" && !url.trim()) {
      toast.error("Informe a URL da fonte.");
      return;
    }
    addSource({ name: name.trim(), url: url.trim() || undefined, type, enabled: true });
    setName("");
    setUrl("");
    toast.success("Fonte adicionada.");
  }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      dataSourceManager.clearCache();
      await queryClient.invalidateQueries();
      toast.success("Fontes atualizadas — o calendário foi recarregado.");
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <Layout>
      <Header
        title="Configurações"
        subtitle="Fontes de dados, atualização e preferências do PressBrief."
      />

      <section className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Fontes de dados</h2>
            <p className="text-xs text-muted-foreground">
              Cadastre URLs de CBF, federações estaduais, planilhas ou APIs. Tudo passa pelo
              Universal Data Source.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Atualizar dados
          </Button>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_2fr_auto_auto]">
          <Input placeholder="Nome (ex.: CBF)" value={name} onChange={(e) => setName(e.target.value)} />
          <Input
            placeholder="https://..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <Select value={type} onValueChange={(value) => setType(value as DataSourceType)}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SELECTABLE_TYPES.map((item) => (
                <SelectItem key={item} value={item}>
                  {SOURCE_TYPE_LABELS[item]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar
          </Button>
        </div>

        <div className="mt-4 divide-y divide-border rounded-lg border border-border">
          {sources.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">Nenhuma fonte cadastrada.</p>
          ) : (
            sources.map((source) => (
              <div key={source.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-52">
                  <Input
                    value={source.name}
                    onChange={(e) => updateSource(source.id, { name: e.target.value })}
                    className="h-8 border-transparent bg-transparent px-0 text-sm font-medium focus-visible:border-input focus-visible:px-2"
                  />
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Link2 className="h-3 w-3" />
                    <Input
                      value={source.url ?? ""}
                      placeholder={source.type === "api" ? "Fonte interna" : "https://..."}
                      onChange={(e) => updateSource(source.id, { url: e.target.value })}
                      className="h-7 border-transparent bg-transparent px-0 text-xs focus-visible:border-input focus-visible:px-2"
                    />
                  </div>
                </div>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                  {SOURCE_TYPE_LABELS[source.type]}
                </span>
                <Switch
                  checked={source.enabled}
                  onCheckedChange={() => toggleSource(source.id)}
                  aria-label={`Ativar ${source.name}`}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Remover ${source.name}`}
                  onClick={() => removeSource(source.id)}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            ))
          )}
        </div>
      </section>
    </Layout>
  );
}
