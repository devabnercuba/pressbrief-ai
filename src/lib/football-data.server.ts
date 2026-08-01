// Server-only helpers for Football-Data.org API.
// Never import this file from client-reachable code — the filename `.server.ts`
// enforces the boundary via the bundler.
//
// Toda chamada passa por: limite de 2 requisições simultâneas, timeout de 10s,
// retry automático com backoff exponencial e respeito ao tempo informado pela
// API em respostas 429.
import {
  ConcurrencyLimiter,
  DEFAULT_TIMEOUT_MS,
  fetchWithRetry,
  HttpError,
} from "./http-retry";
import { logger } from "./logger";

const BASE_URL = "https://api.football-data.org/v4";

/** A API gratuita permite poucas requisições por minuto. */
export const MAX_PARALLEL_REQUESTS = 2;

const limiter = new ConcurrencyLimiter(MAX_PARALLEL_REQUESTS);

export async function fdFetch<T>(path: string): Promise<T> {
  const key = process.env.FOOTBALL_DATA_API_KEY;
  if (!key) {
    throw new Error("FOOTBALL_DATA_API_KEY não está configurada no servidor.");
  }

  let retries = 0;
  const started = Date.now();

  const res = await limiter.run(() =>
    fetchWithRetry(
      `${BASE_URL}${path}`,
      { headers: { "X-Auth-Token": key } },
      {
        timeoutMs: DEFAULT_TIMEOUT_MS,
        onRetry: ({ waitMs, status }) => {
          retries++;
          logger.warn(`retry ${retries} em ${path} (status ${status ?? "rede"}) — ${waitMs}ms`);
        },
      },
    ),
  );

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    logger.error(`Football-Data ${res.status} em ${path}`, body.slice(0, 200));
    throw new HttpError(res.status, `Football-Data respondeu ${res.status}`);
  }

  logger.query({ scope: `football-data ${path}`, durationMs: Date.now() - started, retries });
  return (await res.json()) as T;
}
