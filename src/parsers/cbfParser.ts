// Parser da CBF (tabelas oficiais dos campeonatos nacionais).
import type { Parser } from "./baseParser";
import { hostOf, parseMatchLines, stripHtml } from "./baseParser";
import { extractRows, rowsToGames } from "./genericTableParser";

function detectCompetition(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("série b")) return "Campeonato Brasileiro Série B";
  if (lower.includes("série c")) return "Campeonato Brasileiro Série C";
  if (lower.includes("série d")) return "Campeonato Brasileiro Série D";
  if (lower.includes("copa do brasil")) return "Copa do Brasil";
  if (lower.includes("supercopa")) return "Supercopa do Brasil";
  return "Campeonato Brasileiro Série A";
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
    const tableGames = rowsToGames(extractRows(content), { ...context, competition });
    if (tableGames.length > 0) return tableGames;
    return parseMatchLines(text, competition).map((game) => ({
      ...game,
      country: "Brasil",
    }));
  },
};
