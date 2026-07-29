// News Intelligence Layer (NIL) — tipos públicos.
// Nesta milestone criamos apenas a arquitetura: nenhum scraping,
// nenhuma chamada a IA. Toda a estrutura é preparada para receber
// múltiplos provedores no futuro (GE, ESPN, TNT, UOL, CBF, etc.).

export type NewsCategory =
  | "escalação"
  | "lesão"
  | "transferência"
  | "arbitragem"
  | "crise"
  | "recorde"
  | "estreia"
  | "clássico"
  | "pré-jogo"
  | "pós-jogo"
  | "coletiva"
  | "geral";

export type NewsImportance = "alta" | "média" | "baixa";

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  source: string;
  publishedAt: string; // ISO date
  url: string;
  image?: string;
  teams: string[];
  competition?: string;
  tags: string[];
  confidence: number; // 0..1 — confiança do provider na integridade do dado
}

export interface NewsInsight {
  headline: string;
  importance: NewsImportance;
  category: NewsCategory;
  relatedTeam?: string;
  relatedGame?: string; // gameId
  confidence: number;   // 0..1
}

export interface GameNewsAnalysis {
  gameId: string;
  totalNews: number;
  editorialImportance: NewsImportance;
  suggestedTopics: string[];
  alerts: string[];
  confidence: number;
  insights: NewsInsight[];
  articles: NewsArticle[];
}

// Contexto usado pelo matcher para relacionar notícias com jogos reais.
export interface MatchableGame {
  id: string;
  homeTeam: string;
  awayTeam: string;
  competition?: string;
  date: string; // ISO
}
