// JSON Provider — aceita URL ou conteúdo colado contendo JSON.
import type { DataSourceProvider, ProviderContext, RawGameInput } from "../dataSourceTypes";
import { normalizeGames } from "../gameNormalizer";
import { fetchRemoteDocument } from "@/lib/remote-document.functions";

/** Aceita array na raiz ou objeto com `games`/`matches`/`data`. */
export function extractJsonGames(payload: unknown): RawGameInput[] {
  if (Array.isArray(payload)) return payload as RawGameInput[];
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    for (const key of ["games", "matches", "jogos", "data", "items"]) {
      if (Array.isArray(record[key])) return record[key] as RawGameInput[];
    }
  }
  return [];
}

export function parseJsonContent(content: string, sourceName: string) {
  const payload = JSON.parse(content) as unknown;
  return normalizeGames(extractJsonGames(payload), sourceName);
}

export const jsonProvider: DataSourceProvider = {
  type: "json",
  label: "JSON",
  async load({ source }: ProviderContext) {
    const content = source.content
      ? source.content
      : source.url
        ? (await fetchRemoteDocument({ data: { url: source.url } })).body
        : "";
    if (!content.trim()) return [];
    return parseJsonContent(content, source.name);
  },
};
