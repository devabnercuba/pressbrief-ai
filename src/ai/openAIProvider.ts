// Provider compatível com a API OpenAI (chat/completions).
// Suporta OpenAI direto (OPENAI_API_KEY) e o gateway de IA da plataforma
// (LOVABLE_API_KEY) — ambos usam o mesmo formato de requisição.
// NUNCA deve ser importado por componentes React: a chave vive no servidor.

import type { AIProvider } from "./aiProvider";
import type { AICompletionOptions, AICompletionResult, AIPrompt } from "./aiTypes";

export interface OpenAIProviderConfig {
  apiKey: string;
  model?: string;
  baseUrl?: string;
  /** Header usado para autenticação (gateway usa header próprio). */
  authHeader?: "authorization" | "lovable";
  id?: string;
  name?: string;
  fetchImpl?: typeof fetch;
}

export function createOpenAIProvider(config: OpenAIProviderConfig): AIProvider {
  const {
    apiKey,
    model = "gpt-4o-mini",
    baseUrl = "https://api.openai.com/v1",
    authHeader = "authorization",
    id = "openai",
    name = "OpenAI",
    fetchImpl,
  } = config;

  if (!apiKey) throw new Error("AI provider sem API key configurada.");

  return {
    id,
    name,
    model,
    async complete(prompt: AIPrompt, options: AICompletionOptions = {}): Promise<AICompletionResult> {
      const doFetch = fetchImpl ?? fetch;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (authHeader === "lovable") {
        headers["Lovable-API-Key"] = apiKey;
        headers["X-Lovable-AIG-SDK"] = "fetch";
      } else {
        headers["Authorization"] = `Bearer ${apiKey}`;
      }

      const res = await doFetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model,
          messages: prompt.messages,
          ...(options.temperature !== undefined ? { temperature: options.temperature } : {}),
          ...(options.maxTokens ? { max_tokens: options.maxTokens } : {}),
          ...(options.json === false ? {} : { response_format: { type: "json_object" } }),
        }),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        if (res.status === 429) throw new Error("Limite de requisições de IA atingido. Tente novamente em instantes.");
        if (res.status === 402) throw new Error("Créditos de IA esgotados. Adicione créditos para continuar.");
        throw new Error(`Falha na requisição de IA (${res.status}): ${body.slice(0, 300)}`);
      }

      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const text = data.choices?.[0]?.message?.content ?? "";
      return { text, model, provider: id };
    },
  };
}
