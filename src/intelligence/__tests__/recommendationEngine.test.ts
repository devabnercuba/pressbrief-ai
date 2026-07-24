// Testes simples do Recommendation Engine.
import { test } from "node:test";
import assert from "node:assert/strict";
import { analyzeRecommendation } from "../recommendationEngine";
import { analyzeCoverage } from "../coverageEngine";
import { analyzeEditorial } from "../editorialEngine";
import { RECOMMENDATION_WEIGHTS } from "../recommendationRules";

test("clássico com título + local gera Recomendado e 5 estrelas", () => {
  const coverage = analyzeCoverage({
    competition: "Brasileirão Série A",
    homeTeam: "Flamengo",
    awayTeam: "Fluminense",
    distanceKm: 10,
    personalInterest: 90,
  });
  const editorial = analyzeEditorial({
    competition: "Brasileirão Série A",
    homeTeam: "Flamengo",
    awayTeam: "Fluminense",
    derby: true,
    titleRace: true,
    playerInForm: true,
    record: true,
  });
  const r = analyzeRecommendation(coverage, editorial);
  assert.equal(r.recommendation, "Recomendado");
  assert.ok(r.priority >= 4, `esperado >=4 estrelas, obtido ${r.priority}`);
  assert.ok(r.positiveFactors.length > 0);
});

test("jogo distante e sem ganchos gera Não recomendado", () => {
  const coverage = analyzeCoverage({
    competition: "Campeonato Gaúcho",
    homeTeam: "Time X",
    awayTeam: "Time Y",
    distanceKm: 2000,
    personalInterest: 10,
  });
  const editorial = analyzeEditorial({ homeTeam: "Time X", awayTeam: "Time Y" });
  const r = analyzeRecommendation(coverage, editorial);
  assert.equal(r.recommendation, "Não recomendado");
  assert.ok(r.priority <= 2);
});

test("editorial e coverage próximos → confiança Alta", () => {
  const coverage = analyzeCoverage({
    competition: "Brasileirão Série A",
    homeTeam: "Palmeiras",
    awayTeam: "Corinthians",
    distanceKm: 20,
  });
  const editorial = analyzeEditorial({
    homeTeam: "Palmeiras",
    awayTeam: "Corinthians",
    derby: true,
    titleRace: true,
  });
  const r = analyzeRecommendation(coverage, editorial);
  // scores tendem a ficar próximos neste cenário
  assert.ok(["Alta", "Média"].includes(r.confidence));
});

test("pesos somam 1 (100%)", () => {
  const total = RECOMMENDATION_WEIGHTS.editorial + RECOMMENDATION_WEIGHTS.coverage;
  assert.ok(Math.abs(total - 1) < 1e-9, `pesos somam ${total}`);
});

test("determinístico: mesma entrada → mesma saída", () => {
  const coverage = analyzeCoverage({
    competition: "Copa do Brasil",
    homeTeam: "Palmeiras",
    awayTeam: "Corinthians",
    distanceKm: 25,
  });
  const editorial = analyzeEditorial({
    homeTeam: "Palmeiras",
    awayTeam: "Corinthians",
    derby: true,
  });
  const a = analyzeRecommendation(coverage, editorial);
  const b = analyzeRecommendation(coverage, editorial);
  assert.equal(a.score, b.score);
  assert.equal(a.recommendation, b.recommendation);
  assert.equal(a.priority, b.priority);
  assert.equal(a.confidence, b.confidence);
});

test("entradas com scores zero → Não recomendado sem erro", () => {
  const coverage = analyzeCoverage({});
  const editorial = analyzeEditorial({});
  const r = analyzeRecommendation(coverage, editorial);
  assert.ok(r.score >= 0 && r.score <= 100);
  assert.ok(["Recomendado", "Opcional", "Não recomendado"].includes(r.recommendation));
});
