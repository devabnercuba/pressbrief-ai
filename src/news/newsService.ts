// News Service — orquestra providers, matcher, engine e cache.
// Ponto único de entrada usado pela UI / rotas / server functions.

import { NewsCache } from "./newsCache";
import { analyzeGameNews } from "./newsEngine";
import { groupArticlesByGame, matchArticleToGame } from "./newsMatcher";
import type { NewsProvider, NewsProviderContext } from "./newsProvider";
import type { GameNewsAnalysis, MatchableGame, NewsArticle } from "./newsTypes";

export class NewsService {
  private readonly providers = new Map<string, NewsProvider>();
  private readonly cache: NewsCache<NewsArticle[]>;

  constructor(opts: { providers?: NewsProvider[]; cacheTtlMs?: number } = {}) {
    this.cache = new NewsCache<NewsArticle[]>(opts.cacheTtlMs);
    for (const p of opts.providers ?? []) this.registerProvider(p);
  }

  registerProvider(provider: NewsProvider): void {
    this.providers.set(provider.id, provider);
  }

  unregisterProvider(id: string): void {
    this.providers.delete(id);
  }

  listProviders(): NewsProvider[] {
    return Array.from(this.providers.values());
  }

  /** Busca notícias de todos os providers, deduplica por (source,id) e ordena. */
  async fetchAll(context?: NewsProviderContext): Promise<NewsArticle[]> {
    const key = JSON.stringify(context ?? {});
    const cached = this.cache.get(key);
    if (cached) return cached;

    const results = await Promise.allSettled(
      this.listProviders().map((p) => p.fetchNews(context)),
    );

    const seen = new Set<string>();
    const merged: NewsArticle[] = [];
    for (const r of results) {
      if (r.status !== "fulfilled") continue;
      for (const article of r.value) {
        const dedupKey = `${article.source}::${article.id}`;
        if (seen.has(dedupKey)) continue;
        seen.add(dedupKey);
        merged.push(article);
      }
    }

    merged.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
    this.cache.set(key, merged);
    return merged;
  }

  /** Retorna análises editoriais por jogo (mapa gameId -> analysis). */
  async analyzeForGames(
    games: MatchableGame[],
    context?: NewsProviderContext,
  ): Promise<Record<string, GameNewsAnalysis>> {
    const articles = await this.fetchAll(context);
    const grouped = groupArticlesByGame(articles, games);
    const out: Record<string, GameNewsAnalysis> = {};
    for (const game of games) {
      out[game.id] = analyzeGameNews(game, grouped[game.id] ?? []);
    }
    return out;
  }

  async analyzeForGame(
    game: MatchableGame,
    context?: NewsProviderContext,
  ): Promise<GameNewsAnalysis> {
    const map = await this.analyzeForGames([game], context);
    return map[game.id];
  }

  /** Utilitário: relaciona um artigo isolado a um conjunto de jogos. */
  matchArticle(article: NewsArticle, games: MatchableGame[]) {
    return matchArticleToGame(article, games);
  }

  invalidate(): void {
    this.cache.clear();
  }
}

// -------- Mock singleton para uso na UI enquanto não há integrações reais --------

import { MockNewsProvider } from "./newsProvider";

const mockArticles: NewsArticle[] = [
  {
    id: "n1",
    title: "Ganso é relacionado e deve estrear após três meses",
    summary: "Meia do Fluminense volta aos treinos e é opção para o clássico.",
    content: "O meia Ganso foi relacionado pela comissão técnica e deve retornar aos gramados no clássico contra o Flamengo.",
    source: "GE",
    publishedAt: "2026-07-24T13:00:00Z",
    url: "https://ge.globo.com/mock/ganso",
    teams: ["Fluminense"],
    competition: "Brasileirão Série A",
    tags: ["escalacao", "retorno"],
    confidence: 0.9,
  },
  {
    id: "n2",
    title: "Pedro treina normalmente e é dúvida para o Fla-Flu",
    summary: "Atacante do Flamengo sente desconforto muscular na véspera.",
    content: "O atacante Pedro treinou parte com o grupo e virou dúvida do departamento médico.",
    source: "ESPN",
    publishedAt: "2026-07-24T10:00:00Z",
    url: "https://espn.com/mock/pedro",
    teams: ["Flamengo"],
    competition: "Brasileirão Série A",
    tags: ["lesao", "duvida"],
    confidence: 0.85,
  },
  {
    id: "n3",
    title: "Endrick se despede da torcida antes de ir ao Real Madrid",
    summary: "Palmeirense faz seu último clássico com a camisa alviverde.",
    content: "Endrick será titular no derby paulista antes de embarcar para o Real Madrid.",
    source: "UOL Esporte",
    publishedAt: "2026-07-25T09:00:00Z",
    url: "https://uol.com.br/mock/endrick",
    teams: ["Palmeiras"],
    competition: "Brasileirão Série A",
    tags: ["despedida", "transferencia"],
    confidence: 0.8,
  },
];

let singleton: NewsService | undefined;
export function getNewsService(): NewsService {
  if (!singleton) {
    singleton = new NewsService({
      providers: [new MockNewsProvider({ id: "mock-ge", name: "Mock GE", trust: 0.9, articles: mockArticles })],
    });
  }
  return singleton;
}
