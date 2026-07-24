// Testes simples do Editorial Engine.
import { test } from "node:test";
import assert from "node:assert/strict";
import { analyzeEditorial, analyzeEditorialFromGame } from "../editorialEngine";
import { EDITORIAL_WEIGHTS } from "../editorialRules";

test("clássico com briga pelo título gera rating alto", () => {
  const r = analyzeEditorial({
    competition: "Brasileirão Série A",
    homeTeam: "Flamengo",
    awayTeam: "Fluminense",
    titleRace: true,
    derby: true,
    playerInForm: true,
  });
  assert.ok(r.editorialScore >= 40, `esperado >=40, obtido ${r.editorialScore}`);
  assert.ok(r.positiveFactors.includes("Clássico"));
  assert.ok(r.positiveFactors.includes("Briga pelo título"));
  assert.ok(r.summary.length > 0);
});

test("crise + técnico pressionado aparecem em attentionFactors", () => {
  const r = analyzeEditorial({
    homeTeam: "A",
    awayTeam: "B",
    clubCrisis: true,
    coachPressure: true,
  });
  assert.ok(r.attentionFactors.includes("Crise no clube"));
  assert.ok(r.attentionFactors.includes("Técnico pressionado"));
});

test("entrada vazia não gera erro e retorna score baixo", () => {
  const r = analyzeEditorial({});
  assert.ok(r.editorialScore >= 0 && r.editorialScore <= 100);
  assert.equal(r.editorialScore, 0);
  assert.equal(r.rating, "Baixo");
  assert.equal(r.breakdown.length, 10);
});

test("soma dos pesos é 1 (100%)", () => {
  const total = Object.values(EDITORIAL_WEIGHTS).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(total - 1) < 1e-9, `pesos somam ${total}`);
});

test("determinístico: mesma entrada → mesma saída", () => {
  const input = { homeTeam: "Palmeiras", awayTeam: "Corinthians", derby: true, titleRace: true };
  const a = analyzeEditorial(input);
  const b = analyzeEditorial(input);
  assert.equal(a.editorialScore, b.editorialScore);
  assert.equal(a.rating, b.rating);
  assert.deepEqual(a.positiveFactors, b.positiveFactors);
});

test("infere clássico conhecido a partir de Game (Grêmio x Internacional)", () => {
  const r = analyzeEditorialFromGame({
    competition: "Brasileirão Série A",
    homeTeam: "Grêmio",
    awayTeam: "Internacional",
  });
  assert.ok(r.positiveFactors.includes("Clássico"));
});

test("infere fatores a partir de reasons/summary via keywords", () => {
  const r = analyzeEditorialFromGame({
    homeTeam: "X",
    awayTeam: "Y",
    summary: "Jogo decisivo na briga pelo título com artilheiro em grande fase.",
    reasons: ["Time em crise após protesto da torcida"],
  });
  assert.ok(r.positiveFactors.includes("Briga pelo título"));
  assert.ok(r.positiveFactors.includes("Jogador em grande fase"));
  assert.ok(r.attentionFactors.includes("Crise no clube"));
});
