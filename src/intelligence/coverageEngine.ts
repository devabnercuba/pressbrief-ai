// Coverage Engine — módulo determinístico e independente de UI.
// Recebe um objeto com dados de partida e devolve uma CoverageAnalysis.
//
// Regras e pesos vivem em ./coverageRules.ts para permitir tuning sem
// alterar o algoritmo.
import {
  CLUB_TIER,
  COMPETITION_TIER,
  COVERAGE_WEIGHTS,
  DISTANCE_TIERS,
  TRAVEL_COST_PER_KM,
  TRAVEL_COST_TIERS,
  ratingFromScore,
} from "./coverageRules";
import type {
  CoverageAnalysis,
  CoverageFactorBreakdown,
  CoverageInput,
} from "./types";

const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n));

function scoreDistance(km?: number): number {
  if (km == null || Number.isNaN(km)) return 60; // padrão neutro
  if (km <= DISTANCE_TIERS.local) return 100;
  if (km <= DISTANCE_TIERS.regional) return 70;
  if (km <= DISTANCE_TIERS.interstate) return 40;
  return 15;
}

function scoreTravelCost(cost?: number): number {
  if (cost == null || Number.isNaN(cost)) return 60;
  if (cost <= TRAVEL_COST_TIERS.cheap) return 100;
  if (cost <= TRAVEL_COST_TIERS.medium) return 70;
  if (cost <= TRAVEL_COST_TIERS.high) return 40;
  return 15;
}

function scoreCompetition(name?: string): number {
  if (!name) return 50;
  return COMPETITION_TIER[name] ?? 55;
}

function scoreClubs(home?: string, away?: string): number {
  const a = home ? CLUB_TIER[home] ?? 50 : 50;
  const b = away ? CLUB_TIER[away] ?? 50 : 50;
  return Math.round((a + b) / 2);
}

function scoreSalesPotential(input: CoverageInput, clubs: number, competition: number): number {
  if (input.salesPotential != null) return clamp(input.salesPotential);
  if (input.editorialScore != null) return clamp(input.editorialScore);
  // Fallback: derivado de clubes + competição.
  return Math.round(clubs * 0.6 + competition * 0.4);
}

function scoreHistory(input: CoverageInput, clubs: number): number {
  if (input.historyScore != null) return clamp(input.historyScore);
  // Clássicos (dois clubes tier alto) puxam histórico pra cima.
  return clubs >= 85 ? 90 : clubs >= 70 ? 70 : 50;
}

function scorePersonalInterest(v?: number): number {
  if (v == null) return 60;
  return clamp(v);
}

export function analyzeCoverage(input: CoverageInput): CoverageAnalysis {
  const safe: CoverageInput = input ?? {};

  const competitionScore = scoreCompetition(safe.competition);
  const clubsScore = scoreClubs(safe.homeTeam, safe.awayTeam);
  const distanceScore = scoreDistance(safe.distanceKm);
  const travelCost = safe.travelCostBRL ?? (safe.distanceKm != null ? safe.distanceKm * TRAVEL_COST_PER_KM : undefined);
  const travelCostScore = scoreTravelCost(travelCost);
  const salesScore = scoreSalesPotential(safe, clubsScore, competitionScore);
  const historyScore = scoreHistory(safe, clubsScore);
  const interestScore = scorePersonalInterest(safe.personalInterest);

  const breakdown: CoverageFactorBreakdown[] = [
    { key: "salesPotential", label: "Potencial de venda", weight: COVERAGE_WEIGHTS.salesPotential, score: salesScore, contribution: salesScore * COVERAGE_WEIGHTS.salesPotential },
    { key: "distance", label: "Distância", weight: COVERAGE_WEIGHTS.distance, score: distanceScore, contribution: distanceScore * COVERAGE_WEIGHTS.distance },
    { key: "travelCost", label: "Custo da viagem", weight: COVERAGE_WEIGHTS.travelCost, score: travelCostScore, contribution: travelCostScore * COVERAGE_WEIGHTS.travelCost },
    { key: "personalInterest", label: "Interesse pessoal", weight: COVERAGE_WEIGHTS.personalInterest, score: interestScore, contribution: interestScore * COVERAGE_WEIGHTS.personalInterest },
    { key: "competition", label: "Competição", weight: COVERAGE_WEIGHTS.competition, score: competitionScore, contribution: competitionScore * COVERAGE_WEIGHTS.competition },
    { key: "history", label: "História do jogo", weight: COVERAGE_WEIGHTS.history, score: historyScore, contribution: historyScore * COVERAGE_WEIGHTS.history },
    { key: "clubs", label: "Clubes envolvidos", weight: COVERAGE_WEIGHTS.clubs, score: clubsScore, contribution: clubsScore * COVERAGE_WEIGHTS.clubs },
  ];

  const coverageScore = clamp(Math.round(breakdown.reduce((acc, f) => acc + f.contribution, 0)));
  const rating = ratingFromScore(coverageScore);

  const positives: string[] = [];
  const attention: string[] = [];

  for (const f of breakdown) {
    if (f.score >= 85) positives.push(`${f.label} favorece a cobertura (${f.score})`);
    else if (f.score < 50) attention.push(`${f.label} desfavorável (${f.score})`);
  }

  if (positives.length === 0) positives.push("Nenhum fator excepcional — jogo dentro da média.");
  if (attention.length === 0) attention.push("Sem pontos críticos identificados.");

  return { coverageScore, rating, positives, attention, breakdown };
}

// Helper para consumir diretamente objetos `Game` do domínio de UI sem
// acoplar o engine ao tipo. O caller passa o Game e o mapeamento é feito aqui.
export function analyzeCoverageFromGame(game: {
  competition?: string;
  homeTeam?: string;
  awayTeam?: string;
  distanceKm?: number;
  editorialScore?: number;
}): CoverageAnalysis {
  return analyzeCoverage({
    competition: game.competition,
    homeTeam: game.homeTeam,
    awayTeam: game.awayTeam,
    distanceKm: game.distanceKm,
    editorialScore: game.editorialScore,
  });
}
