// AI Editorial Assistant — tipos públicos.
// Isolados de qualquer provedor específico (OpenAI, Gemini, Claude, local).

import type { AssignmentAnalysis } from "@/intelligence/assignmentEngine";
import type { CoverageAnalysis, EditorialAnalysis } from "@/intelligence/types";
import type { GameNewsAnalysis } from "@/news/newsTypes";
import type { Briefing, Game } from "@/types";

/** Entrada consolidada usada pelo Prompt Builder. */
export interface AIBriefInput {
  game: Game;
  coverage?: CoverageAnalysis;
  editorial?: EditorialAnalysis;
  assignment?: AssignmentAnalysis;
  news?: GameNewsAnalysis;
  brief?: Briefing;
}

export interface AIPriorityPlayer {
  name: string;
  team?: string;
  reason: string;
}

export interface AIRecommendedShot {
  title: string;
  moment?: string;
  reason: string;
}

export interface AIChecklistItem {
  label: string;
  reason: string;
}

export interface AIBrief {
  mission: string;
  executiveSummary: string;
  photoChecklist: AIChecklistItem[];
  editorialTopics: string[];
  priorityPlayers: AIPriorityPlayer[];
  alerts: string[];
  hiddenOpportunities: string[];
  recommendedShots: AIRecommendedShot[];
  confidence: number; // 0..1
  /** Metadados de execução (não vêm do modelo). */
  meta?: {
    provider: string;
    model: string;
    cached: boolean;
    generatedAt: string;
    latencyMs?: number;
  };
}

/** Mensagem genérica enviada a qualquer provedor. */
export interface AIMessage {
  role: "system" | "user";
  content: string;
}

export interface AIPrompt {
  system: string;
  user: string;
  messages: AIMessage[];
}

export interface AICompletionOptions {
  temperature?: number;
  maxTokens?: number;
  json?: boolean;
}

export interface AICompletionResult {
  text: string;
  model: string;
  provider: string;
}
