// Parser da FCF (Federação Catarinense de Futebol) e federações estaduais
// com estrutura equivalente.
import type { Parser } from "./baseParser";
import { hostOf, parseMatchLines, stripHtml } from "./baseParser";
import { extractRows, rowsToGames } from "./genericTableParser";

export const fcfParser: Parser = {
  id: "fcf",
  label: "FCF",
  priority: 90,
  canParse(content, context) {
    const host = hostOf(context.url);
    return (
      host.includes("fcf.com.br") ||
      host.includes("federacaocatarinense") ||
      /federa[çc][ãa]o catarinense/i.test(content)
    );
  },
  parse(content, context) {
    const competition = context.competition ?? "Campeonato Catarinense";
    const tableGames = rowsToGames(extractRows(content), { ...context, competition });
    const games =
      tableGames.length > 0 ? tableGames : parseMatchLines(stripHtml(content), competition);
    return games.map((game) => ({ ...game, state: game.state ?? "SC", country: "Brasil" }));
  },
};
