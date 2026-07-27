// Testes das utilidades do Calendário Inteligente.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_FILTERS,
  buildMonthGrid,
  currentAndNextMonthRange,
  filterRanked,
  gamesOnDate,
  summarizeByDay,
  toISO,
  type RankedGame,
} from "../lib/calendar-utils";
import type { Game } from "../types";
import type { AssignmentAnalysis } from "../intelligence";

function mkGame(overrides: Partial<Game> = {}): Game {
  return {
    id: "g" + Math.random(),
    homeTeam: "A",
    homeCrest: "",
    awayTeam: "B",
    awayCrest: "",
    competition: "Série A",
    date: "2026-07-15",
    time: "16:00",
    stadium: "Estádio X",
    city: "São Paulo",
    state: "SP",
    coverageScore: 0,
    editorialScore: 0,
    distanceKm: 100,
    weather: { condition: "Sol", tempC: 25, humidity: 50, icon: "sun" },
    pautasCount: 0,
    priorityPlayersCount: 0,
    opportunity: "medium",
    reasons: [],
    summary: "",
    pautas: [],
    priorityPlayers: [],
    mustShoot: [],
    checklist: [],
    shotList: [],
    ...overrides,
  };
}

function mkRanked(game: Game, a: Partial<AssignmentAnalysis>): RankedGame {
  const assignment: AssignmentAnalysis = {
    finalScore: 50,
    priority: 3,
    recommendation: "Opcional",
    summary: "",
    ...a,
  };
  return { game, assignment, coverageScore: 50, editorialScore: 50 };
}

test("filterRanked: sem filtros retorna tudo", () => {
  const items = [mkRanked(mkGame(), {}), mkRanked(mkGame({ state: "RJ" }), {})];
  assert.equal(filterRanked(items, DEFAULT_FILTERS).length, 2);
});

test("filterRanked: filtra por competição, estado e distância", () => {
  const items = [
    mkRanked(mkGame({ competition: "Série A", state: "SP", distanceKm: 50 }), {}),
    mkRanked(mkGame({ competition: "Copa do Brasil", state: "RJ", distanceKm: 500 }), {}),
  ];
  assert.equal(filterRanked(items, { ...DEFAULT_FILTERS, competition: "Série A" }).length, 1);
  assert.equal(filterRanked(items, { ...DEFAULT_FILTERS, state: "RJ" }).length, 1);
  assert.equal(filterRanked(items, { ...DEFAULT_FILTERS, maxDistanceKm: 100 }).length, 1);
});

test("filterRanked: onlyRecommended mantém apenas Recomendado", () => {
  const items = [
    mkRanked(mkGame(), { recommendation: "Recomendado" }),
    mkRanked(mkGame(), { recommendation: "Opcional" }),
    mkRanked(mkGame(), { recommendation: "Não recomendado" }),
  ];
  const out = filterRanked(items, { ...DEFAULT_FILTERS, onlyRecommended: true });
  assert.equal(out.length, 1);
  assert.equal(out[0].assignment.recommendation, "Recomendado");
});

test("gamesOnDate: filtra por data e ordena por finalScore", () => {
  const items = [
    mkRanked(mkGame({ id: "1", date: "2026-07-15" }), { finalScore: 40 }),
    mkRanked(mkGame({ id: "2", date: "2026-07-15" }), { finalScore: 90 }),
    mkRanked(mkGame({ id: "3", date: "2026-07-16" }), { finalScore: 100 }),
  ];
  const out = gamesOnDate(items, "2026-07-15");
  assert.deepEqual(out.map((r) => r.game.id), ["2", "1"]);
});

test("summarizeByDay: total, recomendados e média de prioridade", () => {
  const items = [
    mkRanked(mkGame({ date: "2026-07-15" }), { priority: 4, recommendation: "Recomendado" }),
    mkRanked(mkGame({ date: "2026-07-15" }), { priority: 2, recommendation: "Opcional" }),
    mkRanked(mkGame({ date: "2026-07-16" }), { priority: 5, recommendation: "Recomendado" }),
  ];
  const s = summarizeByDay(items);
  assert.equal(s.get("2026-07-15")!.total, 2);
  assert.equal(s.get("2026-07-15")!.recommended, 1);
  assert.equal(s.get("2026-07-15")!.avgPriority, 3);
});

test("buildMonthGrid: 42 células e começa no domingo", () => {
  const cells = buildMonthGrid(2026, 6);
  assert.equal(cells.length, 42);
  assert.equal(new Date(cells[0].dateISO + "T00:00:00").getDay(), 0);
});

test("currentAndNextMonthRange: cobre mês atual + próximo", () => {
  const r = currentAndNextMonthRange(new Date(2026, 6, 15));
  assert.equal(r.dateFrom, "2026-07-01");
  assert.equal(r.dateTo, "2026-08-31");
});

test("toISO: formata corretamente", () => {
  assert.equal(toISO(new Date(2026, 0, 5)), "2026-01-05");
});

test("meus jogos: add/remove/has (lógica de coleção)", () => {
  const list: Game[] = [];
  const add = (g: Game) => { if (!list.some((x) => x.id === g.id)) list.push(g); };
  const remove = (id: string) => { const i = list.findIndex((x) => x.id === id); if (i >= 0) list.splice(i, 1); };
  const has = (id: string) => list.some((x) => x.id === id);

  const g = mkGame({ id: "x1" });
  add(g); add(g);
  assert.equal(list.length, 1);
  assert.ok(has("x1"));
  remove("x1");
  assert.equal(list.length, 0);
});
