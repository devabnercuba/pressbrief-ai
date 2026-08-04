// Coverage Engine — determinístico, independente de UI.
// Calibrado (Sprint MVP 03) para gerar notas realmente distintas e
// explicar claramente o motivo de cada nota.
import {
  CLUB_TIER,
  COMPETITION_TIER,
  COVERAGE_WEIGHTS,
  DEFAULT_CLUB_SCORE,
  DEFAULT_COMPETITION_SCORE,
  DIVISION_TIER,
  PRIORITY_COMPETITIONS,
  REVENUE_BASE_BRL,
  TRAVEL_COST_PER_KM,
  TRAVEL_FIXED_COST_BRL,
  USER_PREFERENCES,
  ratingFromScore,
} from "./coverageRules";
import type {
  CoverageAnalysis,
  CoverageFactorBreakdown,
  CoverageInput,
} from "./types";
import { matchTeam } from "@/data/teamDatabase";
import { KNOWN_DERBIES } from "./editorialRules";

const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n));
const round = (n: number) => Math.round(n * 10) / 10;

// ---------- Competição ----------
function competitionScore(name?: string): number {
  if (!name) return DEFAULT_COMPETITION_SCORE;
  const direct = COMPETITION_TIER[name];
  if (direct != null) return direct;
  const lower = name.toLowerCase();
  const hit = Object.entries(COMPETITION_TIER).find(([k]) => lower.includes(k.toLowerCase()));
  if (hit) return hit[1];
  if (lower.includes("série a") || lower.includes("serie a")) return 92;
  if (lower.includes("série b") || lower.includes("serie b")) return 76;
  if (lower.includes("série c") || lower.includes("serie c")) return 62;
  if (lower.includes("série d") || lower.includes("serie d")) return 48;
  if (lower.includes("libertadores")) return 98;
  if (lower.includes("sul-americana")) return 82;
  if (lower.includes("copa do brasil")) return 90;
  return DEFAULT_COMPETITION_SCORE;
}

function isPriorityCompetition(name?: string): boolean {
  if (!name) return false;
  const lower = name.toLowerCase();
  return PRIORITY_COMPETITIONS.some((c) => lower.includes(c.toLowerCase().replace("brasileirão ", "")));
}

// ---------- Clubes ----------
function clubScore(name?: string): number {
  if (!name) return DEFAULT_CLUB_SCORE;
  const direct = CLUB_TIER[name];
  if (direct != null) return direct;
  const match = matchTeam(name);
  if (match) {
    const byName = CLUB_TIER[match.team.shortName];
    if (byName != null) return byName;
    return DIVISION_TIER[match.team.division ?? "D"] ?? DEFAULT_CLUB_SCORE;
  }
  return DEFAULT_CLUB_SCORE;
}

function isDerby(home?: string, away?: string): boolean {
  if (!home || !away) return false;
  return KNOWN_DERBIES.some(([a, b]) => (a === home && b === away) || (a === away && b === home));
}

// ---------- Distância / custo ----------
function distanceScore(km?: number): number {
  if (km == null || Number.isNaN(km) || km < 0) return 55;
  const max = USER_PREFERENCES.maxDistanceKm;
  if (km <= max) return clamp(100 - (km / max) * 55); // 100 → 45
  return clamp(45 - ((km - max) / max) * 30, 5); // decai depois do limite
}

function estimateTravelCost(km?: number, provided?: number): number | undefined {
  if (provided != null) return provided;
  if (km == null || Number.isNaN(km)) return undefined;
  return TRAVEL_FIXED_COST_BRL + km * 2 * TRAVEL_COST_PER_KM;
}

function travelCostScore(cost?: number, revenue?: number): number {
  if (cost == null) return 55;
  const net = (revenue ?? USER_PREFERENCES.minRevenueBRL) - cost;
  if (net <= 0) return clamp(10 + (revenue ? (revenue / Math.max(cost, 1)) * 20 : 0), 5, 40);
  const ratio = net / Math.max(revenue ?? 1, 1);
  return clamp(40 + ratio * 60);
}

// ---------- Receita / venda ----------
function revenueBand(comp: number): number {
  if (comp >= 88) return REVENUE_BASE_BRL.elite;
  if (comp >= 70) return REVENUE_BASE_BRL.strong;
  if (comp >= 55) return REVENUE_BASE_BRL.medium;
  return REVENUE_BASE_BRL.low;
}

function estimateRevenue(input: CoverageInput, comp: number, clubs: number, derby: boolean): number {
  if (input.expectedRevenueBRL != null) return input.expectedRevenueBRL;
  const base = revenueBand(comp);
  const clubFactor = 0.55 + (clubs / 100) * 0.9; // 0.55 .. 1.45
  const derbyFactor = derby ? 1.25 : 1;
  return Math.round(base * clubFactor * derbyFactor);
}

function salesScore(revenue: number, input: CoverageInput): number {
  if (input.salesPotential != null) return clamp(input.salesPotential);
  const min = USER_PREFERENCES.minRevenueBRL;
  if (revenue <= min * 0.5) return clamp(12 + (revenue / (min * 0.5)) * 10);
  if (revenue <= min) return clamp(22 + ((revenue - min * 0.5) / (min * 0.5)) * 18); // 22..40
  // Acima do mínimo cresce logaritmicamente até 100.
  const ratio = revenue / min;
  return clamp(40 + Math.log2(ratio) * 22);
}

// ---------- Interesse pessoal / história ----------
function personalInterestScore(input: CoverageInput, comp: number, clubs: number): number {
  if (input.personalInterest != null) return clamp(input.personalInterest);
  let score = 45;
  if (input.state && USER_PREFERENCES.priorityStates.includes(input.state)) score += 30;
  if (isPriorityCompetition(input.competition)) score += 12;
  if (clubs >= 80) score += 8;
  if (comp >= 90) score += 5;
  return clamp(score);
}

function historyScore(input: CoverageInput, clubs: number, derby: boolean): number {
  if (input.historyScore != null) return clamp(input.historyScore);
  let score = derby ? 92 : 45;
  if (!derby && clubs >= 85) score = 72;
  else if (!derby && clubs >= 70) score = 60;
  if (input.editorialScore != null) score = clamp(score * 0.6 + input.editorialScore * 0.4);
  return clamp(score);
}

export function analyzeCoverage(input: CoverageInput): CoverageAnalysis {
  const safe: CoverageInput = input ?? {};

  const comp = competitionScore(safe.competition);
  const home = clubScore(safe.homeTeam);
  const away = clubScore(safe.awayTeam);
  const clubs = Math.round(home * 0.55 + away * 0.45);
  const derby = safe.derby ?? isDerby(safe.homeTeam, safe.awayTeam);

  const distance = distanceScore(safe.distanceKm);
  const revenue = estimateRevenue(safe, comp, clubs, derby);
  const cost = estimateTravelCost(safe.distanceKm, safe.travelCostBRL);
  const costScore = travelCostScore(cost, revenue);
  const sales = salesScore(revenue, safe);
  const interest = personalInterestScore(safe, comp, clubs);
  const history = historyScore(safe, clubs, derby);

  const breakdown: CoverageFactorBreakdown[] = [
    { key: "salesPotential", label: "Potencial de venda", weight: COVERAGE_WEIGHTS.salesPotential, score: Math.round(sales), contribution: 0 },
    { key: "distance", label: "Distância", weight: COVERAGE_WEIGHTS.distance, score: Math.round(distance), contribution: 0 },
    { key: "competition", label: "Campeonato", weight: COVERAGE_WEIGHTS.competition, score: Math.round(comp), contribution: 0 },
    { key: "clubs", label: "Clubes envolvidos", weight: COVERAGE_WEIGHTS.clubs, score: clubs, contribution: 0 },
    { key: "history", label: "História do jogo", weight: COVERAGE_WEIGHTS.history, score: Math.round(history), contribution: 0 },
    { key: "travelCost", label: "Custo da viagem", weight: COVERAGE_WEIGHTS.travelCost, score: Math.round(costScore), contribution: 0 },
    { key: "personalInterest", label: "Interesse pessoal", weight: COVERAGE_WEIGHTS.personalInterest, score: Math.round(interest), contribution: 0 },
  ].map((f) => ({ ...f, contribution: round(f.weight * f.score) }));

  const coverageScore = clamp(Math.round(breakdown.reduce((acc, f) => acc + f.weight * f.score, 0)));
  const rating = ratingFromScore(coverageScore);

  // ---------- Motivos explícitos ----------
  const positives: string[] = [];
  const attention: string[] = [];

  if (comp >= 88) positives.push(`+ Campeonato de alto valor (${safe.competition ?? "competição top"})`);
  else if (comp <= 50) attention.push(`- Campeonato de baixa procura (${safe.competition ?? "competição menor"})`);

  if (clubs >= 80) positives.push("+ Clubes de grande demanda de imagens");
  else if (clubs <= 45) attention.push("- Clubes com pouca procura editorial");

  if (derby) positives.push("+ Clássico com forte apelo histórico");

  if (safe.distanceKm != null) {
    if (safe.distanceKm <= 80) positives.push(`+ Deslocamento curto (${Math.round(safe.distanceKm)} km)`);
    else if (safe.distanceKm > USER_PREFERENCES.maxDistanceKm)
      attention.push(`- Longa distância (${Math.round(safe.distanceKm)} km, acima dos ${USER_PREFERENCES.maxDistanceKm} km preferidos)`);
  }

  if (safe.state && USER_PREFERENCES.priorityStates.includes(safe.state))
    positives.push(`+ Estado prioritário (${safe.state})`);

  if (revenue >= USER_PREFERENCES.minRevenueBRL * 2)
    positives.push(`+ Alto retorno estimado (~R$ ${revenue})`);
  else if (revenue < USER_PREFERENCES.minRevenueBRL)
    attention.push(`- Baixo retorno financeiro (~R$ ${revenue}, abaixo de R$ ${USER_PREFERENCES.minRevenueBRL})`);

  if (cost != null && revenue - cost < 0)
    attention.push(`- Custo de viagem (~R$ ${Math.round(cost)}) supera o retorno estimado`);

  if (positives.length === 0) positives.push("+ Cobertura dentro da média, sem destaques fortes");
  if (attention.length === 0) attention.push("- Sem pontos críticos identificados");

  return { coverageScore, rating, positives, attention, breakdown, estimatedRevenueBRL: revenue, estimatedCostBRL: cost != null ? Math.round(cost) : undefined };
}

/** Helper para consumir objetos `Game` do domínio de UI. */
export function analyzeCoverageFromGame(game: {
  competition?: string;
  homeTeam?: string;
  awayTeam?: string;
  distanceKm?: number;
  state?: string;
  city?: string;
  editorialScore?: number;
}): CoverageAnalysis {
  return analyzeCoverage({
    competition: game.competition,
    homeTeam: game.homeTeam,
    awayTeam: game.awayTeam,
    distanceKm: game.distanceKm && game.distanceKm > 0 ? game.distanceKm : undefined,
    state: game.state && game.state !== "Não informado" ? game.state : undefined,
    editorialScore: game.editorialScore,
  });
}
