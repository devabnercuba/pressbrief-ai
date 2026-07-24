// Testes simples do Assignment Engine.
import { test } from "node:test";
import assert from "node:assert/strict";
import { analyzeAssignment } from "../assignmentEngine";
import { analyzeCoverage } from "../coverageEngine";
import { analyzeEditorial } from "../editorialEngine";
import { ASSIGNMENT_WEIGHTS } from "../assignmentRules";

test("clássico local com ganchos fortes → Recomendado e 5 estrelas", () => {
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
  const r = analyzeAssignment(coverage, editorial);
  assert.equal(r.recommendation, "Recomendado");
  assert.ok(r.priority >= 4, `esperado >=4, obtido ${r.priority}`);
  assert.ok(r.finalScore >= 80);
});

test("jogo distante e sem ganchos → Não recomendado", () => {
  const coverage = analyzeCoverage({
    competition: "Campeonato Gaúcho",
    homeTeam: "Time X",
    awayTeam: "Time Y",
    distanceKm: 2000,
    personalInterest: 10,
  });
  const editorial = analyzeEditorial({ homeTeam: "Time X", awayTeam: "Time Y" });
  const r = analyzeAssignment(coverage, editorial);
  assert.equal(r.recommendation, "Não recomendado");
  assert.ok(r.priority <= 2);
});

test("pesos somam 1 (100%)", () => {
  const total = ASSIGNMENT_WEIGHTS.editorial + ASSIGNMENT_WEIGHTS.coverage;
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
  const a = analyzeAssignment(coverage, editorial);
  const b = analyzeAssignment(coverage, editorial);
  assert.equal(a.finalScore, b.finalScore);
  assert.equal(a.recommendation, b.recommendation);
  assert.equal(a.priority, b.priority);
  assert.equal(a.summary, b.summary);
});

test("entradas vazias não geram erro", () => {
  const coverage = analyzeCoverage({});
  const editorial = analyzeEditorial({});
  const r = analyzeAssignment(coverage, editorial);
  assert.ok(r.finalScore >= 0 && r.finalScore <= 100);
  assert.ok(["Recomendado", "Opcional", "Não recomendado"].includes(r.recommendation));
  assert.ok(r.priority >= 1 && r.priority <= 5);
});
