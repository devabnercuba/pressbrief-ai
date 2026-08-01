// Testes do CalendarLoader — divisão em blocos de 10 dias, paralelismo,
// deduplicação e ordenação.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  MAX_DAYS_PER_REQUEST,
  loadCalendarRange,
  mergeGames,
  splitDateRange,
  type DateRange,
} from "../services/calendarLoader";
import type { Game } from "../types";

function mkGame(id: string, date: string, time = "16:00"): Game {
  return {
    id,
    homeTeam: "A",
    homeCrest: "",
    awayTeam: "B",
    awayCrest: "",
    competition: "Série A",
    date,
    time,
    stadium: "Estádio X",
    city: "São Paulo",
    state: "SP",
    coverageScore: 0,
    editorialScore: 0,
    distanceKm: 0,
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
  };
}

test("splitDateRange: período curto vira um único bloco", () => {
  const out = splitDateRange({ dateFrom: "2026-08-01", dateTo: "2026-08-05" });
  assert.deepEqual(out, [{ dateFrom: "2026-08-01", dateTo: "2026-08-05" }]);
});

test("splitDateRange: exatamente 10 dias continua em um bloco", () => {
  const out = splitDateRange({ dateFrom: "2026-08-01", dateTo: "2026-08-10" });
  assert.equal(out.length, 1);
});

test("splitDateRange: dois meses são divididos em blocos de no máximo 10 dias", () => {
  const range: DateRange = { dateFrom: "2026-08-01", dateTo: "2026-09-30" };
  const out = splitDateRange(range);
  assert.ok(out.length >= 6);
  assert.equal(out[0].dateFrom, "2026-08-01");
  assert.equal(out[out.length - 1].dateTo, "2026-09-30");
  for (const c of out) {
    const days =
      (Date.parse(`${c.dateTo}T00:00:00Z`) - Date.parse(`${c.dateFrom}T00:00:00Z`)) /
        86400000 +
      1;
    assert.ok(days <= MAX_DAYS_PER_REQUEST, `bloco com ${days} dias`);
  }
  // blocos contíguos, sem sobreposição
  for (let i = 1; i < out.length; i++) {
    const prevEnd = Date.parse(`${out[i - 1].dateTo}T00:00:00Z`);
    const curStart = Date.parse(`${out[i].dateFrom}T00:00:00Z`);
    assert.equal(curStart - prevEnd, 86400000);
  }
});

test("splitDateRange: intervalo invertido retorna vazio", () => {
  assert.deepEqual(splitDateRange({ dateFrom: "2026-08-10", dateTo: "2026-08-01" }), []);
});

test("mergeGames: remove duplicados e ordena por data e horário", () => {
  const out = mergeGames([
    [mkGame("2", "2026-08-05", "21:00"), mkGame("1", "2026-08-01")],
    [mkGame("1", "2026-08-01"), mkGame("3", "2026-08-05", "16:00")],
  ]);
  assert.deepEqual(out.map((g) => g.id), ["1", "3", "2"]);
});

test("loadCalendarRange: carrega período > 10 dias com múltiplas requisições", async () => {
  const calls: DateRange[] = [];
  const games = await loadCalendarRange(
    { dateFrom: "2026-08-01", dateTo: "2026-09-30" },
    async (chunk) => {
      calls.push(chunk);
      return [mkGame(`g-${chunk.dateFrom}`, chunk.dateFrom)];
    },
  );
  assert.ok(calls.length > 1, "deve dividir em várias requisições");
  assert.equal(games.length, calls.length);
  const dates = games.map((g) => g.date);
  assert.deepEqual(dates, [...dates].sort());
});

test("loadCalendarRange: executa blocos em paralelo", async () => {
  let active = 0;
  let peak = 0;
  await loadCalendarRange(
    { dateFrom: "2026-08-01", dateTo: "2026-09-30" },
    async () => {
      active++;
      peak = Math.max(peak, active);
      await new Promise((r) => setTimeout(r, 5));
      active--;
      return [];
    },
  );
  assert.ok(peak > 1, `esperava paralelismo, pico foi ${peak}`);
});

test("loadCalendarRange: deduplica jogos repetidos entre blocos", async () => {
  const games = await loadCalendarRange(
    { dateFrom: "2026-08-01", dateTo: "2026-08-25" },
    async () => [mkGame("mesmo", "2026-08-02")],
  );
  assert.equal(games.length, 1);
});

test("loadCalendarRange: tolerateErrors ignora blocos com falha", async () => {
  let i = 0;
  const games = await loadCalendarRange(
    { dateFrom: "2026-08-01", dateTo: "2026-08-25" },
    async (chunk) => {
      if (i++ === 0) throw new Error("400");
      return [mkGame(`g-${chunk.dateFrom}`, chunk.dateFrom)];
    },
    { tolerateErrors: true },
  );
  assert.ok(games.length >= 1);
});
