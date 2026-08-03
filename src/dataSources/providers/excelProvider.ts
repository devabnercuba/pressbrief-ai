// Excel Provider — suporta CSV/TSV exportado de planilhas hoje; arquivos
// .xlsx binários serão habilitados sem alterar Engines nem o Manager.
import type { DataSourceProvider, ProviderContext } from "../dataSourceTypes";
import { normalizeGames } from "../gameNormalizer";
import { extractRows, rowsToGames } from "@/parsers/genericTableParser";
import { fetchRemoteDocument } from "@/lib/remote-document.functions";

export function parseSpreadsheet(content: string, sourceName: string) {
  const rows = extractRows(content);
  return normalizeGames(rowsToGames(rows, { sourceName }), sourceName);
}

export const excelProvider: DataSourceProvider = {
  type: "excel",
  label: "Planilha (CSV/Excel)",
  async load({ source }: ProviderContext) {
    const content = source.content
      ? source.content
      : source.url
        ? (await fetchRemoteDocument({ data: { url: source.url } })).body
        : "";
    if (!content.trim()) return [];
    if (content.startsWith("PK")) {
      throw new Error("Arquivos .xlsx ainda não são suportados — exporte como CSV.");
    }
    return parseSpreadsheet(content, source.name);
  },
};
