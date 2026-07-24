// Assignment Engine — classifica cada jogo combinando Coverage + Editorial
// numa nota final para priorização automática. Determinístico e sem UI.
import {
  ASSIGNMENT_WEIGHTS,
  ASSIGNMENT_SYNERGY_BONUS,
  ASSIGNMENT_SYNERGY_THRESHOLD,
  ASSIGNMENT_PENALTY,
  ASSIGNMENT_PENALTY_THRESHOLD,
  assignmentRecommendationFromScore,
  assignmentPriorityFromScore,
  type AssignmentRecommendation,
} from "./assignmentRules";
import type { CoverageAnalysis, EditorialAnalysis } from "./types";

export interface AssignmentAnalysis {
  finalScore: number; // 0..100
  priority: 1 | 2 | 3 | 4 | 5;
  recommendation: AssignmentRecommendation;
  summary: string;
}

const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n));

function buildSummary(args: {
  finalScore: number;
  recommendation: AssignmentRecommendation;
  editorial: EditorialAnalysis;
  coverage: CoverageAnalysis;
}): string {
  const { finalScore, recommendation, editorial, coverage } = args;
  const top = editorial?.positiveFactors?.[0];
  const hook = top ? ` Destaque: ${top.toLowerCase()}.` : "";
  return `${recommendation} · Score ${finalScore}. Editorial ${editorial?.editorialScore ?? 0} · Coverage ${coverage?.coverageScore ?? 0}.${hook}`;
}

export function analyzeAssignment(
  coverage: CoverageAnalysis,
  editorial: EditorialAnalysis,
): AssignmentAnalysis {
  const editorialScore = clamp(editorial?.editorialScore ?? 0);
  const coverageScore = clamp(coverage?.coverageScore ?? 0);

  let raw =
    editorialScore * ASSIGNMENT_WEIGHTS.editorial +
    coverageScore * ASSIGNMENT_WEIGHTS.coverage;

  if (editorialScore >= ASSIGNMENT_SYNERGY_THRESHOLD && coverageScore >= ASSIGNMENT_SYNERGY_THRESHOLD) {
    raw += ASSIGNMENT_SYNERGY_BONUS;
  }
  if (editorialScore <= ASSIGNMENT_PENALTY_THRESHOLD && coverageScore <= ASSIGNMENT_PENALTY_THRESHOLD) {
    raw -= ASSIGNMENT_PENALTY;
  }

  const finalScore = clamp(Math.round(raw));
  const recommendation = assignmentRecommendationFromScore(finalScore);
  const priority = assignmentPriorityFromScore(finalScore);
  const summary = buildSummary({ finalScore, recommendation, editorial, coverage });

  return { finalScore, priority, recommendation, summary };
}
