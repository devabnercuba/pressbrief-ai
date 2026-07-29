import { test } from "node:test";
import assert from "node:assert/strict";
import { MockNewsProvider } from "../newsProvider";
import { NewsService } from "../newsService";
import type { NewsArticle } from "../newsTypes";

const articles: NewsArticle[] = [
  { id: "1", title: "Fluminense em treino aberto", summary: "", content: "", source: "GE",
    publishedAt: "2026-07-24T10:00:00Z", url: "u", teams: ["Fluminense"],
    competition: "Brasileirão Série A", tags: [], confidence: 0.9 },
  { id: "2", title: "Flamengo confirma escalação", summary: "", content: "", source: "ESPN",
    publishedAt: "2026-07-25T08:00:00Z", url: "u", teams: ["Flamengo"],
    competition: "Brasileirão Série A", tags: ["escalacao"], confidence: 0.8 },
];

test("MockNewsProvider filtra por time", async () => {
  const p = new MockNewsProvider({ articles });
  const out = await p.fetchNews({ teams: ["Flamengo"] });
  assert.equal(out.length, 1);
  assert.equal(out[0].id, "2");
});

test("MockNewsProvider filtra por janela temporal", async () => {
  const p = new MockNewsProvider({ articles });
  const out = await p.fetchNews({ since: "2026-07-25T00:00:00Z" });
  assert.equal(out.length, 1);
  assert.equal(out[0].id, "2");
});

test("NewsService mescla providers e deduplica", async () => {
  const p1 = new MockNewsProvider({ id: "a", articles });
  const p2 = new MockNewsProvider({ id: "b", articles: [articles[0]] });
  const svc = new NewsService({ providers: [p1, p2] });
  const all = await svc.fetchAll();
  assert.equal(all.length, 2);
});

test("NewsService.analyzeForGame retorna estrutura completa", async () => {
  const svc = new NewsService({ providers: [new MockNewsProvider({ articles })] });
  const analysis = await svc.analyzeForGame({
    id: "flu-fla", homeTeam: "Fluminense", awayTeam: "Flamengo",
    competition: "Brasileirão Série A", date: "2026-07-25T19:00:00Z",
  });
  assert.equal(analysis.gameId, "flu-fla");
  assert.ok(analysis.totalNews > 0);
});

test("NewsService cacheia respostas", async () => {
  let calls = 0;
  class Counting extends MockNewsProvider {
    async fetchNews() { calls++; return articles; }
  }
  const svc = new NewsService({ providers: [new Counting({ articles })] });
  await svc.fetchAll();
  await svc.fetchAll();
  assert.equal(calls, 1);
});
