// AI Service — orquestra provider + prompt builder + parser + cache.
// É a ÚNICA porta de entrada da IA no PressBrief. Componentes React nunca
// chamam provedores diretamente: acessam via server function.

import { AICache, DEFAULT_AI_CACHE_TTL_MS, buildAICacheKey } from "./aiCache";
import { createAIProvider, hasAIProvider, registerAIProvider, type AIProvider } from "./aiProvider";
import { buildInputSignature, buildPrompt } from "./promptBuilder";
import { createOpenAIProvider } from "./openAIProvider";
import type { AIBrief, AIBriefInput } from "./aiTypes";

// ===== Registro de provedores =====
// Novos provedores (Gemini, Claude, Azure, locais) podem ser registrados
// aqui ou externamente via `registerAIProvider` sem tocar no restante do app.

function env(name: string): string | undefined {
  const value = typeof process !== "undefined" ? process.env?.[name] : undefined;
  return value && value.trim() ? value.trim() : undefined;
}

if (!hasAIProvider("openai")) {
  registerAIProvider("openai", () =>
    createOpenAIProvider({
      apiKey: env("OPENAI_API_KEY") ?? "",
      model: env("OPENAI_MODEL") ?? "gpt-4o-mini",
      id: "openai",
      name: "OpenAI",
    }),
  );
}

if (!hasAIProvider("lovable")) {
  registerAIProvider("lovable", () =>
    createOpenAIProvider({
      apiKey: env("LOVABLE_API_KEY") ?? "",
      model: env("AI_MODEL") ?? "google/gemini-3.6-flash",
      baseUrl: "https://ai.gateway.lovable.dev/v1",
      authHeader: "lovable",
      id: "lovable",
      name: "AI Gateway",
    }),
  );
}

export function resolveDefaultProviderId(): string {
  const explicit = env("AI_PROVIDER");
  if (explicit) return explicit;
  if (env("OPENAI_API_KEY")) return "openai";
  return "lovable";
}

// ===== Parser da resposta =====

const asString = (v: unknown, fallback = ""): string => (typeof v === "string" ? v.trim() : fallback);
const asStringArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.map((i) => (typeof i === "string" ? i.trim() : asString((i as { label?: string })?.label))).filter(Boolean) : [];

function extractJson(text: string): unknown {
  const cleaned = text.replace(/```json/gi, "```").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Resposta da IA não contém JSON válido.");
  }
  return JSON.parse(cleaned.slice(start, end + 1));
}

/** Converte o texto bruto do modelo em `AIBrief` normalizado. */
export function parseAIBrief(text: string): AIBrief {
  const raw = extractJson(text) as Record<string, unknown>;

  const checklist = Array.isArray(raw.photoChecklist)
    ? raw.photoChecklist.map((item) => {
        if (typeof item === "string") return { label: item, reason: "" };
        const obj = (item ?? {}) as Record<string, unknown>;
        return { label: asString(obj.label ?? obj.title), reason: asString(obj.reason) };
      }).filter((i) => i.label)
    : [];

  const players = Array.isArray(raw.priorityPlayers)
    ? raw.priorityPlayers.map((item) => {
        if (typeof item === "string") return { name: item, reason: "" };
        const obj = (item ?? {}) as Record<string, unknown>;
        return { name: asString(obj.name), team: asString(obj.team) || undefined, reason: asString(obj.reason) };
      }).filter((p) => p.name)
    : [];

  const shots = Array.isArray(raw.recommendedShots)
    ? raw.recommendedShots.map((item) => {
        if (typeof item === "string") return { title: item, reason: "" };
        const obj = (item ?? {}) as Record<string, unknown>;
        return {
          title: asString(obj.title),
          moment: asString(obj.moment) || undefined,
          reason: asString(obj.reason),
        };
      }).filter((s) => s.title)
    : [];

  const confidenceRaw = typeof raw.confidence === "number" ? raw.confidence : Number(raw.confidence);
  const confidence = Number.isFinite(confidenceRaw)
    ? Math.max(0, Math.min(1, confidenceRaw > 1 ? confidenceRaw / 100 : confidenceRaw))
    : 0.5;

  return {
    mission: asString(raw.mission),
    executiveSummary: asString(raw.executiveSummary),
    photoChecklist: checklist,
    editorialTopics: asStringArray(raw.editorialTopics),
    priorityPlayers: players,
    alerts: asStringArray(raw.alerts),
    hiddenOpportunities: asStringArray(raw.hiddenOpportunities),
    recommendedShots: shots,
    confidence,
  };
}

// ===== Assistente Editorial =====

export interface AIEditorialAssistantOptions {
  provider?: AIProvider;
  providerId?: string;
  cacheTtlMs?: number;
  cache?: AICache<AIBrief>;
}

export class AIEditorialAssistant {
  private readonly cache: AICache<AIBrief>;
  private readonly providerId?: string;
  private readonly injectedProvider?: AIProvider;

  constructor(options: AIEditorialAssistantOptions = {}) {
    this.cache = options.cache ?? new AICache<AIBrief>(options.cacheTtlMs ?? DEFAULT_AI_CACHE_TTL_MS);
    this.providerId = options.providerId;
    this.injectedProvider = options.provider;
  }

  getProvider(): AIProvider {
    return this.injectedProvider ?? createAIProvider(this.providerId ?? resolveDefaultProviderId());
  }

  clearCache(): void {
    this.cache.clear();
  }

  /** Gera (ou reaproveita do cache) o briefing inteligente da partida. */
  async generateBrief(input: AIBriefInput, opts: { force?: boolean } = {}): Promise<AIBrief> {
    const key = buildAICacheKey(input.game.id, buildInputSignature(input));

    if (!opts.force) {
      const cached = this.cache.get(key);
      if (cached) return { ...cached, meta: { ...cached.meta!, cached: true } };
    }

    const provider = this.getProvider();
    const prompt = buildPrompt(input);
    const startedAt = Date.now();
    const result = await provider.complete(prompt, { temperature: 0.4 });
    const brief = parseAIBrief(result.text);

    const withMeta: AIBrief = {
      ...brief,
      meta: {
        provider: result.provider,
        model: result.model,
        cached: false,
        generatedAt: new Date().toISOString(),
        latencyMs: Date.now() - startedAt,
      },
    };

    this.cache.set(key, withMeta);
    return withMeta;
  }
}

let singleton: AIEditorialAssistant | undefined;

export function getAIEditorialAssistant(): AIEditorialAssistant {
  if (!singleton) {
    const ttl = Number(env("AI_BRIEF_TTL_MS"));
    singleton = new AIEditorialAssistant({
      cacheTtlMs: Number.isFinite(ttl) && ttl > 0 ? ttl : DEFAULT_AI_CACHE_TTL_MS,
    });
  }
  return singleton;
}
