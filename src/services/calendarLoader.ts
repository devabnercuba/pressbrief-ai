// CalendarLoader — carrega períodos longos da Football-Data API.
// A API limita cada requisição a um intervalo máximo de 10 dias (erro 400).
// Esta camada divide o período automaticamente, executa as requisições em
// paralelo, unifica, deduplica e ordena os jogos.
//
// Nenhum componente React deve conhecer essa limitação: o resto da aplicação
// consome apenas `loadCalendarRange`.
import type { Game } from "@/types";

/** Limite de dias por requisição imposto pela Football-Data API. */
export const MAX_DAYS_PER_REQUEST = 10;

/** Quantidade máxima de requisições simultâneas (evita rate limit 429). */
export const MAX_CONCURRENCY = 2;

export interface DateRange {
  dateFrom: string; // YYYY-MM-DD
  dateTo: string;   // YYYY-MM-DD
}

function parseISO(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, days: number): Date {
  const out = new Date(d);
  out.setUTCDate(out.getUTCDate() + days);
  return out;
}

/**
 * Divide um período em blocos de no máximo `maxDays` dias (inclusivos).
 * Retorna [] quando o intervalo é inválido (fim antes do início).
 */
export function splitDateRange(
  range: DateRange,
  maxDays: number = MAX_DAYS_PER_REQUEST,
): DateRange[] {
  const start = parseISO(range.dateFrom);
  const end = parseISO(range.dateTo);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];
  if (end < start) return [];

  const size = Math.max(1, Math.floor(maxDays));
  const chunks: DateRange[] = [];
  let cursor = start;
  while (cursor <= end) {
    const chunkEnd = addDays(cursor, size - 1);
    const capped = chunkEnd > end ? end : chunkEnd;
    chunks.push({ dateFrom: toISO(cursor), dateTo: toISO(capped) });
    cursor = addDays(capped, 1);
  }
  return chunks;
}

/** Remove duplicados por id e ordena por data + horário. */
export function mergeGames(batches: Game[][]): Game[] {
  const byId = new Map<string, Game>();
  for (const batch of batches) {
    for (const game of batch) {
      if (!byId.has(game.id)) byId.set(game.id, game);
    }
  }
  return Array.from(byId.values()).sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    if (a.time !== b.time) return a.time < b.time ? -1 : 1;
    return a.id < b.id ? -1 : 1;
  });
}

/** Executa tarefas com limite de concorrência, preservando a ordem. */
async function runPooled<T>(
  tasks: Array<() => Promise<T>>,
  concurrency: number,
): Promise<T[]> {
  const results = new Array<T>(tasks.length);
  let next = 0;
  const workers = Array.from(
    { length: Math.max(1, Math.min(concurrency, tasks.length)) },
    async () => {
      while (true) {
        const index = next++;
        if (index >= tasks.length) return;
        results[index] = await tasks[index]();
      }
    },
  );
  await Promise.all(workers);
  return results;
}

export interface CalendarLoaderOptions {
  maxDays?: number;
  concurrency?: number;
  /** Se true, ignora blocos que falharem em vez de rejeitar tudo. */
  tolerateErrors?: boolean;
}

/**
 * Carrega um período arbitrário chamando `fetchChunk` para cada bloco de
 * no máximo 10 dias. Unifica, deduplica e ordena o resultado.
 */
export async function loadCalendarRange(
  range: DateRange,
  fetchChunk: (chunk: DateRange) => Promise<Game[]>,
  options: CalendarLoaderOptions = {},
): Promise<Game[]> {
  const chunks = splitDateRange(range, options.maxDays ?? MAX_DAYS_PER_REQUEST);
  if (chunks.length === 0) return [];

  const tasks = chunks.map((chunk) => async () => {
    if (!options.tolerateErrors) return fetchChunk(chunk);
    try {
      return await fetchChunk(chunk);
    } catch {
      return [] as Game[];
    }
  });

  const batches = await runPooled(tasks, options.concurrency ?? MAX_CONCURRENCY);
  return mergeGames(batches);
}
