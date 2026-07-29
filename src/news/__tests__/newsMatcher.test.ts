import { test } from "node:test";
import assert from "node:assert/strict";
import { groupArticlesByGame, matchArticleToGame, scoreArticleForGame } from "../newsMatcher";
import type { MatchableGame, NewsArticle } from "../newsTypes";

const games: MatchableGame[] = [
  { id: "flu-fla", homeTeam: "Fluminense", awayTeam: "Flamengo", competition: "Brasileirão Série A", date: "2026-07-25T19:00:00Z" },
  { id: "ava-ame", homeTeam: "Avaí", awayTeam: "América", competition: "Série B", date: "2026-07-26T22:00:00Z" },
];

const baseArticle = (over: Partial<NewsArticle>): NewsArticle => ({
  id: "x", title: "", summary: "", content: "", source: "GE",
  publishedAt: "2026-07-24T10:00:00Z", url: "https://ex.com",
  teams: [], competition: "Brasileirão Série A", tags: [], confidence: 0.9,
  ...over,
});

test("matcher relaciona notícia mencionando os dois clubes", () => {
  const a = baseArticle({ title: "Fluminense e Flamengo se enfrentam no Maracanã", teams: ["Fluminense", "Flamengo"] });
  const match = matchArticleToGame(a, games);
  assert.equal(match?.gameId, "flu-fla");
  assert.ok((match?.score ?? 0) > 0.6);
});

test("matcher relaciona por menção parcial + competição + proximidade", () => {
  const a = baseArticle({ title: "Avaí anuncia estreia do atacante", teams: ["Avaí"], competition: "Série B", publishedAt: "2026-07-25T12:00:00Z" });
  const match = matchArticleToGame(a, games);
  assert.equal(match?.gameId, "ava-ame");
});

test("matcher descarta notícia sem relação", () => {
  const a = baseArticle({ title: "Notícia genérica sobre tênis", teams: [], competition: undefined });
  assert.equal(matchArticleToGame(a, games), undefined);
});

test("groupArticlesByGame agrupa corretamente", () => {
  const articles = [
    baseArticle({ id: "a1", title: "Fluminense x Flamengo agita o Rio", teams: ["Fluminense", "Flamengo"] }),
    baseArticle({ id: "a2", title: "Avaí confirma estreia", teams: ["Avaí"], competition: "Série B" }),
    baseArticle({ id: "a3", title: "Notícia irrelevante", teams: [], competition: undefined }),
  ];
  const grouped = groupArticlesByGame(articles, games);
  assert.equal(grouped["flu-fla"]?.length, 1);
  assert.equal(grouped["ava-ame"]?.length, 1);
});

test("scoreArticleForGame retorna razões", () => {
  const a = baseArticle({ title: "Fluminense x Flamengo", teams: ["Fluminense", "Flamengo"] });
  const s = scoreArticleForGame(a, games[0]);
  assert.ok(s.reasons.length > 0);
});
