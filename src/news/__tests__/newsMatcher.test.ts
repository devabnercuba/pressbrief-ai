import { describe, it, expect } from "vitest";
import { groupArticlesByGame, matchArticleToGame, scoreArticleForGame } from "../newsMatcher";
import type { MatchableGame, NewsArticle } from "../newsTypes";

const games: MatchableGame[] = [
  { id: "flu-fla", homeTeam: "Fluminense", awayTeam: "Flamengo", competition: "Brasileirão Série A", date: "2026-07-25T19:00:00Z" },
  { id: "ava-ame", homeTeam: "Avaí", awayTeam: "América", competition: "Série B", date: "2026-07-26T22:00:00Z" },
];

const baseArticle = (over: Partial<NewsArticle>): NewsArticle => ({
  id: "x",
  title: "",
  summary: "",
  content: "",
  source: "GE",
  publishedAt: "2026-07-24T10:00:00Z",
  url: "https://ex.com",
  teams: [],
  competition: "Brasileirão Série A",
  tags: [],
  confidence: 0.9,
  ...over,
});

describe("newsMatcher", () => {
  it("relaciona notícia mencionando os dois clubes", () => {
    const a = baseArticle({ title: "Fluminense e Flamengo se enfrentam no Maracanã", teams: ["Fluminense", "Flamengo"] });
    const match = matchArticleToGame(a, games);
    expect(match?.gameId).toBe("flu-fla");
    expect(match!.score).toBeGreaterThan(0.6);
  });

  it("relaciona por menção parcial (um clube) + competição + proximidade", () => {
    const a = baseArticle({ title: "Avaí anuncia estreia do atacante", teams: ["Avaí"], competition: "Série B", publishedAt: "2026-07-25T12:00:00Z" });
    const match = matchArticleToGame(a, games);
    expect(match?.gameId).toBe("ava-ame");
  });

  it("descarta notícia sem relação (abaixo do threshold)", () => {
    const a = baseArticle({ title: "Notícia genérica sobre tênis", teams: [], competition: undefined });
    const match = matchArticleToGame(a, games);
    expect(match).toBeUndefined();
  });

  it("agrupa artigos por jogo", () => {
    const articles = [
      baseArticle({ id: "a1", title: "Fluminense x Flamengo agita o Rio", teams: ["Fluminense", "Flamengo"] }),
      baseArticle({ id: "a2", title: "Avaí confirma estreia", teams: ["Avaí"], competition: "Série B" }),
      baseArticle({ id: "a3", title: "Notícia irrelevante", teams: [] }),
    ];
    const grouped = groupArticlesByGame(articles, games);
    expect(grouped["flu-fla"]).toHaveLength(1);
    expect(grouped["ava-ame"]).toHaveLength(1);
    expect(grouped["irrelevante"]).toBeUndefined();
  });

  it("scoreArticleForGame retorna razões", () => {
    const a = baseArticle({ title: "Fluminense x Flamengo", teams: ["Fluminense", "Flamengo"] });
    const s = scoreArticleForGame(a, games[0]);
    expect(s.reasons.length).toBeGreaterThan(0);
  });
});
