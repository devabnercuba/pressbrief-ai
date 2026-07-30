import { test } from "node:test";
import assert from "node:assert/strict";
import { AI_EDITOR_SYSTEM_PROMPT, buildInputSignature, buildPrompt } from "../promptBuilder";
import { AICache, buildAICacheKey } from "../aiCache";
import { registerAIProvider, createAIProvider, hasAIProvider, listAIProviders } from "../aiProvider";
import { createOpenAIProvider } from "../openAIProvider";
import { AIEditorialAssistant, parseAIBrief } from "../aiService";
import type { AIBriefInput, AIProvider } from "../index";
import type { Game } from "@/types";

const game = {
  id: "g1",
  homeTeam: "Flamengo",
  awayTeam: "Fluminense",
  homeCrest: "",
  awayCrest: "",
  competition: "Brasileirão Série A",
  date: "2026-08-10",
  time: "16:00",
  stadium: "Maracanã",
  city: "Rio de Janeiro",
  state: "RJ",
  coverageScore: 88,
  editorialScore: 92,
  distanceKm: 20,
  weather: { condition: "Sol", tempC: 28, humidity: 60, icon: "sun" },
  pautasCount: 2,
  priorityPlayersCount: 1,
  opportunity: "high",
  reasons: ["Clássico com briga pelo título"],
  summary: "Clássico decisivo",
  pautas: [{ id: "p1", title: "Briga pelo título", description: "Líder x vice" }],
  priorityPlayers: [
    { id: "pl1", name: "Pedro", team: "Flamengo", position: "ATA", number: 9, reason: "Artilheiro", marketValue: "€20M", demand: "Alta" },
  ],
  mustShoot: ["Entrada em campo"],
  checklist: [{ id: "c1", label: "Credencial" }],
  shotList: [{ id: "s1", title: "Comemoração", description: "gol", priority: "essencial" }],
} as unknown as Game;

const input: AIBriefInput = { game };

const validJson = JSON.stringify({
  mission: "Cobrir o clássico priorizando emoção",
  executiveSummary: "Jogo decisivo pela liderança.",
  photoChecklist: [{ label: "Chegada das torcidas", reason: "Ambientação" }],
  editorialTopics: ["Briga pelo título"],
  priorityPlayers: [{ name: "Pedro", team: "Flamengo", reason: "Artilheiro" }],
  alerts: ["Chuva prevista"],
  hiddenOpportunities: ["Bastidores do vestiário"],
  recommendedShots: [{ title: "Comemoração", moment: "Gol", reason: "Alta venda" }],
  confidence: 0.8,
});

// ===== Prompt Builder =====

test("prompt builder inclui persona de editor-chefe e dados do jogo", () => {
  const prompt = buildPrompt(input);
  assert.equal(prompt.system, AI_EDITOR_SYSTEM_PROMPT);
  assert.match(prompt.system, /Editor-chefe/);
  assert.match(prompt.user, /Flamengo/);
  assert.match(prompt.user, /Maracanã/);
  assert.equal(prompt.messages.length, 2);
  assert.equal(prompt.messages[0].role, "system");
});

test("assinatura de entrada é determinística e sensível aos scores", () => {
  const a = buildInputSignature(input);
  const b = buildInputSignature(input);
  assert.equal(a, b);
  const c = buildInputSignature({
    ...input,
    coverage: { coverageScore: 10, rating: "Baixo", positives: [], attention: [], breakdown: [] },
  });
  assert.notEqual(a, c);
});

// ===== Parser =====

test("parser converte resposta JSON em AIBrief normalizado", () => {
  const brief = parseAIBrief("```json\n" + validJson + "\n```");
  assert.equal(brief.mission, "Cobrir o clássico priorizando emoção");
  assert.equal(brief.photoChecklist[0].label, "Chegada das torcidas");
  assert.equal(brief.priorityPlayers[0].name, "Pedro");
  assert.equal(brief.recommendedShots[0].title, "Comemoração");
  assert.equal(brief.confidence, 0.8);
});

test("parser normaliza confidence em escala 0-100 e itens em string", () => {
  const brief = parseAIBrief(
    JSON.stringify({ mission: "m", photoChecklist: ["Aquecimento"], confidence: 90 }),
  );
  assert.equal(brief.confidence, 0.9);
  assert.equal(brief.photoChecklist[0].label, "Aquecimento");
  assert.deepEqual(brief.alerts, []);
});

test("parser falha em resposta sem JSON", () => {
  assert.throws(() => parseAIBrief("desculpe, não posso ajudar"));
});

// ===== Provider =====

test("provider registry permite registrar e criar provedores", () => {
  registerAIProvider("fake", () => stubProvider());
  assert.ok(hasAIProvider("fake"));
  assert.ok(listAIProviders().includes("fake"));
  assert.equal(createAIProvider("fake").id, "stub");
  assert.throws(() => createAIProvider("inexistente"));
});

test("provider OpenAI-compatível envia mensagens e lê a resposta", async () => {
  let captured: { url: string; body: Record<string, unknown> } | undefined;
  const provider = createOpenAIProvider({
    apiKey: "test-key",
    model: "gpt-test",
    fetchImpl: (async (url: string, init: RequestInit) => {
      captured = { url, body: JSON.parse(String(init.body)) };
      return new Response(JSON.stringify({ choices: [{ message: { content: validJson } }] }), { status: 200 });
    }) as unknown as typeof fetch,
  });

  const result = await provider.complete(buildPrompt(input));
  assert.match(captured!.url, /chat\/completions$/);
  assert.equal((captured!.body as { model: string }).model, "gpt-test");
  assert.equal(result.text, validJson);
});

test("provider converte erro 429 em mensagem amigável", async () => {
  const provider = createOpenAIProvider({
    apiKey: "k",
    fetchImpl: (async () => new Response("rate", { status: 429 })) as unknown as typeof fetch,
  });
  await assert.rejects(() => provider.complete(buildPrompt(input)), /Limite de requisições/);
});

// ===== Cache =====

test("cache respeita TTL e chave composta", () => {
  const cache = new AICache<string>(50);
  const key = buildAICacheKey("g1", "sig");
  cache.set(key, "valor");
  assert.equal(cache.get(key), "valor");
  cache.set(key, "expirado", -1);
  assert.equal(cache.get(key), undefined);
  assert.equal(cache.size, 0);
});

// ===== AI Service =====

function stubProvider(): AIProvider & { calls: number } {
  const p = {
    id: "stub",
    name: "Stub",
    model: "stub-1",
    calls: 0,
    async complete() {
      p.calls += 1;
      return { text: validJson, model: "stub-1", provider: "stub" };
    },
  };
  return p;
}

test("AIEditorialAssistant gera briefing e reaproveita o cache", async () => {
  const provider = stubProvider();
  const assistant = new AIEditorialAssistant({ provider });

  const first = await assistant.generateBrief(input);
  assert.equal(first.meta?.cached, false);
  assert.equal(first.mission, "Cobrir o clássico priorizando emoção");

  const second = await assistant.generateBrief(input);
  assert.equal(second.meta?.cached, true);
  assert.equal(provider.calls, 1, "não deve consultar a IA novamente enquanto o cache é válido");

  const forced = await assistant.generateBrief(input, { force: true });
  assert.equal(forced.meta?.cached, false);
  assert.equal(provider.calls, 2);
});

test("cache expirado força nova consulta", async () => {
  const provider = stubProvider();
  const assistant = new AIEditorialAssistant({ provider, cacheTtlMs: -1 });
  await assistant.generateBrief(input);
  await assistant.generateBrief(input);
  assert.equal(provider.calls, 2);
});
