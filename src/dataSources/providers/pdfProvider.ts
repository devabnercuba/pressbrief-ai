// PDF Provider — aceita texto já extraído de PDF (colado ou servido como
// texto). A extração binária será plugada aqui sem afetar o restante.
import type { DataSourceProvider, ProviderContext } from "../dataSourceTypes";
import { normalizeGames } from "../gameNormalizer";
import { parseMatchLines } from "@/parsers/baseParser";
import { fetchRemoteDocument } from "@/lib/remote-document.functions";

export function parsePdfText(text: string, sourceName: string) {
  return normalizeGames(parseMatchLines(text), sourceName);
}

export const pdfProvider: DataSourceProvider = {
  type: "pdf",
  label: "PDF",
  async load({ source }: ProviderContext) {
    const content = source.content
      ? source.content
      : source.url
        ? (await fetchRemoteDocument({ data: { url: source.url } })).body
        : "";
    if (!content.trim()) return [];
    if (content.startsWith("%PDF")) {
      throw new Error("PDF binário ainda não é suportado — cole o texto do documento.");
    }
    return parsePdfText(content, source.name);
  },
};
