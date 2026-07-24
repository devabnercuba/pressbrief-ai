// Regras e pesos configuráveis do Coverage Engine.
// Alterar aqui NÃO deve exigir mudanças no algoritmo (coverageEngine.ts).

export type CoverageFactorKey =
  | "salesPotential"
  | "distance"
  | "travelCost"
  | "personalInterest"
  | "competition"
  | "history"
  | "clubs";

export interface CoverageWeights {
  salesPotential: number;   // 35%
  distance: number;         // 20%
  travelCost: number;       // 15%
  personalInterest: number; // 10%
  competition: number;      // 10%
  history: number;          // 5%
  clubs: number;            // 5%
}

export const COVERAGE_WEIGHTS: CoverageWeights = {
  salesPotential: 0.35,
  distance: 0.2,
  travelCost: 0.15,
  personalInterest: 0.1,
  competition: 0.1,
  history: 0.05,
  clubs: 0.05,
};

// Competições com maior valor editorial/venda (0..100).
export const COMPETITION_TIER: Record<string, number> = {
  "Brasileirão Série A": 95,
  "Copa do Brasil": 90,
  "Copa Libertadores": 98,
  "Copa Sul-Americana": 80,
  "Campeonato Gaúcho": 60,
  "Campeonato Paulista": 70,
  "Campeonato Carioca": 70,
  "Campeonato Mineiro": 65,
};

// Clubes com maior demanda de imagens (0..100).
export const CLUB_TIER: Record<string, number> = {
  Flamengo: 98,
  Fluminense: 88,
  Palmeiras: 95,
  Corinthians: 95,
  "São Paulo": 90,
  Santos: 82,
  "Atlético-MG": 85,
  Cruzeiro: 82,
  Grêmio: 80,
  Internacional: 80,
};

// Faixas de distância (km) usadas para pontuar deslocamento.
export const DISTANCE_TIERS = {
  local: 30,      // 100
  regional: 150,  // 70
  interstate: 500, // 40
  // acima: 15
};

// Custo aproximado de viagem por km (BRL). Usado quando `travelCostBRL`
// não é fornecido explicitamente no Game.
export const TRAVEL_COST_PER_KM = 2.5;

// Faixas de custo (BRL) para score.
export const TRAVEL_COST_TIERS = {
  cheap: 150,   // 100
  medium: 600,  // 70
  high: 1500,   // 40
  // acima: 15
};

// Rating final baseado no score.
export function ratingFromScore(score: number): "Excelente" | "Bom" | "Regular" | "Baixo" {
  if (score >= 85) return "Excelente";
  if (score >= 70) return "Bom";
  if (score >= 50) return "Regular";
  return "Baixo";
}
