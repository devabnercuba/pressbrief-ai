// Game Normalizer — converte qualquer estrutura (API, HTML, JSON, RSS, Excel…)
// para o modelo universal `NormalizedGame` e, quando necessário, para o `Game`
// consumido pelos Engines/UI.
import type { NormalizedGame, RawGameInput } from "./dataSourceTypes";
import type { Game, Opportunity } from "@/types";

const MONTHS: Record<string, string> = {
  jan: "01",
  fev: "02",
  mar: "03",
  abr: "04",
  mai: "05",
  jun: "06",
  jul: "07",
  ago: "08",
  set: "09",
  out: "10",
  nov: "11",
  dez: "12",
};

export function normalizeText(value: unknown, fallback = ""): string {
  if (value === null || value === undefined) return fallback;
  const text = String(value).replace(/\s+/g, " ").trim();
  return text.length > 0 ? text : fallback;
}

/** Aceita ISO, DD/MM/YYYY, DD/MM e "12 de abril de 2026". Retorna YYYY-MM-DD. */
export function normalizeDate(value?: string | null, reference = new Date()): string {
  const raw = normalizeText(value);
  if (!raw) return "";

  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const br = /^(\d{1,2})[/.-](\d{1,2})(?:[/.-](\d{2,4}))?/.exec(raw);
  if (br) {
    const day = br[1].padStart(2, "0");
    const month = br[2].padStart(2, "0");
    let year = br[3] ?? String(reference.getUTCFullYear());
    if (year.length === 2) year = `20${year}`;
    return `${year}-${month}-${day}`;
  }

  const textual = /(\d{1,2})\s+de\s+([a-zç]+)\.?(?:\s+de\s+(\d{4}))?/i.exec(raw);
  if (textual) {
    const month = MONTHS[textual[2].slice(0, 3).toLowerCase()];
    if (month) {
      const year = textual[3] ?? String(reference.getUTCFullYear());
      return `${year}-${month}-${textual[1].padStart(2, "0")}`;
    }
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return "";
}

/** Aceita "16:00", "16h", "16h30", "16:00:00". Retorna HH:mm. */
export function normalizeTime(value?: string | null): string {
  const raw = normalizeText(value);
  if (!raw) return "";
  const match = /(\d{1,2})\s*[:hH]\s*(\d{2})?/.exec(raw);
  if (!match) return "";
  const hour = match[1].padStart(2, "0");
  const minute = (match[2] ?? "00").padStart(2, "0");
  if (Number(hour) > 23 || Number(minute) > 59) return "";
  return `${hour}:${minute}`;
}

function slug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function buildGameId(input: {
  source: string;
  date: string;
  homeTeam: string;
  awayTeam: string;
  id?: string | number | null;
}): string {
  if (input.id !== undefined && input.id !== null && String(input.id).trim() !== "") {
    return `${slug(input.source)}-${slug(String(input.id))}`;
  }
  return `${slug(input.source)}-${input.date}-${slug(input.homeTeam)}-${slug(input.awayTeam)}`;
}

/** Converte dados crus no modelo universal. */
export function normalizeGame(raw: RawGameInput, source: string): NormalizedGame {
  const utc = raw.utcDate ? new Date(raw.utcDate) : null;
  const hasUtc = utc !== null && !Number.isNaN(utc.getTime());

  const date = hasUtc ? utc.toISOString().slice(0, 10) : normalizeDate(raw.date);
  const time = hasUtc
    ? utc.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Sao_Paulo",
      })
    : normalizeTime(raw.time);

  const homeTeam = normalizeText(raw.homeTeam, "A confirmar");
  const awayTeam = normalizeText(raw.awayTeam, "A confirmar");

  return {
    id: buildGameId({ source, date, homeTeam, awayTeam, id: raw.id }),
    competition: normalizeText(raw.competition, "Competição"),
    season: normalizeText(raw.season, date ? date.slice(0, 4) : ""),
    round: normalizeText(raw.round),
    date,
    time,
    homeTeam,
    awayTeam,
    stadium: normalizeText(raw.stadium, "Estádio a confirmar"),
    city: normalizeText(raw.city, "—"),
    state: normalizeText(raw.state, "—"),
    country: normalizeText(raw.country, "Brasil"),
    status: normalizeText(raw.status, "Agendado"),
    source,
  };
}

/** Um jogo é válido quando possui data e os dois times. */
export function isValidGame(game: NormalizedGame): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(game.date) &&
    game.homeTeam !== "A confirmar" &&
    game.awayTeam !== "A confirmar" &&
    game.homeTeam.toLowerCase() !== game.awayTeam.toLowerCase()
  );
}

/** Normaliza uma lista, descartando registros inválidos e duplicados. */
export function normalizeGames(raws: RawGameInput[], source: string): NormalizedGame[] {
  const byId = new Map<string, NormalizedGame>();
  for (const raw of raws) {
    const game = normalizeGame(raw, source);
    if (!isValidGame(game)) continue;
    if (!byId.has(game.id)) byId.set(game.id, game);
  }
  return Array.from(byId.values()).sort((a, b) =>
    a.date === b.date ? (a.time < b.time ? -1 : 1) : a.date < b.date ? -1 : 1,
  );
}

const placeholderCrest = (label: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#27272a"/><text x="50%" y="55%" text-anchor="middle" font-family="Inter,Arial" font-size="18" font-weight="700" fill="#a1a1aa">${label
      .slice(0, 3)
      .toUpperCase()}</text></svg>`,
  )}`;

/** Converte o modelo universal para o `Game` consumido pelos Engines/UI. */
export function toAppGame(game: NormalizedGame, crests?: { home?: string; away?: string }): Game {
  return {
    id: game.id,
    homeTeam: game.homeTeam,
    homeCrest: crests?.home || placeholderCrest(game.homeTeam),
    awayTeam: game.awayTeam,
    awayCrest: crests?.away || placeholderCrest(game.awayTeam),
    competition: game.competition,
    date: game.date,
    time: game.time || "00:00",
    stadium: game.stadium,
    city: game.city,
    state: game.state,
    coverageScore: 0,
    editorialScore: 0,
    distanceKm: 0,
    weather: { condition: game.status, tempC: 0, humidity: 0, icon: "cloud" },
    pautasCount: 0,
    priorityPlayersCount: 0,
    opportunity: "medium" as Opportunity,
    reasons: [],
    summary: `${game.competition} • ${game.status}${game.round ? ` • ${game.round}` : ""}`,
    pautas: [],
    priorityPlayers: [],
    mustShoot: [],
    checklist: [],
    shotList: [],
  };
}

/** Converte um `Game` existente (ex.: API já mapeada) para o modelo universal. */
export function fromAppGame(game: Game, source: string): NormalizedGame {
  return {
    id: game.id,
    competition: game.competition,
    season: game.date.slice(0, 4),
    round: "",
    date: game.date,
    time: game.time,
    homeTeam: game.homeTeam,
    awayTeam: game.awayTeam,
    stadium: game.stadium,
    city: game.city,
    state: game.state,
    country: "Brasil",
    status: game.weather.condition,
    source,
  };
}
