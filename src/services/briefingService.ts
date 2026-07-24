// Briefing service — monta o briefing a partir dos dados de jogo.
// Encapsula a lógica de análise (Coverage/Editorial) para que as páginas
// consumam objetos já tipados e prontos para renderização.
import { getGameById } from "./gameService";
import type { Briefing, CoverageAnalysis, EditorialAnalysis } from "@/types";

function toLevel(score: number): "Alta" | "Média" | "Baixa" {
  if (score >= 85) return "Alta";
  if (score >= 65) return "Média";
  return "Baixa";
}

export function buildCoverageAnalysis(score: number, reasons: string[]): CoverageAnalysis {
  return { score, level: toLevel(score), reasons };
}

export function buildEditorialAnalysis(score: number, highlights: string[]): EditorialAnalysis {
  return { score, level: toLevel(score), highlights };
}

export function getBriefingByGameId(gameId: string): Briefing | undefined {
  const game = getGameById(gameId);
  if (!game) return undefined;

  return {
    gameId: game.id,
    summary: game.summary,
    pautas: game.pautas,
    priorityPlayers: game.priorityPlayers,
    mustShoot: game.mustShoot,
    checklist: game.checklist,
    shotList: game.shotList,
    coverage: buildCoverageAnalysis(game.coverageScore, game.reasons),
    editorial: buildEditorialAnalysis(
      game.editorialScore,
      game.pautas.map((p) => p.title),
    ),
  };
}
