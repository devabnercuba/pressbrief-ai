import { test } from "node:test";
import assert from "node:assert/strict";
import { analyzeGameNews } from "../newsEngine";
import type { MatchableGame, NewsArticle } from "../newsTypes";

const game: MatchableGame = {
  id: "flu-fla", homeTeam: "Fluminense", awayTeam: "Flamengo",
  competition: "Brasileirão Série A", date: "2026-07-25T19:00:00Z",
};

const art = (over: Partial<NewsArticle>): NewsArticle => ({
  id: "x", title: "", summary: "", content: "", source: "GE",
  publishedAt: "2026-07-24T12:00:00Z", url: "https://ex.com",
  teams: ["Fluminense"], competition: "Brasileirão Série A",
  tags: [], confidence: 0.9, ...over,
});

test("análise vazia sem artigos", () => {
  const a = analyzeGameNews(game, []);
  assert.equal(a.totalNews, 0);
  assert.equal(a.editorialImportance, "baixa");
  assert.equal(a.alerts.length, 0);
});

test("lesão gera alerta de alta importância", () => {
  const a = analyzeGameNews(game, [art({ id: "1", title: "Pedro sofre lesão muscular", tags: ["lesao"] })]);
  assert.equal(a.totalNews, 1);
  assert.equal(a.editorialImportance, "alta");
  assert.equal(a.alerts.length, 1);
  assert.equal(a.insights[0].category, "lesão");
});

test("consolida tópicos sugeridos a partir de múltiplas categorias", () => {
  const a = analyzeGameNews(game, [
    art({ id: "1", title: "Provável escalação do Fluminense", tags: ["escalacao"] }),
    art({ id: "2", title: "Clube anuncia contratação de reforço", tags: ["transferencia"] }),
    art({ id: "3", title: "Rivalidade e clássico do Rio", tags: ["classico"] }),
  ]);
  assert.ok(a.suggestedTopics.length >= 3);
  assert.notEqual(a.editorialImportance, "baixa");
});

test("média de confidence é calculada", () => {
  const a = analyzeGameNews(game, [
    art({ id: "1", confidence: 1 }),
    art({ id: "2", confidence: 0.5 }),
  ]);
  assert.ok(Math.abs(a.confidence - 0.75) < 1e-6);
});
