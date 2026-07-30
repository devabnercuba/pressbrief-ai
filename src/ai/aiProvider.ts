// Contrato genérico de provedores de IA + registry.
// Permite plugar OpenAI, Gemini, Claude, Azure OpenAI ou modelos locais
// sem alterar o restante do PressBrief.

import type { AICompletionOptions, AICompletionResult, AIPrompt } from "./aiTypes";

export interface AIProvider {
  /** Identificador estável (ex.: "openai", "lovable", "gemini"). */
  readonly id: string;
  readonly name: string;
  readonly model: string;
  /** Executa uma completion de texto a partir de um prompt estruturado. */
  complete(prompt: AIPrompt, options?: AICompletionOptions): Promise<AICompletionResult>;
}

export type AIProviderFactory = () => AIProvider;

const registry = new Map<string, AIProviderFactory>();

export function registerAIProvider(id: string, factory: AIProviderFactory): void {
  registry.set(id, factory);
}

export function createAIProvider(id: string): AIProvider {
  const factory = registry.get(id);
  if (!factory) {
    throw new Error(`AI provider não registrado: ${id}. Registrados: ${listAIProviders().join(", ") || "nenhum"}`);
  }
  return factory();
}

export function hasAIProvider(id: string): boolean {
  return registry.has(id);
}

export function listAIProviders(): string[] {
  return Array.from(registry.keys());
}

export function resetAIProviders(): void {
  registry.clear();
}
