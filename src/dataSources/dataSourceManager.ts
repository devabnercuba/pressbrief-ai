// DataSource Manager — porta única de entrada de dados do PressBrief.
// Fonte → Provider → Parser → Normalizer → Validação → PressBrief.
//
// Os Engines só recebem Game[]; jamais sabem a origem dos dados.
import {
  type DataSourceConfig,
  type DataSourceStats,
  type DateRangeInput,
  type NormalizedGame,
} from "./dataSourceTypes";
import { isValidGame, toAppGame } from "./gameNormalizer";
import { ProviderRegistry, providerRegistry as defaultRegistry } from "./providerRegistry";
import { DataCache } from "@/services/apiCache";
import { monthRange } from "@/lib/calendar-utils";
import type { Game } from "@/types";

export interface LoadResult {
  games: Game[];
  normalized: NormalizedGame[];
  stats: DataSourceStats[];
  /** "fresh" quando ao menos uma fonte respondeu agora. */
  source: "fresh" | "cache" | "stale";
  updatedAt: number;
}

export class DataSourceManager {
  private stats = new Map<string, DataSourceStats>();
  private cache: DataCache;

  constructor(
    private readonly registry: ProviderRegistry = defaultRegistry,
    cache: DataCache = new DataCache(),
  ) {
    this.cache = cache;
  }

  getStats(): DataSourceStats[] {
    return Array.from(this.stats.values());
  }

  getStatsFor(sourceId: string): DataSourceStats | undefined {
    return this.stats.get(sourceId);
  }

  clearCache(): void {
    this.cache.clear();
  }

  /** Executa uma fonte isolada, registrando cache e estatísticas. */
  async loadSource(source: DataSourceConfig, range?: DateRangeInput): Promise<NormalizedGame[]> {
    const base = { sourceId: source.id, name: source.name, type: source.type };

    if (!source.enabled) {
      this.stats.set(source.id, {
        ...base,
        status: "desativado",
        lastUpdate: this.stats.get(source.id)?.lastUpdate ?? null,
        games: 0,
        durationMs: 0,
      });
      return [];
    }

    const provider = this.registry.get(source.type);
    if (!provider) {
      this.stats.set(source.id, {
        ...base,
        status: "erro",
        lastUpdate: null,
        games: 0,
        durationMs: 0,
        message: `Nenhum provider registrado para "${source.type}".`,
      });
      return [];
    }

    const key = `${source.id}:${range ? `${range.dateFrom}:${range.dateTo}` : "all"}`;
    const started = Date.now();
    try {
      const result = await this.cache.fetch<NormalizedGame[]>(
        key,
        () => provider.load({ source, range }),
        { scope: `fonte ${source.name}` },
      );
      const games = result.data.filter(isValidGame);
      this.stats.set(source.id, {
        ...base,
        status: games.length > 0 ? "ok" : "vazio",
        lastUpdate: result.updatedAt,
        games: games.length,
        durationMs: Date.now() - started,
        message: result.source === "stale" ? "Exibindo último resultado válido." : undefined,
      });
      return games;
    } catch (error) {
      this.stats.set(source.id, {
        ...base,
        status: "erro",
        lastUpdate: this.stats.get(source.id)?.lastUpdate ?? null,
        games: 0,
        durationMs: Date.now() - started,
        message: error instanceof Error ? error.message : "Falha ao ler a fonte.",
      });
      return [];
    }
  }

  /** Carrega todas as fontes ativas e devolve Game[] unificado. */
  async load(sources: DataSourceConfig[], range?: DateRangeInput): Promise<LoadResult> {
    const active = sources.filter((s) => s.enabled);
    const batches = await Promise.all(active.map((source) => this.loadSource(source, range)));

    const byId = new Map<string, NormalizedGame>();
    for (const batch of batches) {
      for (const game of batch) {
        if (range && (game.date < range.dateFrom || game.date > range.dateTo)) continue;
        if (!byId.has(game.id)) byId.set(game.id, game);
      }
    }

    const normalized = Array.from(byId.values()).sort((a, b) =>
      a.date === b.date ? (a.time < b.time ? -1 : 1) : a.date < b.date ? -1 : 1,
    );

    const stats = active.map((s) => this.stats.get(s.id)).filter(Boolean) as DataSourceStats[];
    const anyError = stats.some((s) => s.status === "erro");
    const anyOk = stats.some((s) => s.status === "ok" || s.status === "vazio");

    return {
      games: normalized.map((game) => toAppGame(game)),
      normalized,
      stats,
      source: anyOk ? (anyError ? "stale" : "fresh") : "stale",
      updatedAt: Date.now(),
    };
  }

  /** Atalho usado pelo Calendário Inteligente. */
  async loadMonth(
    sources: DataSourceConfig[],
    year: number,
    month: number,
  ): Promise<LoadResult> {
    return this.load(sources, monthRange(year, month));
  }

  /** Força releitura de todas as fontes (botão "Atualizar Dados"). */
  async refresh(sources: DataSourceConfig[], range?: DateRangeInput): Promise<LoadResult> {
    this.clearCache();
    return this.load(sources, range);
  }
}

export const dataSourceManager = new DataSourceManager();
