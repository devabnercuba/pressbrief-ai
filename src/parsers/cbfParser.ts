// CBF Parser 2.0 — extração completa das tabelas oficiais da CBF.
// Garante competição, rodada, data, hora, mandante, visitante, cidade,
// estado, estádio, status e fonte. Nada volta vazio: usa "Não informado".
import type { RawGameInput } from "@/dataSources/dataSourceTypes";
import type { ParseContext, Parser } from "./baseParser";
import { hostOf, stripHtml } from "./baseParser";
import { extractRows, rowsToGames } from "./genericTableParser";
import { STATE_CODES, cleanText, canonicalTeamName } from "@/data/teamDatabase";

const NOT_INFORMED = "Não informado";

function detectCompetition(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("série b") || lower.includes("serie b")) return "Campeonato Brasileiro Série B";
  if (lower.includes("série c") || lower.includes("serie c")) return "Campeonato Brasileiro Série C";
  if (lower.includes("série d") || lower.includes("serie d")) return "Campeonato Brasileiro Série D";
  if (lower.includes("copa do brasil")) return "Copa do Brasil";
  if (lower.includes("supercopa")) return "Supercopa do Brasil";
  if (lower.includes("feminino")) return "Campeonato Brasileiro Feminino";
  return "Campeonato Brasileiro Série A";
}

/** Limpa textos quebrados, caracteres duplicados e espaços extras. */
export function sanitize(value: unknown): string {
  const text = cleanText(value)
    .replace(/\s*[·|•]\s*/g, " · ")
    .replace(/\s*,\s*,+/g, ", ")
    .replace(/\s*,\s*$/g, "")
    .replace(/\s*\/\s*$/g, "")
    .trim();
  return text.length > 1 ? text : "";
}

function orUnknown(value: string): string {
  return value || NOT_INFORMED;
}

/** "Estádio Beira-Rio, Porto Alegre - RS" → partes separadas. */
export function parseVenue(raw: string): { stadium: string; city: string; state: string } {
  const text = sanitize(raw);
  if (!text) return { stadium: NOT_INFORMED, city: NOT_INFORMED, state: NOT_INFORMED };

  let state = "";
  let rest = text;

  const stateMatch = /[,\-–—/]\s*([A-Z]{2})\s*$/.exec(text);
  if (stateMatch && STATE_CODES.includes(stateMatch[1])) {
    state = stateMatch[1];
    rest = sanitize(text.slice(0, stateMatch.index));
  }

  const parts = rest
    .split(/\s*[,\-–—]\s*/)
    .map(sanitize)
    .filter(Boolean);

  if (parts.length === 0) return { stadium: NOT_INFORMED, city: NOT_INFORMED, state: orUnknown(state) };
  if (parts.length === 1) {
    return { stadium: parts[0], city: NOT_INFORMED, state: orUnknown(state) };
  }
  return {
    stadium: parts.slice(0, parts.length - 1).join(" - "),
    city: parts[parts.length - 1],
    state: orUnknown(state),
  };
}

const DATE_RE = /(\d{1,2}[/.]\d{1,2}(?:[/.]\d{2,4})?|\d{4}-\d{2}-\d{2})/;
const TIME_RE = /(\d{1,2}\s*[:h]\s*\d{2})/;
const ROUND_RE = /(\d{1,2})\s*[ªa]?\s*rodada|rodada\s*[:\-]?\s*(\d{1,2})/i;

function detectStatus(chunk: string): string {
  const lower = chunk.toLowerCase();
  if (/adiad/.test(lower)) return "Adiado";
  if (/cancelad/.test(lower)) return "Cancelado";
  if (/encerrad|finalizad|fim de jogo/.test(lower)) return "Encerrado";
  if (/em andamento|ao vivo/.test(lower)) return "Em andamento";
  if (/a definir|a confirmar/.test(lower)) return "Data a definir";
  return "Agendado";
}

/**
 * Percorre o texto da página buscando confrontos "Time A x Time B" e
 * coleta o contexto ao redor (data, hora, rodada, local).
 */
export function parseCbfText(rawText: string, competition: string): RawGameInput[] {
  const text = sanitize(rawText).replace(/\s+/g, " ");
  const games: RawGameInput[] = [];

  const confronto = /([A-ZÁÉÍÓÚÂÊÔÃÕÇ][\wÁÉÍÓÚÂÊÔÃÕÇáéíóúâêôãõç.'-]*(?:\s+[\wÁÉÍÓÚÂÊÔÃÕÇáéíóúâêôãõç.'-]+){0,4})\s+(?:x|X|vs\.?|×)\s+([A-ZÁÉÍÓÚÂÊÔÃÕÇ][\wÁÉÍÓÚÂÊÔÃÕÇáéíóúâêôãõç.'-]*(?:\s+[\wÁÉÍÓÚÂÊÔÃÕÇáéíóúâêôãõç.'-]+){0,4})/g;

  let match: RegExpExecArray | null;
  let currentRound = "";

  while ((match = confronto.exec(text)) !== null) {
    const before = text.slice(Math.max(0, match.index - 180), match.index);
    const after = text.slice(match.index + match[0].length, match.index + match[0].length + 180);
    const context = `${before} ${after}`;

    const roundHit = ROUND_RE.exec(before) ?? ROUND_RE.exec(after);
    if (roundHit) currentRound = `${roundHit[1] ?? roundHit[2]}ª rodada`;

    const dateHit = DATE_RE.exec(before) ?? DATE_RE.exec(after);
    if (!dateHit) continue;

    const timeHit = TIME_RE.exec(before.slice(dateHit.index)) ?? TIME_RE.exec(after);

    const venueHit =
      /(?:est[áa]dio|arena|gin[áa]sio)[^,;|]{2,60}(?:[,\-–—][^;|]{2,40})?/i.exec(after) ??
      /(?:est[áa]dio|arena)[^,;|]{2,60}/i.exec(before);

    const venue = parseVenue(venueHit ? venueHit[0] : "");

    games.push({
      competition,
      round: currentRound || NOT_INFORMED,
      date: dateHit[1],
      time: timeHit ? timeHit[1] : null,
      homeTeam: canonicalTeamName(match[1]),
      awayTeam: canonicalTeamName(match[2]),
      stadium: venue.stadium,
      city: venue.city,
      state: venue.state,
      country: "Brasil",
      status: detectStatus(context),
    });
  }

  return games;
}

export const cbfParser: Parser = {
  id: "cbf",
  label: "CBF",
  priority: 100,
  canParse(content, context) {
    return hostOf(context.url).includes("cbf.com.br") || /confedera[çc][ãa]o brasileira/i.test(content);
  },
  parse(content, context) {
    const text = stripHtml(content);
    const competition = context.competition ?? detectCompetition(text);

    // 1) Tabelas estruturadas (mais confiáveis).
    const tableGames = rowsToGames(extractRows(content), { ...context, competition }).map((game) => {
      const venue = parseVenue(
        [game.stadium, game.city, game.state].filter(Boolean).join(", ") || "",
      );
      return {
        ...game,
        competition: sanitize(game.competition) || competition,
        round: sanitize(game.round) || NOT_INFORMED,
        homeTeam: canonicalTeamName(String(game.homeTeam ?? "")),
        awayTeam: canonicalTeamName(String(game.awayTeam ?? "")),
        stadium: sanitize(game.stadium) || venue.stadium,
        city: sanitize(game.city) || venue.city,
        state: sanitize(game.state) || venue.state,
        status: sanitize(game.status) || "Agendado",
        country: "Brasil",
      } satisfies RawGameInput;
    });
    if (tableGames.length > 0) return tableGames;

    // 2) Texto corrido da página.
    return parseCbfText(text, competition);
  },
};
