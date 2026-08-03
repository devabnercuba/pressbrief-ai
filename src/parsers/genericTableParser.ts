// Parser genérico de tabelas HTML/CSV. Detecta colunas por cabeçalho.
import type { RawGameInput } from "@/dataSources/dataSourceTypes";
import type { ParseContext, Parser } from "./baseParser";
import { stripHtml } from "./baseParser";

function normalizeHeader(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

const FIELD_ALIASES: Record<keyof RawGameInput, string[]> = {
  id: ["id", "codigo"],
  competition: ["competicao", "campeonato", "torneio", "competition"],
  season: ["temporada", "season", "ano"],
  round: ["rodada", "round", "fase"],
  date: ["data", "date", "dia"],
  time: ["hora", "horario", "time", "kickoff"],
  utcDate: ["utcdate"],
  homeTeam: ["mandante", "casa", "time a", "hometeam", "home"],
  awayTeam: ["visitante", "fora", "time b", "awayteam", "away"],
  stadium: ["estadio", "local", "stadium", "venue"],
  city: ["cidade", "city"],
  state: ["estado", "uf", "state"],
  country: ["pais", "country"],
  status: ["status", "situacao"],
};

function fieldFor(header: string): keyof RawGameInput | undefined {
  const normalized = normalizeHeader(header);
  for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
    if (aliases.some((alias) => normalized === alias || normalized.includes(alias))) {
      return field as keyof RawGameInput;
    }
  }
  return undefined;
}

function rowsFromHtml(content: string): string[][] {
  const rows: string[][] = [];
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let row: RegExpExecArray | null;
  while ((row = rowRegex.exec(content)) !== null) {
    const cells: string[] = [];
    const cellRegex = /<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi;
    let cell: RegExpExecArray | null;
    while ((cell = cellRegex.exec(row[1])) !== null) cells.push(stripHtml(cell[1]));
    if (cells.length > 1) rows.push(cells);
  }
  return rows;
}

function rowsFromDelimited(content: string): string[][] {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && /[;,\t|]/.test(line))
    .map((line) => line.split(/\s*[;,\t|]\s*/));
}

export function extractRows(content: string): string[][] {
  const html = rowsFromHtml(content);
  if (html.length > 0) return html;
  return rowsFromDelimited(content);
}

export function rowsToGames(rows: string[][], context: ParseContext): RawGameInput[] {
  if (rows.length < 2) return [];
  const header = rows[0].map(fieldFor);
  if (!header.includes("homeTeam") || !header.includes("date")) return [];

  return rows.slice(1).map((cells) => {
    const game: RawGameInput = { competition: context.competition ?? null };
    header.forEach((field, index) => {
      if (!field) return;
      const value = cells[index];
      if (value === undefined) return;
      (game as Record<string, unknown>)[field] = value;
    });
    return game;
  });
}

export const genericTableParser: Parser = {
  id: "generic-table",
  label: "Tabela genérica (HTML/CSV)",
  priority: 20,
  canParse(content) {
    const rows = extractRows(content);
    if (rows.length < 2) return false;
    const header = rows[0].map(fieldFor);
    return header.includes("homeTeam") && header.includes("date");
  },
  parse(content, context) {
    return rowsToGames(extractRows(content), context);
  },
};
