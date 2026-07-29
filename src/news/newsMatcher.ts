// News Matcher — relaciona notícias com partidas do calendário.
// Regras determinísticas baseadas em: nome dos times, campeonato,
// data de publicação e palavras-chave relevantes.

import type { MatchableGame, NewsArticle } from "./newsTypes";

const DAY_MS = 24 * 60 * 60 * 1000;

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function mentionsTeam(article: NewsArticle, team: string): boolean {
  const nTeam = normalize(team);
  if (!nTeam) return false;
  if (article.teams.some((t) => normalize(t) === nTeam)) return true;
  const haystack = normalize(`${article.title} ${article.summary} ${article.content}`);
  return haystack.includes(nTeam);
}

export interface MatchScore {
  gameId: string;
  score: number;      // 0..1
  reasons: string[];
}

/** Pontua um artigo contra um jogo. */
export function scoreArticleForGame(article: NewsArticle, game: MatchableGame): MatchScore {
  const reasons: string[] = [];
  let score = 0;

  const homeHit = mentionsTeam(article, game.homeTeam);
  const awayHit = mentionsTeam(article, game.awayTeam);
  if (homeHit && awayHit) {
    score += 0.6;
    reasons.push("menciona os dois clubes");
  } else if (homeHit || awayHit) {
    score += 0.35;
    reasons.push(`menciona ${homeHit ? game.homeTeam : game.awayTeam}`);
  }

  if (game.competition && article.competition) {
    if (normalize(game.competition) === normalize(article.competition)) {
      score += 0.15;
      reasons.push("mesma competição");
    }
  }

  // Proximidade temporal: notícias até 7 dias antes ou 2 dias depois do jogo.
  const gameTs = Date.parse(game.date);
  const artTs = Date.parse(article.publishedAt);
  if (!Number.isNaN(gameTs) && !Number.isNaN(artTs)) {
    const diffDays = (gameTs - artTs) / DAY_MS;
    if (diffDays >= -2 && diffDays <= 7) {
      const proximity = 1 - Math.min(1, Math.abs(diffDays) / 7);
      score += 0.15 * proximity;
      reasons.push("próxima temporalmente");
    }
  }

  // Palavras-chave que indicam relação direta com a partida.
  const kw = normalize(`${article.title} ${article.tags.join(" ")}`);
  const hotWords = ["escalacao", "provavel", "convocados", "arbitragem", "coletiva", "pre jogo"];
  if (hotWords.some((w) => kw.includes(w))) {
    score += 0.1;
    reasons.push("palavras-chave de pré-jogo");
  }

  return { gameId: game.id, score: Math.min(1, score), reasons };
}

/** Retorna o jogo mais provável (score >= threshold) ou undefined. */
export function matchArticleToGame(
  article: NewsArticle,
  games: MatchableGame[],
  threshold = 0.4,
): MatchScore | undefined {
  const scored = games
    .map((g) => scoreArticleForGame(article, g))
    .filter((s) => s.score >= threshold)
    .sort((a, b) => b.score - a.score);
  return scored[0];
}

/** Agrupa artigos por jogo. Um artigo é atribuído a no máximo um jogo. */
export function groupArticlesByGame(
  articles: NewsArticle[],
  games: MatchableGame[],
  threshold = 0.4,
): Record<string, NewsArticle[]> {
  const result: Record<string, NewsArticle[]> = {};
  for (const article of articles) {
    const match = matchArticleToGame(article, games, threshold);
    if (!match) continue;
    (result[match.gameId] ??= []).push(article);
  }
  return result;
}
