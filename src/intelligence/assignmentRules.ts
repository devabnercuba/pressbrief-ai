// Regras e pesos configuráveis do Assignment Engine.
// Alterar aqui NÃO deve exigir mudanças no algoritmo (assignmentEngine.ts).

export interface AssignmentWeights {
  editorial: number; // peso do Editorial Score
  coverage: number;  // peso do Coverage Score
}

// Editorial tem prioridade ligeiramente maior por representar o valor
// narrativo/comercial da pauta. Somam 1.0.
export const ASSIGNMENT_WEIGHTS: AssignmentWeights = {
  editorial: 0.55,
  coverage: 0.45,
};

// Bônus aplicado quando ambos os motores concordam em pontuação alta.
export const ASSIGNMENT_SYNERGY_BONUS = 5;
export const ASSIGNMENT_SYNERGY_THRESHOLD = 75;

// Penalidade aplicada quando ambos os motores estão muito baixos.
export const ASSIGNMENT_PENALTY = 5;
export const ASSIGNMENT_PENALTY_THRESHOLD = 35;

// Faixas do finalScore (0..100) → recomendação.
export const ASSIGNMENT_THRESHOLDS = {
  recommended: 70,
  optional: 50,
};

// Faixas do finalScore → priority em estrelas (1..5).
export const ASSIGNMENT_PRIORITY_THRESHOLDS: ReadonlyArray<{ min: number; stars: 1 | 2 | 3 | 4 | 5 }> = [
  { min: 85, stars: 5 },
  { min: 72, stars: 4 },
  { min: 58, stars: 3 },
  { min: 40, stars: 2 },
  { min: 0, stars: 1 },
];

export type AssignmentRecommendation = "Recomendado" | "Opcional" | "Não recomendado";

export function assignmentRecommendationFromScore(score: number): AssignmentRecommendation {
  if (score >= ASSIGNMENT_THRESHOLDS.recommended) return "Recomendado";
  if (score >= ASSIGNMENT_THRESHOLDS.optional) return "Opcional";
  return "Não recomendado";
}

export function assignmentPriorityFromScore(score: number): 1 | 2 | 3 | 4 | 5 {
  for (const tier of ASSIGNMENT_PRIORITY_THRESHOLDS) {
    if (score >= tier.min) return tier.stars;
  }
  return 1;
}
