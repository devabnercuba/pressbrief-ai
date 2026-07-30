// Camada server-only do Assistente Editorial de IA.
// Consolida as análises dos engines e delega para o AI Service.
// A chave da IA nunca sai daqui.

import { analyzeAssignment } from "@/intelligence/assignmentEngine";
import { analyzeCoverageFromGame } from "@/intelligence/coverageEngine";
import { analyzeEditorialFromGame } from "@/intelligence/editorialEngine";
import { getNewsService } from "@/news/newsService";
import { getAIEditorialAssistant } from "@/ai/aiService";
import type { AIBrief, AIBriefInput } from "@/ai/aiTypes";
import type { Game } from "@/types";

export async function buildAIBriefInput(game: Game): Promise<AIBriefInput> {
  const coverage = analyzeCoverageFromGame(game);
  const editorial = analyzeEditorialFromGame(game);
  const assignment = analyzeAssignment(coverage, editorial);

  const news = await getNewsService()
    .analyzeForGame({
      id: game.id,
      homeTeam: game.homeTeam,
      awayTeam: game.awayTeam,
      competition: game.competition,
      date: `${game.date}T${game.time ?? "00:00"}:00Z`,
    })
    .catch(() => undefined);

  return {
    game,
    coverage,
    editorial,
    assignment,
    news,
    brief: {
      gameId: game.id,
      summary: game.summary,
      pautas: game.pautas,
      priorityPlayers: game.priorityPlayers,
      mustShoot: game.mustShoot,
      checklist: game.checklist,
      shotList: game.shotList,
      coverage: { score: coverage.coverageScore, level: "Alta", reasons: coverage.positives },
      editorial: { score: editorial.editorialScore, level: "Alta", highlights: editorial.positiveFactors },
    },
  };
}

export async function generateAIBriefForGame(game: Game, force = false): Promise<AIBrief> {
  const input = await buildAIBriefInput(game);
  return getAIEditorialAssistant().generateBrief(input, { force });
}
