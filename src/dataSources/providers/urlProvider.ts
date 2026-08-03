// URL Provider — consome qualquer URL:
// URL → download → detectar domínio → parser correto → extrair → normalizar.
import type {
  DataSourceProvider,
  NormalizedGame,
  ProviderContext,
} from "../dataSourceTypes";
import { normalizeGames } from "../gameNormalizer";
import { selectParser } from "@/parsers";
import { fetchRemoteDocument } from "@/lib/remote-document.functions";

export interface RemoteDocumentLike {
  url: string;
  contentType: string;
  body: string;
}

export type DocumentFetcher = (url: string) => Promise<RemoteDocumentLike>;

const defaultFetcher: DocumentFetcher = (url) => fetchRemoteDocument({ data: { url } });

/** Parseia um documento já baixado (usado por URL, RSS, Excel, PDF…). */
export function parseDocument(
  doc: RemoteDocumentLike,
  sourceName: string,
): NormalizedGame[] {
  const context = { url: doc.url, contentType: doc.contentType, sourceName };
  const parser = selectParser(doc.body, context);
  if (!parser) return [];
  return normalizeGames(parser.parse(doc.body, context), sourceName);
}

export function createUrlProvider(fetcher: DocumentFetcher = defaultFetcher): DataSourceProvider {
  return {
    type: "url",
    label: "URL",
    async load({ source }: ProviderContext) {
      if (!source.url) throw new Error("Fonte sem URL configurada.");
      const doc = await fetcher(source.url);
      return parseDocument(doc, source.name);
    },
  };
}

export const urlProvider = createUrlProvider();
