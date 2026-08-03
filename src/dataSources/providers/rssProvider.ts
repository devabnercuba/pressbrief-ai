// RSS Provider — lê feeds XML e extrai jogos dos títulos/descrições.
import type { DataSourceProvider, ProviderContext } from "../dataSourceTypes";
import { normalizeGames } from "../gameNormalizer";
import { parseMatchLines, stripHtml } from "@/parsers/baseParser";
import { fetchRemoteDocument } from "@/lib/remote-document.functions";

export function parseRssContent(xml: string, sourceName: string) {
  const items = Array.from(xml.matchAll(/<item[\s\S]*?<\/item>/gi)).map((m) => m[0]);
  const blocks = items.length > 0 ? items : [xml];
  const raws = blocks.flatMap((block) => parseMatchLines(stripHtml(block)));
  return normalizeGames(raws, sourceName);
}

export const rssProvider: DataSourceProvider = {
  type: "rss",
  label: "RSS",
  async load({ source }: ProviderContext) {
    const content = source.content
      ? source.content
      : source.url
        ? (await fetchRemoteDocument({ data: { url: source.url } })).body
        : "";
    if (!content.trim()) return [];
    return parseRssContent(content, source.name);
  },
};
