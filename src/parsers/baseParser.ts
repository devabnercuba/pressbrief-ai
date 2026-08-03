// Base do sistema de parsers. Um parser transforma conteúdo bruto (HTML, CSV,
// texto, XML) em `RawGameInput[]`, que o Game Normalizer converte no modelo
// universal.
import type { RawGameInput } from "@/dataSources/dataSourceTypes";

export interface ParseContext {
  url?: string;
  contentType?: string;
  sourceName: string;
  /** Competição padrão quando a fonte não informa. */
  competition?: string;
}

export interface Parser {
  id: string;
  label: string;
  /** Prioridade maior vence quando mais de um parser aceita o conteúdo. */
  priority: number;
  canParse(content: string, context: ParseContext): boolean;
  parse(content: string, context: ParseContext): RawGameInput[];
}

export function stripHtml(value: string): string {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function hostOf(url?: string): string {
  if (!url) return "";
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

/** "12/04/2026 16:00 Time A x Time B — Estádio" → RawGameInput */
export const MATCH_LINE =
  /(\d{1,2}[/.-]\d{1,2}(?:[/.-]\d{2,4})?|\d{4}-\d{2}-\d{2})\s*(?:[-—|,]\s*)?(\d{1,2}\s*[:h]\s*\d{0,2})?\s*[-—|,]?\s*([^\n|;]{3,60}?)\s+(?:x|vs\.?|×)\s+([^\n|;–—]{3,60}?)(?:\s*[-—|]\s*([^\n|;]{3,80}))?(?=$|\n|\||;)/gi;

export function parseMatchLines(text: string, competition?: string): RawGameInput[] {
  const games: RawGameInput[] = [];
  MATCH_LINE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = MATCH_LINE.exec(text)) !== null) {
    games.push({
      date: match[1],
      time: match[2] ?? null,
      homeTeam: match[3],
      awayTeam: match[4],
      stadium: match[5] ?? null,
      competition: competition ?? null,
    });
  }
  return games;
}
