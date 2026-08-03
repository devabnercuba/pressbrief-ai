// Download server-only de documentos remotos usados pelo URL Provider.
import { fetchWithRetry, DEFAULT_TIMEOUT_MS, HttpError } from "./http-retry";
import { logger } from "./logger";

const MAX_BYTES = 2_000_000;

export async function downloadDocument(url: string) {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("Protocolo não suportado.");
  }

  const started = Date.now();
  const res = await fetchWithRetry(
    url,
    {
      headers: {
        "User-Agent": "PressBriefAI/1.0 (+data-source)",
        Accept: "text/html,application/xhtml+xml,application/json,text/csv,application/xml;q=0.9,*/*;q=0.8",
      },
    },
    { timeoutMs: DEFAULT_TIMEOUT_MS },
  );

  if (!res.ok) throw new HttpError(res.status, `A fonte respondeu ${res.status}.`);

  const body = (await res.text()).slice(0, MAX_BYTES);
  logger.query({ scope: `uds download ${parsed.hostname}`, durationMs: Date.now() - started });

  return {
    url,
    contentType: res.headers.get("content-type") ?? "",
    body,
  };
}
