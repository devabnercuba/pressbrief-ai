// Game service — camada de acesso a dados de jogos.
// Hoje serve mocks locais; futuramente pode consumir Supabase / APIs esportivas
// sem alterar as páginas que a consomem.
import { mockGames, pendingCredentials, daySummary, userProfile } from "@/lib/mock-games";
import type { Credential, DaySummary, Game, UserProfile } from "@/types";

export function listGames(): Game[] {
  return mockGames;
}

export function getGameById(id: string): Game | undefined {
  return mockGames.find((g) => g.id === id);
}

export function listRecommendedGames(limit = 3): Game[] {
  return [...mockGames]
    .sort((a, b) => b.coverageScore - a.coverageScore)
    .slice(0, limit);
}

export function listPendingCredentials(): Credential[] {
  return pendingCredentials;
}

export function getDaySummary(): DaySummary {
  return daySummary;
}

export function getUserProfile(): UserProfile {
  return userProfile;
}
