// Tipos públicos do PressBrief Intelligence Engine (PIE).

export type CoverageRating = "Excelente" | "Bom" | "Regular" | "Baixo";

export interface CoverageFactorBreakdown {
  key: string;
  label: string;
  weight: number;   // 0..1
  score: number;    // 0..100
  contribution: number; // weight * score
}

export interface CoverageAnalysis {
  coverageScore: number; // 0..100
  rating: CoverageRating;
  positives: string[];
  attention: string[];
  breakdown: CoverageFactorBreakdown[];
}

// Entrada mínima esperada pelo engine. É intencionalmente desacoplada
// da interface `Game` para permitir uso em outros contextos (backoffice,
// testes, jobs) sem depender do domínio de UI.
export interface CoverageInput {
  competition?: string;
  homeTeam?: string;
  awayTeam?: string;
  distanceKm?: number;
  travelCostBRL?: number;
  personalInterest?: number; // 0..100
  salesPotential?: number;   // 0..100
  historyScore?: number;     // 0..100
  editorialScore?: number;   // 0..100 (fallback p/ salesPotential)
}
