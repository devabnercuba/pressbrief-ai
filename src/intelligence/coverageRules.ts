// Regras e pesos do Coverage Engine — calibrados para as preferências
// do fotógrafo (Sprint MVP 03).
//
// Prioridades: 1 potencial de venda, 2 distância, 3 campeonato, 4 clubes,
// 5 história do jogo, 6 custo da viagem, 7 interesse pessoal.

export type CoverageFactorKey =
  | "salesPotential"
  | "distance"
  | "competition"
  | "clubs"
  | "history"
  | "travelCost"
  | "personalInterest";

export interface CoverageWeights {
  salesPotential: number;
  distance: number;
  competition: number;
  clubs: number;
  history: number;
  travelCost: number;
  personalInterest: number;
}

// Pesos somam 1.0, na ordem de prioridade declarada pelo usuário.
export const COVERAGE_WEIGHTS: CoverageWeights = {
  salesPotential: 0.3,
  distance: 0.2,
  competition: 0.15,
  clubs: 0.12,
  history: 0.1,
  travelCost: 0.08,
  personalInterest: 0.05,
};

// ===== Preferências do usuário =====
export const USER_PREFERENCES = {
  /** Valor mínimo aceitável de retorno por cobertura. */
  minRevenueBRL: 300,
  /** Distância máxima confortável. */
  maxDistanceKm: 300,
  /** Estados prioritários. */
  priorityStates: ["SC", "PR"] as string[],
  /** Base de operação (usada quando a distância não é informada). */
  homeState: "SC",
};

// Competições prioritárias, em ordem — usado para bônus de interesse.
export const PRIORITY_COMPETITIONS = [
  "Copa Libertadores",
  "Brasileirão Série A",
  "Copa do Brasil",
  "Brasileirão Série B",
  "Brasileirão Série C",
  "Brasileirão Série D",
];

/**
 * Tiers de competição (0..100). Valores espaçados de propósito para que
 * os scores finais NÃO fiquem todos iguais.
 */
export const COMPETITION_TIER: Record<string, number> = {
  "Copa Libertadores": 98,
  "CONMEBOL Libertadores": 98,
  Libertadores: 98,
  "Copa Sul-Americana": 82,
  "CONMEBOL Sul-Americana": 82,
  Recopa: 80,
  "Brasileirão Série A": 92,
  "Campeonato Brasileiro Série A": 92,
  "Copa do Brasil": 90,
  "Supercopa do Brasil": 84,
  "Brasileirão Série B": 76,
  "Campeonato Brasileiro Série B": 76,
  "Brasileirão Série C": 62,
  "Campeonato Brasileiro Série C": 62,
  "Brasileirão Série D": 48,
  "Campeonato Brasileiro Série D": 48,
  "Copa do Nordeste": 58,
  "Campeonato Catarinense": 60,
  "Campeonato Paranaense": 58,
  "Campeonato Paulista": 70,
  "Campeonato Carioca": 68,
  "Campeonato Gaúcho": 55,
  "Campeonato Mineiro": 58,
};

export const DEFAULT_COMPETITION_SCORE = 40;

/** Demanda de imagens por clube (0..100). */
export const CLUB_TIER: Record<string, number> = {
  Flamengo: 98,
  Corinthians: 96,
  Palmeiras: 95,
  "São Paulo": 92,
  Vasco: 90,
  Cruzeiro: 88,
  "Atlético-MG": 88,
  Fluminense: 88,
  Botafogo: 87,
  Grêmio: 86,
  Internacional: 86,
  Santos: 85,
  Bahia: 80,
  Fortaleza: 78,
  "Athletico-PR": 78,
  Sport: 74,
  Vitória: 72,
  Ceará: 72,
  Coritiba: 70,
  Náutico: 66,
  Goiás: 66,
  Chapecoense: 64,
  Avaí: 64,
  Criciúma: 62,
  Figueirense: 60,
  Paysandu: 62,
  Remo: 62,
  "Operário-PR": 58,
  Londrina: 55,
  Brusque: 52,
  Joinville: 50,
};

/** Score por divisão quando o clube não está na tabela acima. */
export const DIVISION_TIER: Record<string, number> = {
  A: 82,
  B: 66,
  C: 52,
  D: 40,
};

export const DEFAULT_CLUB_SCORE = 38;

/** Receita estimada (BRL) por cobertura, por faixa de competição. */
export const REVENUE_BASE_BRL: Record<string, number> = {
  elite: 1400,   // Libertadores / Série A / Copa do Brasil
  strong: 800,   // Sul-Americana / Série B / estaduais grandes
  medium: 420,   // Série C / estaduais médios
  low: 220,      // Série D / demais
};

/** Custo aproximado por km rodado (ida e volta). */
export const TRAVEL_COST_PER_KM = 1.9;
export const TRAVEL_FIXED_COST_BRL = 60;

export function ratingFromScore(score: number): "Excelente" | "Bom" | "Regular" | "Baixo" {
  if (score >= 85) return "Excelente";
  if (score >= 70) return "Bom";
  if (score >= 50) return "Regular";
  return "Baixo";
}
