// Cache de dados com TTL + deduplicação de requisições em andamento.
// Mantém o último valor válido mesmo após expirar (fallback offline).
import { logger } from "@/lib/logger";

export const DEFAULT_TTL_MS = 10 * 60 * 1000; // 10 minutos

export interface CachedValue<T> {
  value: T;
  storedAt: number;
  expiresAt: number;
}

export interface CachedResult<T> {
  data: T;
  /** "fresh" = API, "cache" = TTL válido, "stale" = API falhou e usamos o antigo. */
  source: "fresh" | "cache" | "stale";
  updatedAt: number;
}

export class DataCache {
  private store = new Map<string, CachedValue<unknown>>();
  private inflight = new Map<string, Promise<unknown>>();

  constructor(private readonly ttlMs: number = DEFAULT_TTL_MS) {}

  peek<T>(key: string): CachedValue<T> | undefined {
    return this.store.get(key) as CachedValue<T> | undefined;
  }

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) return undefined;
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs = this.ttlMs): void {
    const now = Date.now();
    this.store.set(key, { value, storedAt: now, expiresAt: now + ttlMs });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
    this.inflight.clear();
  }

  /**
   * Retorna o valor em cache quando válido; caso contrário busca na API,
   * reaproveitando uma requisição já em andamento para a mesma chave.
   * Se a busca falhar e existir valor antigo, devolve o valor antigo (stale).
   */
  async fetch<T>(
    key: string,
    loader: () => Promise<T>,
    opts: { ttlMs?: number; scope?: string } = {},
  ): Promise<CachedResult<T>> {
    const cached = this.peek<T>(key);
    if (cached && Date.now() <= cached.expiresAt) {
      return { data: cached.value, source: "cache", updatedAt: cached.storedAt };
    }

    const existing = this.inflight.get(key) as Promise<T> | undefined;
    if (existing) {
      const data = await existing;
      return { data, source: "fresh", updatedAt: this.peek<T>(key)?.storedAt ?? Date.now() };
    }

    const promise = loader();
    this.inflight.set(key, promise);
    try {
      const data = await promise;
      this.set(key, data, opts.ttlMs);
      return { data, source: "fresh", updatedAt: Date.now() };
    } catch (error) {
      logger.error(`falha ao carregar ${opts.scope ?? key}`, error);
      if (cached) {
        return { data: cached.value, source: "stale", updatedAt: cached.storedAt };
      }
      throw error;
    } finally {
      this.inflight.delete(key);
    }
  }
}

/** Cache compartilhado da aplicação (calendário, competições, classificação…). */
export const appCache = new DataCache();
