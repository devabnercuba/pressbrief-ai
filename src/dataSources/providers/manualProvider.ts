// Manual Provider — conteúdo colado pelo usuário (tabela, CSV ou texto).
import type { DataSourceProvider, ProviderContext } from "../dataSourceTypes";
import { parseDocument } from "./urlProvider";

export const manualProvider: DataSourceProvider = {
  type: "manual",
  label: "Manual",
  async load({ source }: ProviderContext) {
    if (!source.content?.trim()) return [];
    return parseDocument(
      { url: source.url ?? "", contentType: "text/plain", body: source.content },
      source.name,
    );
  },
};
