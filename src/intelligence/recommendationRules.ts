// Regras e pesos configuráveis do Recommendation Engine.
// Alterar aqui NÃO deve exigir mudanças no algoritmo (recommendationEngine.ts).

export interface RecommendationWeights {
  editorial: number; // peso do Editorial Score no score final
  coverage: number;  // peso do Coverage Score no score final
}

// Editorial tem prioridade porque representa o valor narrativo/comercial da
// partida; Coverage modula a viabilidade logística. Somam 1.0.
export const RECOMMENDATION_WEIGHTS: RecommendationWeights = {
  editorial: 0.6,
  coverage: 0.4,
};

// Faixas do score final (0..100) → recomendação.
export const RECOMMENDATION_THRESHOLDS = {
  recommended: 70,   // >= 70 → Recomendado
  optional: 50,      // >= 50 → Opcional; abaixo → Não recomendado
};

// Faixas do score final → priority em estrelas (1..5).
export const PRIORITY_THRESHOLDS: ReadonlyArray<{ min: number; stars: 1 | 2 | 3 | 4 | 5 }> = [
  { min: 85, stars: 5 },
  { min: 72, stars: 4 },
  { min: 58, stars: 3 },
  { min: 40, stars: 2 },
  { min: 0, stars: 1 },
];

// Confiança baseada no "gap" entre Editorial e Coverage: sinais alinhados =
// alta confiança; sinais divergentes = baixa confiança.
export const CONFIDENCE_GAP_THRESHOLDS = {
  high: 15,   // diferença <= 15 → Alta
  medium: 30, // diferença <= 30 → Média; acima → Baixa
};

export type RecommendationLabel = "Recomendado" | "Opcional" | "Não recomendado";
export type ConfidenceLabel = "Alta" | "Média" | "Baixa";

export function recommendationFromScore(score: number): RecommendationLabel {
  if (score >= RECOMMENDATION_THRESHOLDS.recommended) return "Recomendado";
  if (score >= RECOMMENDATION_THRESHOLDS.optional) return "Opcional";
  return "Não recomendado";
}

export function priorityFromScore(score: number): 1 | 2 | 3 | 4 | 5 {
  for (const tier of PRIORITY_THRESHOLDS) {
    if (score >= tier.min) return tier.stars;
  }
  return 1;
}

export function confidenceFromGap(gap: number): ConfidenceLabel {
  const abs = Math.abs(gap);
  if (abs <= CONFIDENCE_GAP_THRESHOLDS.high) return "Alta";
  if (abs <= CONFIDENCE_GAP_THRESHOLDS.medium) return "Média";
  return "Baixa";
}
