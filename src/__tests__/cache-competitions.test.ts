// Testes do cache (TTL, dedupe de requisições, fallback offline) e do
// filtro de competições suportadas.
import { test } from "node:test";
import assert from "node:assert/strict";
import { DataCache } from "../services/apiCache";
import {
  SUPPORTED_COMPETITION_CODES,
  isSupportedCompetition,
  normalizeCompetitionName,
} from "../config/supportedCompetitions";

test("DataCache: segunda chamada dentro do TTL não consulta a API", async () => {
  const cache = new DataCache(10 * 60 * 1000);
  let calls = 0;
  const loader = async () => {
    calls++;
    return [1, 2, 3];
  };
  const first = await cache.fetch("k", loader);
  const second = await cache.fetch("k", loader);
  assert.equal(calls, 1);
  assert.equal(first.source, "fresh");
  assert.equal(second.source, "cache");
  assert.deepEqual(second.data, [1, 2, 3]);
});

test("DataCache: TTL expirado dispara nova consulta", async () => {
  const cache = new DataCache(1);
  let calls = 0;
  await cache.fetch("k", async () => ++calls);
  await new Promise((r) => setTimeout(r, 5));
  await cache.fetch("k", async () => ++calls);
  assert.equal(calls, 2);
});

test("DataCache: requisições simultâneas para a mesma chave são reaproveitadas", async () => {
  const cache = new DataCache();
  let calls = 0;
  const loader = async () => {
    calls++;
    await new Promise((r) => setTimeout(r, 10));
    return "x";
  };
  const [a, b] = await Promise.all([cache.fetch("dup", loader), cache.fetch("dup", loader)]);
  assert.equal(calls, 1);
  assert.equal(a.data, "x");
  assert.equal(b.data, "x");
});

test("DataCache: offline usa o último valor válido (stale)", async () => {
  const cache = new DataCache(1);
  await cache.fetch("k", async () => "antigo");
  await new Promise((r) => setTimeout(r, 5));
  const res = await cache.fetch("k", async () => {
    throw new Error("API fora do ar");
  });
  assert.equal(res.source, "stale");
  assert.equal(res.data, "antigo");
});

test("DataCache: sem cache anterior, o erro é propagado para tratamento na UI", async () => {
  const cache = new DataCache();
  await assert.rejects(cache.fetch("novo", async () => {
    throw new Error("429");
  }));
});

test("competições: apenas nacionais e continentais são aceitas", () => {
  assert.ok(isSupportedCompetition({ code: "BSA" }));
  assert.ok(isSupportedCompetition({ name: "Campeonato Brasileiro Série A" }));
  assert.ok(isSupportedCompetition({ name: "Copa Libertadores" }));
  assert.ok(isSupportedCompetition({ name: "Copa Sudamericana" }));
  assert.equal(isSupportedCompetition({ code: "PL", name: "Premier League" }), false);
  assert.equal(isSupportedCompetition({ code: "PD", name: "Primera Division" }), false);
  assert.equal(isSupportedCompetition({ name: "Bundesliga" }), false);
});

test("competições: normalização ignora acentos e caixa", () => {
  assert.equal(normalizeCompetitionName("Série A"), "serie a");
  assert.ok(isSupportedCompetition({ name: "brasileirão série b" }));
});

test("competições: lista de códigos habilitados cobre as 9 competições", () => {
  assert.equal(SUPPORTED_COMPETITION_CODES.length, 9);
});
