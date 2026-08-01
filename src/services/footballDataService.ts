// Football-Data.org service — única camada autorizada a chamar a API.
// Componentes/páginas devem consumir estes helpers e nunca invocar a API direto.
//
// Responsabilidades desta camada:
// - cache com TTL de 10 minutos + deduplicação de requisições;
// - filtro das competições suportadas (Brasil + continentais);
// - fallback para os últimos dados válidos quando a API falha.
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
import { loadCalendarRange, type DateRange } from "@/services/calendarLoader";
import { appCache, type CachedResult } from "@/services/apiCache";
import {
  findSupportedCompetition,
  isSupportedCompetition,
} from "@/config/supportedCompetitions";
import { monthRange } from "@/lib/calendar-utils";
import { withTiming } from "@/lib/logger";
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
  const supported = findSupportedCompetition({
    code: match.competition?.code,
    id: match.competition?.id,
    name: match.competition?.name,
  });
  const competitionName = supported?.label ?? match.competition?.name ?? "Competição";

  return {
    id: `${FD_ID_PREFIX}${match.id}`,
    homeTeam: home,
    homeCrest: match.homeTeam?.crest || placeholderCrest(match.homeTeam?.tla ?? home),
    awayTeam: away,
    awayCrest: match.awayTeam?.crest || placeholderCrest(match.awayTeam?.tla ?? away),
    competition: competitionName,
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
    summary: `${competitionName} • ${statusLabel(match.status)}${
      match.matchday ? ` • Rodada ${match.matchday}` : ""
    }`,
    pautas: [],
    priorityPlayers: [],
    mustShoot: [],
    checklist: [],
    shotList: [],
  };
}

/** Mantém apenas partidas das competições suportadas (Brasil + continentais). */
export function filterSupportedMatches(matches: FDMatch[]): FDMatch[] {
  return matches.filter((m) =>
    isSupportedCompetition({
      code: m.competition?.code,
      id: m.competition?.id,
      name: m.competition?.name,
    }),
  );
}

// Requisição simples (usada internamente pelo CalendarLoader). A API limita
// cada chamada a 10 dias — períodos maiores devem passar por
// `listMatchesForRange`.
export async function listMatches(params?: {
  dateFrom?: string;
  dateTo?: string;
}): Promise<Game[]> {
  const res = await fetchMatches({ data: params ?? {} });
  return filterSupportedMatches(res.matches ?? []).map(mapMatchToGame);
}

// Carrega qualquer período, de qualquer tamanho. O CalendarLoader divide em
// blocos de no máximo 10 dias, faz as chamadas em série limitada, deduplica e
// ordena.
export async function listMatchesForRange(range: DateRange): Promise<Game[]> {
  return loadCalendarRange(range, (chunk) => listMatches(chunk), {
    tolerateErrors: true,
  });
}

export type CalendarResult = CachedResult<Game[]>;

/**
 * Carrega **apenas um mês** (comportamento do Calendário Inteligente).
 * Usa cache de 10 minutos, deduplica chamadas simultâneas e cai para o último
 * resultado válido quando a API falha.
 */
export async function loadMonthGames(year: number, month: number): Promise<CalendarResult> {
  const range = monthRange(year, month);
  return withTiming(
    `calendário ${range.dateFrom}→${range.dateTo}`,
    () =>
      appCache.fetch<Game[]>(
        `calendar:${range.dateFrom}:${range.dateTo}`,
        () => listMatchesForRange(range),
        { scope: "calendário" },
      ),
    (res) => ({
      items: res.data.length,
      cache:
        res.source === "fresh" ? ("miss" as const) : res.source === "cache" ? ("hit" as const) : ("stale" as const),
    }),
  );
}

export async function getMatchGameById(gameId: string): Promise<Game | undefined> {
  if (!gameId.startsWith(FD_ID_PREFIX)) return undefined;
  const raw = Number(gameId.slice(FD_ID_PREFIX.length));
  if (!Number.isFinite(raw)) return undefined;
  const res = await appCache.fetch(
    `match:${raw}`,
    () => fetchMatchById({ data: { id: raw } }),
    { scope: "partida" },
  );
  return res.data ? mapMatchToGame(res.data) : undefined;
}

export async function listCompetitions(): Promise<FDCompetition[]> {
  const res = await appCache.fetch(
    "competitions",
    async () => (await fetchCompetitions()).competitions ?? [],
    { scope: "competições" },
  );
  return res.data.filter((c) => isSupportedCompetition({ code: c.code, id: c.id, name: c.name }));
}

export async function listTeamsByCompetition(code: string): Promise<FDTeam[]> {
  const res = await appCache.fetch(
    `teams:${code}`,
    async () => (await fetchTeamsByCompetition({ data: { code } })).teams ?? [],
    { scope: "times" },
  );
  return res.data;
}

export async function getStandings(
  code: string,
): Promise<NonNullable<FDStandingsResponse["standings"]>> {
  const res = await appCache.fetch(
    `standings:${code}`,
    async () => (await fetchStandings({ data: { code } })).standings ?? [],
    { scope: "classificação" },
  );
  return res.data;
}
