import { describe, it, expect } from "vitest";
import { analyzeGameNews } from "../newsEngine";
import type { MatchableGame, NewsArticle } from "../newsTypes";

const game: MatchableGame = {
  id: "flu-fla",
  homeTeam: "Fluminense",
  awayTeam: "Flamengo",
  competition: "Brasileirão Série A",
  date: "2026-07-25T19:00:00Z",
};

const art = (over: Partial<NewsArticle>): NewsArticle => ({
  id: "x", title: "", summary: "", content: "", source: "GE",
  publishedAt: "2026-07-24T12:00:00Z", url: "https://ex.com",
  teams: ["Fluminense"], competition: "Brasileirão Série A",
  tags: [], confidence: 0.9, ...over,
});

describe("newsEngine.analyzeGameNews", () => {
  it("retorna análise vazia sem artigos", () => {
    const a = analyzeGameNews(game, []);
    expect(a.totalNews).toBe(0);
    expect(a.editorialImportance).toBe("baixa");
    expect(a.alerts).toHaveLength(0);
  });

  it("classifica lesão como alerta de alta importância", () => {
    const a = analyzeGameNews(game, [
      art({ id: "1", title: "Pedro sofre lesão muscular", tags: ["lesao"] }),
    ]);
    expect(a.totalNews).toBe(1);
    expect(a.editorialImportance).toBe("alta");
    expect(a.alerts.length).toBe(1);
    expect(a.insights[0].category).toBe("lesão");
  });

  it("consolida múltiplas categorias em tópicos sugeridos", () => {
    const a = analyzeGameNews(game, [
      art({ id: "1", title: "Provável escalação do Fluminense", tags: ["escalacao"] }),
      art({ id: "2", title: "Clube anuncia contratação de reforço", tags: ["transferencia"] }),
      art({ id: "3", title: "Rivalidade e clássico do Rio", tags: ["classico"] }),
    ]);
    expect(a.suggestedTopics.length).toBeGreaterThanOrEqual(3);
    expect(a.editorialImportance).not.toBe("baixa");
  });

  it("média de confidence é calculada", () => {
    const a = analyzeGameNews(game, [
      art({ id: "1", confidence: 1, title: "escalacao" }),
      art({ id: "2", confidence: 0.5, title: "geral" }),
    ]);
    expect(a.confidence).toBeCloseTo(0.75, 5);
  });
});
