// Testes puros do fluxo de credenciamento.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  approvedRequests,
  createRequest,
  groupByStatus,
  pendingRequests,
  transitionStatus,
  type CredentialRequest,
} from "../lib/credentials";
import type { Game } from "../types";

function mkGame(id: string): Game {
  return {
    id, homeTeam: "A", homeCrest: "", awayTeam: "B", awayCrest: "",
    competition: "Série A", date: "2026-07-15", time: "16:00",
    stadium: "Estádio", city: "SP", state: "SP",
    coverageScore: 0, editorialScore: 0, distanceKm: 0,
    weather: { condition: "", tempC: 0, humidity: 0, icon: "sun" },
    pautasCount: 0, priorityPlayersCount: 0, opportunity: "medium",
    reasons: [], summary: "", pautas: [], priorityPlayers: [],
    mustShoot: [], checklist: [], shotList: [],
  };
}

test("createRequest: inicia em INTERESSE por padrão", () => {
  const r = createRequest(mkGame("g1"));
  assert.equal(r.status, "INTERESSE");
  assert.equal(r.requestedAt, null);
  assert.equal(r.approvedAt, null);
  assert.equal(r.gameId, "g1");
});

test("transitionStatus: INTERESSE → SOLICITADO grava requestedAt", () => {
  const r = createRequest(mkGame("g1"));
  const next = transitionStatus(r, "SOLICITADO", new Date("2026-07-10T12:00:00Z"));
  assert.equal(next.status, "SOLICITADO");
  assert.equal(next.requestedAt, "2026-07-10T12:00:00.000Z");
});

test("transitionStatus: SOLICITADO → APROVADO grava approvedAt e preserva requestedAt", () => {
  let r = createRequest(mkGame("g1"));
  r = transitionStatus(r, "SOLICITADO", new Date("2026-07-10T12:00:00Z"));
  const approved = transitionStatus(r, "APROVADO", new Date("2026-07-11T09:00:00Z"));
  assert.equal(approved.status, "APROVADO");
  assert.equal(approved.approvedAt, "2026-07-11T09:00:00.000Z");
  assert.equal(approved.requestedAt, "2026-07-10T12:00:00.000Z");
});

test("transitionStatus: APROVADO → NEGADO limpa approvedAt", () => {
  let r = createRequest(mkGame("g1"));
  r = transitionStatus(r, "APROVADO");
  const denied = transitionStatus(r, "NEGADO");
  assert.equal(denied.status, "NEGADO");
  assert.equal(denied.approvedAt, null);
});

test("groupByStatus: separa por status", () => {
  const list: CredentialRequest[] = [
    createRequest(mkGame("a")),
    transitionStatus(createRequest(mkGame("b")), "SOLICITADO"),
    transitionStatus(createRequest(mkGame("c")), "APROVADO"),
    transitionStatus(createRequest(mkGame("d")), "APROVADO"),
  ];
  const g = groupByStatus(list);
  assert.equal(g["INTERESSE"].length, 1);
  assert.equal(g["SOLICITADO"].length, 1);
  assert.equal(g["APROVADO"].length, 2);
  assert.equal(g["NEGADO"].length, 0);
});

test("approvedRequests: exibição automática na Agenda", () => {
  const list: CredentialRequest[] = [
    createRequest(mkGame("a")),
    transitionStatus(createRequest(mkGame("b")), "APROVADO"),
    transitionStatus(createRequest(mkGame("c")), "NEGADO"),
  ];
  const out = approvedRequests(list);
  assert.equal(out.length, 1);
  assert.equal(out[0].gameId, "b");
});

test("pendingRequests: conta SOLICITADO e NÃO SOLICITADO", () => {
  const list: CredentialRequest[] = [
    transitionStatus(createRequest(mkGame("a")), "SOLICITADO"),
    transitionStatus(createRequest(mkGame("b")), "NÃO SOLICITADO"),
    transitionStatus(createRequest(mkGame("c")), "APROVADO"),
    createRequest(mkGame("d")),
  ];
  assert.equal(pendingRequests(list).length, 2);
});

test("movimentação completa: INTERESSE → SOLICITADO → APROVADO → Agenda", () => {
  let r = createRequest(mkGame("g1"));
  assert.equal(r.status, "INTERESSE");
  r = transitionStatus(r, "SOLICITADO");
  assert.equal(r.status, "SOLICITADO");
  assert.ok(r.requestedAt);
  r = transitionStatus(r, "APROVADO");
  assert.equal(r.status, "APROVADO");
  const agenda = approvedRequests([r]);
  assert.equal(agenda.length, 1);
});
