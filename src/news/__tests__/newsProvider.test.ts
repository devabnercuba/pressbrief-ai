import { describe, it, expect } from "vitest";
import { MockNewsProvider } from "../newsProvider";
import { NewsService } from "../newsService";
import type { NewsArticle } from "../newsTypes";

const articles: NewsArticle[] = [
  {
    id: "1", title: "Fluminense em treino aberto", summary: "", content: "",
    source: "GE", publishedAt: "2026-07-24T10:00:00Z", url: "u",
    teams: ["Fluminense"], competition: "Brasileirão Série A", tags: [], confidence: 0.9,
  },
  {
    id: "2", title: "Flamengo confirma escalação", summary: "", content: "",
    source: "ESPN", publishedAt: "2026-07-25T08:00:00Z", url: "u",
    teams: ["Flamengo"], competition: "Brasileirão Série A", tags: ["escalacao"], confidence: 0.8,
  },
];

describe("MockNewsProvider", () => {
  it("filtra por time", async () => {
    const p = new MockNewsProvider({ articles });
    const out = await p.fetchNews({ teams: ["Flamengo"] });
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe("2");
  });

  it("filtra por janela temporal", async () => {
    const p = new MockNewsProvider({ articles });
    const out = await p.fetchNews({ since: "2026-07-25T00:00:00Z" });
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe("2");
  });
});

describe("NewsService", () => {
  it("registra providers e mescla resultados deduplicando", async () => {
    const p1 = new MockNewsProvider({ id: "a", articles });
    const p2 = new MockNewsProvider({ id: "b", articles: [articles[0]] });
    const svc = new NewsService({ providers: [p1, p2] });
    const all = await svc.fetchAll();
    expect(all).toHaveLength(2);
  });

  it("analyzeForGame retorna estrutura completa", async () => {
    const svc = new NewsService({ providers: [new MockNewsProvider({ articles })] });
    const analysis = await svc.analyzeForGame({
      id: "flu-fla", homeTeam: "Fluminense", awayTeam: "Flamengo",
      competition: "Brasileirão Série A", date: "2026-07-25T19:00:00Z",
    });
    expect(analysis.gameId).toBe("flu-fla");
    expect(analysis.totalNews).toBeGreaterThan(0);
  });

  it("usa cache entre chamadas", async () => {
    let calls = 0;
    class Counting extends MockNewsProvider {
      async fetchNews() { calls++; return articles; }
    }
    const svc = new NewsService({ providers: [new Counting({ articles })] });
    await svc.fetchAll();
    await svc.fetchAll();
    expect(calls).toBe(1);
  });
});
