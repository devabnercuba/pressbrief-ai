// Testes simples do Coverage Engine.
// Executáveis via `node --test --experimental-strip-types src/intelligence/__tests__/coverageEngine.test.ts`
// ou por qualquer runner compatível com node:test.
import { test } from "node:test";
import assert from "node:assert/strict";
import { analyzeCoverage } from "../coverageEngine.ts";

test("clássico local com competição top gera rating Excelente", () => {
  const r = analyzeCoverage({
    competition: "Brasileirão Série A",
    homeTeam: "Flamengo",
    awayTeam: "Fluminense",
    distanceKm: 10,
    personalInterest: 90,
  });
  assert.ok(r.coverageScore >= 85, `esperado >=85, obtido ${r.coverageScore}`);
  assert.equal(r.rating, "Excelente");
  assert.ok(r.positives.length > 0);
});

test("jogo distante em competição menor derruba o score", () => {
  const r = analyzeCoverage({
    competition: "Campeonato Gaúcho",
    homeTeam: "Time X",
    awayTeam: "Time Y",
    distanceKm: 2000,
    personalInterest: 20,
  });
  assert.ok(r.coverageScore < 60, `esperado <60, obtido ${r.coverageScore}`);
  assert.ok(["Regular", "Baixo"].includes(r.rating));
  assert.ok(r.attention.length > 0);
});

test("entrada vazia não gera erro e retorna valores padrão", () => {
  const r = analyzeCoverage({});
  assert.ok(r.coverageScore >= 0 && r.coverageScore <= 100);
  assert.ok(["Excelente", "Bom", "Regular", "Baixo"].includes(r.rating));
  assert.equal(r.breakdown.length, 7);
});

test("soma dos pesos é 1 (100%)", () => {
  const r = analyzeCoverage({});
  const total = r.breakdown.reduce((a, f) => a + f.weight, 0);
  assert.ok(Math.abs(total - 1) < 1e-9, `pesos somam ${total}`);
});

test("determinístico: mesma entrada → mesma saída", () => {
  const input = { competition: "Copa do Brasil", homeTeam: "Palmeiras", awayTeam: "Corinthians", distanceKm: 25 };
  const a = analyzeCoverage(input);
  const b = analyzeCoverage(input);
  assert.equal(a.coverageScore, b.coverageScore);
  assert.equal(a.rating, b.rating);
});
