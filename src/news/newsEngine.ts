// News Engine — consolida notícias relacionadas a um jogo e gera
// insights editoriais determinísticos (sem IA nesta milestone).

import type {
  GameNewsAnalysis,
  NewsArticle,
  NewsCategory,
  NewsImportance,
  NewsInsight,
  MatchableGame,
} from "./newsTypes";

const CATEGORY_RULES: Array<{ category: NewsCategory; keywords: string[]; importance: NewsImportance }> = [
  { category: "lesão",         keywords: ["lesao", "lesionado", "cirurgia", "departamento medico"], importance: "alta" },
  { category: "escalação",     keywords: ["escalacao", "provavel", "relacionados", "convocados"], importance: "alta" },
  { category: "transferência", keywords: ["transferencia", "contratacao", "anuncio", "reforco", "venda"], importance: "média" },
  { category: "crise",         keywords: ["crise", "demissao", "renuncia", "protesto"], importance: "alta" },
  { category: "recorde",       keywords: ["recorde", "marca historica", "invicto"], importance: "média" },
  { category: "estreia",       keywords: ["estreia", "primeiro jogo", "debute"], importance: "média" },
  { category: "clássico",      keywords: ["classico", "rivalidade", "derby"], importance: "alta" },
  { category: "arbitragem",    keywords: ["arbitragem", "arbitro", "var"], importance: "baixa" },
  { category: "coletiva",      keywords: ["coletiva", "entrevista"], importance: "baixa" },
  { category: "pré-jogo",      keywords: ["pre jogo", "aquecimento"], importance: "baixa" },
  { category: "pós-jogo",      keywords: ["pos jogo", "reacao"], importance: "baixa" },
];

const IMPORTANCE_WEIGHT: Record<NewsImportance, number> = { alta: 1, média: 0.6, baixa: 0.3 };

function normalize(v: string): string {
  return v.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function classify(article: NewsArticle): { category: NewsCategory; importance: NewsImportance } {
  const hay = normalize(`${article.title} ${article.summary} ${article.tags.join(" ")}`);
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((k) => hay.includes(k))) {
      return { category: rule.category, importance: rule.importance };
    }
  }
  return { category: "geral", importance: "baixa" };
}

function toInsight(article: NewsArticle, gameId: string): NewsInsight {
  const { category, importance } = classify(article);
  return {
    headline: article.title,
    importance,
    category,
    relatedTeam: article.teams[0],
    relatedGame: gameId,
    confidence: article.confidence,
  };
}

function aggregateImportance(insights: NewsInsight[]): NewsImportance {
  if (!insights.length) return "baixa";
  const avg =
    insights.reduce((acc, i) => acc + IMPORTANCE_WEIGHT[i.importance] * i.confidence, 0) /
    insights.length;
  if (avg >= 0.7) return "alta";
  if (avg >= 0.4) return "média";
  return "baixa";
}

/** Analisa notícias já filtradas para um único jogo. */
export function analyzeGameNews(
  game: MatchableGame,
  articles: NewsArticle[],
): GameNewsAnalysis {
  const insights = articles.map((a) => toInsight(a, game.id));
  const importance = aggregateImportance(insights);

  const topicSet = new Set<string>();
  const alerts: string[] = [];

  for (const insight of insights) {
    if (insight.category === "lesão" || insight.category === "crise") {
      alerts.push(insight.headline);
    }
    if (insight.category !== "geral") {
      topicSet.add(insight.headline);
    }
  }

  const confidence = articles.length
    ? articles.reduce((acc, a) => acc + a.confidence, 0) / articles.length
    : 0;

  return {
    gameId: game.id,
    totalNews: articles.length,
    editorialImportance: importance,
    suggestedTopics: Array.from(topicSet).slice(0, 6),
    alerts: alerts.slice(0, 4),
    confidence,
    insights,
    articles,
  };
}
