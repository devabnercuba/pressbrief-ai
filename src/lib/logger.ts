// Logger simples — ativo apenas em desenvolvimento.
// Registra tempo de consulta, quantidade de itens, retries e erros.

const isDev = (() => {
  try {
    return (
      (typeof import.meta !== "undefined" && (import.meta as { env?: { DEV?: boolean } }).env?.DEV) ??
      process.env.NODE_ENV !== "production"
    );
  } catch {
    return false;
  }
})();

export interface QueryLog {
  scope: string;
  durationMs: number;
  items?: number;
  retries?: number;
  errors?: number;
  cache?: "hit" | "miss" | "stale";
}

export const logger = {
  enabled: isDev,
  debug(message: string, data?: unknown) {
    if (!isDev) return;
    console.debug(`[PressBrief] ${message}`, data ?? "");
  },
  warn(message: string, data?: unknown) {
    if (!isDev) return;
    console.warn(`[PressBrief] ${message}`, data ?? "");
  },
  error(message: string, data?: unknown) {
    // Erros ficam no console mesmo fora de dev, mas nunca chegam à UI.
    console.error(`[PressBrief] ${message}`, data ?? "");
  },
  query(log: QueryLog) {
    if (!isDev) return;
    const parts = [
      `${log.scope}`,
      `${Math.round(log.durationMs)}ms`,
      log.items != null ? `${log.items} itens` : null,
      log.cache ? `cache:${log.cache}` : null,
      log.retries ? `retries:${log.retries}` : null,
      log.errors ? `erros:${log.errors}` : null,
    ].filter(Boolean);
    console.debug(`[PressBrief] ${parts.join(" · ")}`);
  },
};

/** Mede o tempo de uma promessa e registra o resultado. */
export async function withTiming<T>(
  scope: string,
  fn: () => Promise<T>,
  describe?: (value: T) => Partial<QueryLog>,
): Promise<T> {
  const started = Date.now();
  try {
    const value = await fn();
    logger.query({ scope, durationMs: Date.now() - started, ...describe?.(value) });
    return value;
  } catch (error) {
    logger.query({ scope, durationMs: Date.now() - started, errors: 1 });
    logger.error(`falha em ${scope}`, error);
    throw error;
  }
}
