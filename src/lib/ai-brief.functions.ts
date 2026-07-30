import { createServerFn } from "@tanstack/react-start";
import type { AIBrief } from "@/ai/aiTypes";
import type { Game } from "@/types";

export const generateAIBrief = createServerFn({ method: "POST" })
  .inputValidator((data: { game: Game; force?: boolean }) => data)
  .handler(async ({ data }): Promise<AIBrief> => {
    const { generateAIBriefForGame } = await import("./ai-brief.server");
    return generateAIBriefForGame(data.game, data.force ?? false);
  });
