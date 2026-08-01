// Camada HTTP resiliente: timeout, retry com backoff exponencial,
// respeito ao Retry-After / "Wait X seconds" e limite de concorrência.
// Sem dependência de framework — testável isoladamente.

export const DEFAULT_TIMEOUT_MS = 10_000;
export const DEFAULT_MAX_RETRIES = 3;
export const DEFAULT_BASE_DELAY_MS = 1_000;

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export class TimeoutError extends Error {
  constructor(message = "Tempo limite excedido") {
    super(message);
    this.name = "TimeoutError";
  }
}

/** Extrai segundos de espera do header Retry-After ou do corpo ("Wait 34 seconds"). */
export function parseWaitSeconds(
  headerValue?: string | null,
  body?: string | null,
): number | undefined {
  if (headerValue) {
    const n = Number(headerValue);
    if (Number.isFinite(n) && n >= 0) return n;
    const asDate = Date.parse(headerValue);
    if (!Number.isNaN(asDate)) {
      return Math.max(0, Math.ceil((asDate - Date.now()) / 1000));
    }
  }
  if (body) {
    const m = /wait\s+(\d+)\s*second/i.exec(body);
    if (m) return Number(m[1]);
  }
  return undefined;
}

export function backoffDelayMs(attempt: number, baseMs = DEFAULT_BASE_DELAY_MS): number {
  // 1s, 2s, 4s, 8s… com jitter leve para evitar sincronização.
  const exponential = baseMs * 2 ** attempt;
  return Math.round(exponential + Math.random() * 200);
}

/** Limita quantas promessas podem executar em paralelo. */
export class ConcurrencyLimiter {
  private active = 0;
  private queue: Array<() => void> = [];

  constructor(private readonly limit: number) {}

  async run<T>(task: () => Promise<T>): Promise<T> {
    if (this.active >= this.limit) {
      await new Promise<void>((resolve) => this.queue.push(resolve));
    }
    this.active++;
    try {
      return await task();
    } finally {
      this.active--;
      this.queue.shift()?.();
    }
  }
}

export interface RetryFetchOptions {
  timeoutMs?: number;
  maxRetries?: number;
  baseDelayMs?: number;
  /** Espera máxima aceita em um único retry (evita travar a UI). */
  maxWaitMs?: number;
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  onRetry?: (info: { attempt: number; waitMs: number; status?: number }) => void;
}

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Faz uma requisição com timeout e retry automático em 429 / 5xx / erros de rede.
 * Lança HttpError ou TimeoutError quando esgota as tentativas.
 */
export async function fetchWithRetry(
  url: string,
  init: RequestInit = {},
  options: RetryFetchOptions = {},
): Promise<Response> {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    maxRetries = DEFAULT_MAX_RETRIES,
    baseDelayMs = DEFAULT_BASE_DELAY_MS,
    maxWaitMs = 60_000,
    fetchImpl = fetch,
    sleep = defaultSleep,
    onRetry,
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetchImpl(url, { ...init, signal: controller.signal });
      clearTimeout(timer);

      if (res.status === 429 || res.status >= 500) {
        if (attempt === maxRetries) {
          throw new HttpError(res.status, `Requisição falhou com status ${res.status}`);
        }
        const body = await res.clone().text().catch(() => "");
        const waitSeconds = parseWaitSeconds(res.headers?.get?.("Retry-After"), body);
        const waitMs = Math.min(
          waitSeconds != null ? waitSeconds * 1000 : backoffDelayMs(attempt, baseDelayMs),
          maxWaitMs,
        );
        onRetry?.({ attempt: attempt + 1, waitMs, status: res.status });
        await sleep(waitMs);
        continue;
      }

      return res;
    } catch (error) {
      clearTimeout(timer);
      if (error instanceof HttpError) throw error;
      const aborted =
        (error as { name?: string })?.name === "AbortError" || error instanceof TimeoutError;
      lastError = aborted ? new TimeoutError() : error;
      if (attempt === maxRetries) break;
      const waitMs = backoffDelayMs(attempt, baseDelayMs);
      onRetry?.({ attempt: attempt + 1, waitMs });
      await sleep(waitMs);
    }
  }

  throw lastError ?? new Error("Requisição falhou");
}
