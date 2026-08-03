// Painel "Data Sources" — nome, tipo, status, última atualização,
// quantidade de jogos e tempo de leitura de cada fonte.
import { Database, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SOURCE_TYPE_LABELS } from "@/lib/data-sources-store";
import type { DataSourceStats, DataSourceStatus } from "@/dataSources/dataSourceTypes";

const STATUS_STYLES: Record<DataSourceStatus, string> = {
  ok: "bg-emerald-500/10 text-emerald-400",
  vazio: "bg-amber-500/10 text-amber-400",
  erro: "bg-red-500/10 text-red-400",
  pendente: "bg-muted text-muted-foreground",
  desativado: "bg-muted text-muted-foreground",
};

const STATUS_LABELS: Record<DataSourceStatus, string> = {
  ok: "Online",
  vazio: "Sem jogos",
  erro: "Falhou",
  pendente: "Aguardando",
  desativado: "Desativada",
};

function formatTime(value: number | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function DataSourcesPanel({
  stats,
  onRefresh,
  isRefreshing,
}: {
  stats: DataSourceStats[];
  onRefresh?: () => void;
  isRefreshing?: boolean;
}) {
  return (
    <section className="rounded-xl border border-border bg-card">
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Fontes de dados</h2>
        </div>
        {onRefresh ? (
          <Button size="sm" variant="outline" onClick={onRefresh} disabled={isRefreshing}>
            <RefreshCw className={cn("mr-2 h-3.5 w-3.5", isRefreshing && "animate-spin")} />
            Atualizar dados
          </Button>
        ) : null}
      </header>

      {stats.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">
          Nenhuma fonte ativa. Cadastre URLs em Configurações.
        </p>
      ) : (
        <div className="divide-y divide-border">
          {stats.map((item) => (
            <div
              key={item.sourceId}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-40">
                <p className="text-sm font-medium text-foreground">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  {SOURCE_TYPE_LABELS[item.type]}
                  {item.message ? ` • ${item.message}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{item.games} jogos</span>
                <span>{item.durationMs} ms</span>
                <span>Atualizado {formatTime(item.lastUpdate)}</span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-medium",
                    STATUS_STYLES[item.status],
                  )}
                >
                  {STATUS_LABELS[item.status]}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
