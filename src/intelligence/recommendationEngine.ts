// Recommendation Engine — combina Coverage + Editorial em uma recomendação
// final de cobertura. Determinístico e independente de UI.
import {
  RECOMMENDATION_WEIGHTS,
  confidenceFromGap,
  priorityFromScore,
  recommendationFromScore,
  type ConfidenceLabel,
  type RecommendationLabel,
} from "./recommendationRules";
import type { CoverageAnalysis, EditorialAnalysis } from "./types";

export interface RecommendationAnalysis {
  recommendation: RecommendationLabel;
  priority: 1 | 2 | 3 | 4 | 5;
  confidence: ConfidenceLabel;
  score: number; // 0..100 — score final combinado (útil para ordenação)
  summary: string;
  positiveFactors: string[];
  attentionFactors: string[];
}

const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n));

function dedupe(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const it of items) {
    if (!seen.has(it)) {
      seen.add(it);
      out.push(it);
    }
  }
  return out;
}

function buildSummary(args: {
  recommendation: RecommendationLabel;
  priority: number;
  editorial: EditorialAnalysis;
  coverage: CoverageAnalysis;
}): string {
  const { recommendation, priority, editorial, coverage } = args;
  const top = editorial.positiveFactors[0];
  const gancho = top ? ` Destaque: ${top.toLowerCase()}.` : "";
  return `${recommendation} (${priority}★). Editorial ${editorial.editorialScore} · Coverage ${coverage.coverageScore}.${gancho}`;
}

export function analyzeRecommendation(
  coverage: CoverageAnalysis,
  editorial: EditorialAnalysis,
): RecommendationAnalysis {
  const editorialScore = clamp(editorial?.editorialScore ?? 0);
  const coverageScore = clamp(coverage?.coverageScore ?? 0);

  const score = clamp(
    Math.round(
      editorialScore * RECOMMENDATION_WEIGHTS.editorial +
        coverageScore * RECOMMENDATION_WEIGHTS.coverage,
    ),
  );

  const recommendation = recommendationFromScore(score);
  const priority = priorityFromScore(score);
  const confidence = confidenceFromGap(editorialScore - coverageScore);

  const positiveFactors = dedupe([
    ...(editorial?.positiveFactors ?? []),
    ...(coverage?.positives ?? []),
  ]);

  const attentionFactors = dedupe([
    ...(editorial?.attentionFactors ?? []),
    ...(coverage?.attention ?? []),
  ]);

  const summary = buildSummary({ recommendation, priority, editorial, coverage });

  return {
    recommendation,
    priority,
    confidence,
    score,
    summary,
    positiveFactors,
    attentionFactors,
  };
}
