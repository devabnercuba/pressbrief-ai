// Cache de briefings de IA com TTL configurável.
// Evita reconsultar o modelo enquanto o briefing ainda é válido.
// Preparado para ser trocado por Supabase / KV sem alterar a interface.

export interface AICacheEntry<T> {
  value: T;
  expiresAt: number;
}

export const DEFAULT_AI_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6h

export class AICache<T> {
  private store = new Map<string, AICacheEntry<T>>();

  constructor(private ttlMs: number = DEFAULT_AI_CACHE_TTL_MS) {}

  get ttl(): number {
    return this.ttlMs;
  }

  setTtl(ttlMs: number): void {
    this.ttlMs = ttlMs;
  }

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  set(key: string, value: T, ttlMs = this.ttlMs): void {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }
}

/** Chave determinística por jogo + versão dos dados de entrada. */
export function buildAICacheKey(gameId: string, signature = ""): string {
  return signature ? `${gameId}::${signature}` : gameId;
}
