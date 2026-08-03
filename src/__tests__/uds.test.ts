// Testes do Universal Data Source (UDS): normalizer, registry, parsers CBF/FCF,
// URL Provider e DataSource Manager.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeDate,
  normalizeTime,
  normalizeGame,
  normalizeGames,
  isValidGame,
  toAppGame,
} from "../dataSources/gameNormalizer";
import { ProviderRegistry } from "../dataSources/providerRegistry";
import { DataSourceManager } from "../dataSources/dataSourceManager";
import { createUrlProvider } from "../dataSources/providers/urlProvider";
import { cbfParser } from "../parsers/cbfParser";
import { fcfParser } from "../parsers/fcfParser";
import { selectParser } from "../parsers";
import type { DataSourceConfig, DataSourceProvider } from "../dataSources/dataSourceTypes";

// ---------- Game Normalizer ----------

test("normalizeDate aceita ISO, BR e texto", () => {
  assert.equal(normalizeDate("2026-04-12"), "2026-04-12");
  assert.equal(normalizeDate("12/04/2026"), "2026-04-12");
  assert.equal(normalizeDate("12 de abril de 2026"), "2026-04-12");
  assert.equal(normalizeDate(""), "");
});

test("normalizeTime aceita 16h, 16h30 e 16:00", () => {
  assert.equal(normalizeTime("16h"), "16:00");
  assert.equal(normalizeTime("16h30"), "16:30");
  assert.equal(normalizeTime("16:00:00"), "16:00");
  assert.equal(normalizeTime("abc"), "");
});

test("normalizeGame preenche o modelo universal", () => {
  const game = normalizeGame(
    { date: "12/04/2026", time: "16h", homeTeam: " Grêmio ", awayTeam: "Bahia" },
    "CBF",
  );
  assert.equal(game.date, "2026-04-12");
  assert.equal(game.time, "16:00");
  assert.equal(game.homeTeam, "Grêmio");
  assert.equal(game.source, "CBF");
  assert.equal(game.country, "Brasil");
  assert.ok(isValidGame(game));
});

test("normalizeGames descarta inválidos e duplicados", () => {
  const games = normalizeGames(
    [
      { date: "2026-04-12", homeTeam: "A", awayTeam: "B" },
      { date: "2026-04-12", homeTeam: "A", awayTeam: "B" },
      { date: "", homeTeam: "C", awayTeam: "D" },
      { date: "2026-04-11", homeTeam: "E", awayTeam: "E" },
    ],
    "Fonte",
  );
  assert.equal(games.length, 1);
});

test("toAppGame produz um Game consumível pelos Engines", () => {
  const game = toAppGame(normalizeGame({ date: "2026-04-12", homeTeam: "A", awayTeam: "B" }, "X"));
  assert.equal(game.homeTeam, "A");
  assert.equal(game.date, "2026-04-12");
  assert.ok(game.homeCrest.startsWith("data:image/svg+xml"));
});

// ---------- Parsers ----------

const CBF_HTML = `<html><body><h1>Confederação Brasileira de Futebol</h1>
<p>12/04/2026 16:00 Grêmio x Bahia — Arena do Grêmio</p>
<p>13/04/2026 18:30 Santos x Flamengo — Vila Belmiro</p></body></html>`;

test("CBF parser reconhece e extrai jogos", () => {
  const context = { url: "https://www.cbf.com.br/tabela", sourceName: "CBF" };
  assert.ok(cbfParser.canParse(CBF_HTML, context));
  const games = cbfParser.parse(CBF_HTML, context);
  assert.equal(games.length, 2);
  assert.equal(games[0].homeTeam?.trim(), "Grêmio");
  assert.match(String(games[0].competition), /Brasileiro/);
});

test("FCF parser aplica estado SC", () => {
  const html = `<html><body>Federação Catarinense de Futebol
  <p>20/01/2026 20:00 Avaí x Chapecoense — Ressacada</p></body></html>`;
  const context = { url: "https://fcf.com.br/jogos", sourceName: "FCF" };
  assert.ok(fcfParser.canParse(html, context));
  const games = fcfParser.parse(html, context);
  assert.equal(games.length, 1);
  assert.equal(games[0].state, "SC");
});

test("selectParser escolhe pelo domínio", () => {
  const parser = selectParser(CBF_HTML, { url: "https://cbf.com.br/x", sourceName: "CBF" });
  assert.equal(parser?.id, "cbf");
});

test("tabela genérica é reconhecida por cabeçalhos", () => {
  const csv = "Data;Hora;Mandante;Visitante;Estádio\n12/04/2026;16:00;Grêmio;Bahia;Arena";
  const parser = selectParser(csv, { sourceName: "Planilha" });
  assert.equal(parser?.id, "generic-table");
  assert.equal(parser?.parse(csv, { sourceName: "Planilha" }).length, 1);
});

// ---------- URL Provider ----------

test("URL Provider baixa, escolhe parser e normaliza", async () => {
  const provider = createUrlProvider(async (url) => ({
    url,
    contentType: "text/html",
    body: CBF_HTML,
  }));
  const games = await provider.load({
    source: { id: "1", name: "CBF", type: "url", url: "https://cbf.com.br/tabela", enabled: true },
  });
  assert.equal(games.length, 2);
  assert.equal(games[0].source, "CBF");
  assert.equal(games[0].date, "2026-04-12");
});

test("URL Provider exige URL", async () => {
  const provider = createUrlProvider(async () => ({ url: "", contentType: "", body: "" }));
  await assert.rejects(() =>
    provider.load({ source: { id: "1", name: "X", type: "url", enabled: true } }),
  );
});

// ---------- Registry ----------

test("Registry permite registrar e remover providers", () => {
  const registry = new ProviderRegistry();
  const fake: DataSourceProvider = { type: "json", label: "JSON", load: async () => [] };
  registry.register(fake);
  assert.equal(registry.get("json"), fake);
  assert.equal(registry.list().length, 1);
  registry.unregister("json");
  assert.equal(registry.has("json"), false);
});

// ---------- DataSource Manager ----------

function fakeProvider(dates: string[]): DataSourceProvider {
  return {
    type: "url",
    label: "URL",
    load: async ({ source }) =>
      normalizeGames(
        dates.map((date, i) => ({ date, homeTeam: `A${i}`, awayTeam: `B${i}` })),
        source.name,
      ),
  };
}

const urlSource: DataSourceConfig = {
  id: "s1",
  name: "CBF",
  type: "url",
  url: "https://cbf.com.br",
  enabled: true,
};

test("Manager unifica fontes, filtra período e registra estatísticas", async () => {
  const registry = new ProviderRegistry().register(fakeProvider(["2026-04-12", "2026-05-20"]));
  const manager = new DataSourceManager(registry);
  const result = await manager.load([urlSource], { dateFrom: "2026-04-01", dateTo: "2026-04-30" });

  assert.equal(result.games.length, 1);
  assert.equal(result.stats[0].status, "ok");
  assert.equal(result.stats[0].name, "CBF");
  assert.ok(result.stats[0].lastUpdate);
});

test("Manager ignora fontes desativadas", async () => {
  const registry = new ProviderRegistry().register(fakeProvider(["2026-04-12"]));
  const manager = new DataSourceManager(registry);
  const result = await manager.load([{ ...urlSource, enabled: false }]);
  assert.equal(result.games.length, 0);
});

test("Manager isola falha de uma fonte", async () => {
  const registry = new ProviderRegistry().register({
    type: "url",
    label: "URL",
    load: async () => {
      throw new Error("fonte fora do ar");
    },
  });
  const manager = new DataSourceManager(registry);
  const result = await manager.load([urlSource]);
  assert.equal(result.games.length, 0);
  assert.equal(manager.getStatsFor("s1")?.status, "erro");
  assert.match(String(manager.getStatsFor("s1")?.message), /fora do ar/);
});

test("Manager reporta provider inexistente", async () => {
  const manager = new DataSourceManager(new ProviderRegistry());
  await manager.load([urlSource]);
  assert.equal(manager.getStatsFor("s1")?.status, "erro");
});
