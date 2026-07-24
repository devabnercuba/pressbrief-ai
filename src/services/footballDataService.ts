// Football-Data.org service — única camada autorizada a chamar a API.
// Componentes/páginas devem consumir estes helpers e nunca invocar a API direto.
import {
  fetchCompetitions,
  fetchMatchById,
  fetchMatches,
  fetchStandings,
  fetchTeamsByCompetition,
  type FDCompetition,
  type FDMatch,
  type FDStandingsResponse,
  type FDTeam,
} from "@/lib/football-data.functions";
import type { Game, Opportunity } from "@/types";

export const FD_ID_PREFIX = "fd-";

const placeholderCrest = (label: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#27272a"/><text x="50%" y="55%" text-anchor="middle" font-family="Inter,Arial" font-size="18" font-weight="700" fill="#a1a1aa">${label.slice(0, 3).toUpperCase()}</text></svg>`,
  )}`;

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    SCHEDULED: "Agendado",
    TIMED: "Agendado",
    IN_PLAY: "Ao vivo",
    PAUSED: "Intervalo",
    FINISHED: "Encerrado",
    POSTPONED: "Adiado",
    SUSPENDED: "Suspenso",
    CANCELLED: "Cancelado",
  };
  return map[status] ?? status;
}

export function mapMatchToGame(match: FDMatch): Game {
  const utc = new Date(match.utcDate);
  const date = utc.toISOString().slice(0, 10);
  const time = utc.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
  const home = match.homeTeam?.name ?? "A confirmar";
  const away = match.awayTeam?.name ?? "A confirmar";
  const stadium = match.venue ?? "Estádio a confirmar";
  const city = match.competition?.area?.name ?? "—";

  return {
    id: `${FD_ID_PREFIX}${match.id}`,
    homeTeam: home,
    homeCrest: match.homeTeam?.crest || placeholderCrest(match.homeTeam?.tla ?? home),
    awayTeam: away,
    awayCrest: match.awayTeam?.crest || placeholderCrest(match.awayTeam?.tla ?? away),
    competition: match.competition?.name ?? "Competição",
    date,
    time,
    stadium,
    city,
    state: "—",
    coverageScore: 0,
    editorialScore: 0,
    distanceKm: 0,
    weather: { condition: statusLabel(match.status), tempC: 0, humidity: 0, icon: "cloud" },
    pautasCount: 0,
    priorityPlayersCount: 0,
    opportunity: "medium" as Opportunity,
    reasons: [],
    summary: `${match.competition?.name ?? "Partida"} • ${statusLabel(match.status)}${
      match.matchday ? ` • Rodada ${match.matchday}` : ""
    }`,
    pautas: [],
    priorityPlayers: [],
    mustShoot: [],
    checklist: [],
    shotList: [],
  };
}

export async function listMatches(params?: {
  dateFrom?: string;
  dateTo?: string;
}): Promise<Game[]> {
  const res = await fetchMatches({ data: params ?? {} });
  return (res.matches ?? []).map(mapMatchToGame);
}

export async function getMatchGameById(gameId: string): Promise<Game | undefined> {
  if (!gameId.startsWith(FD_ID_PREFIX)) return undefined;
  const raw = Number(gameId.slice(FD_ID_PREFIX.length));
  if (!Number.isFinite(raw)) return undefined;
  const match = await fetchMatchById({ data: { id: raw } });
  return match ? mapMatchToGame(match) : undefined;
}

export async function listCompetitions(): Promise<FDCompetition[]> {
  const res = await fetchCompetitions();
  return res.competitions ?? [];
}

export async function listTeamsByCompetition(code: string): Promise<FDTeam[]> {
  const res = await fetchTeamsByCompetition({ data: { code } });
  return res.teams ?? [];
}

export async function getStandings(
  code: string,
): Promise<NonNullable<FDStandingsResponse["standings"]>> {
  const res = await fetchStandings({ data: { code } });
  return res.standings ?? [];
}
