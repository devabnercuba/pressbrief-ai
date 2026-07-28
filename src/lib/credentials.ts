// Lógica pura do fluxo de credenciamento. Sem React nem UI —
// facilita testes e futura sincronização com Supabase.
import type { Game } from "@/types";

export const CREDENTIAL_STATUSES = [
  "INTERESSE",
  "NÃO SOLICITADO",
  "SOLICITADO",
  "APROVADO",
  "NEGADO",
  "CANCELADO",
] as const;

export type CredentialStatus = (typeof CREDENTIAL_STATUSES)[number];

export interface CredentialRequest {
  id: string;
  gameId: string;
  status: CredentialStatus;
  requestedAt: string | null;
  expectedResponseDate: string | null;
  approvedAt: string | null;
  notes: string;
  game: Game; // snapshot p/ renderização offline
}

export function createRequest(game: Game, status: CredentialStatus = "INTERESSE"): CredentialRequest {
  return {
    id: `cr-${game.id}`,
    gameId: game.id,
    status,
    requestedAt: status === "SOLICITADO" ? new Date().toISOString() : null,
    expectedResponseDate: null,
    approvedAt: status === "APROVADO" ? new Date().toISOString() : null,
    notes: "",
    game,
  };
}

// Aplica uma transição de status, ajustando timestamps derivados.
export function transitionStatus(
  req: CredentialRequest,
  next: CredentialStatus,
  now: Date = new Date(),
): CredentialRequest {
  const iso = now.toISOString();
  return {
    ...req,
    status: next,
    requestedAt: next === "SOLICITADO" && !req.requestedAt ? iso : req.requestedAt,
    approvedAt: next === "APROVADO" ? iso : next === "NEGADO" || next === "CANCELADO" ? null : req.approvedAt,
  };
}

export function groupByStatus(
  requests: CredentialRequest[],
): Record<CredentialStatus, CredentialRequest[]> {
  const base = Object.fromEntries(
    CREDENTIAL_STATUSES.map((s) => [s, [] as CredentialRequest[]]),
  ) as Record<CredentialStatus, CredentialRequest[]>;
  for (const r of requests) base[r.status].push(r);
  return base;
}

export function approvedRequests(requests: CredentialRequest[]): CredentialRequest[] {
  return requests.filter((r) => r.status === "APROVADO");
}

export function pendingRequests(requests: CredentialRequest[]): CredentialRequest[] {
  return requests.filter((r) => r.status === "SOLICITADO" || r.status === "NÃO SOLICITADO");
}
