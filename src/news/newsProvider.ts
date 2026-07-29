// Interface pública para provedores de notícias.
// Cada provider concreto (GE, ESPN, TNT, UOL, Gazeta, CBF, federações,
// sites oficiais dos clubes) deve implementar `NewsProvider`.
//
// Nesta milestone NÃO implementamos scraping — apenas o contrato
// e um `MockNewsProvider` para desenvolvimento e testes.

import type { NewsArticle } from "./newsTypes";

export interface NewsProviderContext {
  since?: string; // ISO date — limite inferior para busca
  until?: string; // ISO date — limite superior
  teams?: string[];
  competition?: string;
  limit?: number;
}

export interface NewsProvider {
  /** Identificador único e estável do provider (ex.: "ge", "espn"). */
  readonly id: string;
  /** Nome exibível. */
  readonly name: string;
  /** Peso de confiança do provider (0..1). */
  readonly trust: number;

  /**
   * Busca notícias. Implementações futuras poderão usar fetch, RSS,
   * APIs oficiais, scraping (não nesta milestone) etc.
   */
  fetchNews(context?: NewsProviderContext): Promise<NewsArticle[]>;
}

/**
 * Provider mockado. Útil para desenvolvimento local, testes automatizados
 * e para o pipeline funcionar antes das integrações reais existirem.
 */
export class MockNewsProvider implements NewsProvider {
  readonly id: string;
  readonly name: string;
  readonly trust: number;
  private readonly articles: NewsArticle[];

  constructor(opts: { id?: string; name?: string; trust?: number; articles: NewsArticle[] }) {
    this.id = opts.id ?? "mock";
    this.name = opts.name ?? "Mock Provider";
    this.trust = opts.trust ?? 0.7;
    this.articles = opts.articles;
  }

  async fetchNews(context?: NewsProviderContext): Promise<NewsArticle[]> {
    let out = [...this.articles];
    if (context?.since) out = out.filter((a) => a.publishedAt >= context.since!);
    if (context?.until) out = out.filter((a) => a.publishedAt <= context.until!);
    if (context?.teams?.length) {
      const set = new Set(context.teams.map((t) => t.toLowerCase()));
      out = out.filter((a) => a.teams.some((t) => set.has(t.toLowerCase())));
    }
    if (context?.competition) {
      out = out.filter((a) => (a.competition ?? "").toLowerCase() === context.competition!.toLowerCase());
    }
    if (context?.limit) out = out.slice(0, context.limit);
    return out;
  }
}
