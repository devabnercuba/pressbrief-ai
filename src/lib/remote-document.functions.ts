// Server function para baixar documentos remotos (HTML, CSV, JSON, XML).
// O download acontece no servidor para evitar CORS e esconder headers.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { downloadDocument } from "./remote-document.server";

export interface RemoteDocument {
  url: string;
  contentType: string;
  body: string;
}

export const fetchRemoteDocument = createServerFn({ method: "GET" })
  .inputValidator((input: { url: string }) =>
    z.object({ url: z.string().url().max(2000) }).parse(input),
  )
  .handler(async ({ data }): Promise<RemoteDocument> => downloadDocument(data.url));
