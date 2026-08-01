// Testes da camada HTTP resiliente: timeout, retry, 429 com "Wait X seconds",
// backoff exponencial e limite de concorrência.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ConcurrencyLimiter,
  HttpError,
  TimeoutError,
  backoffDelayMs,
  fetchWithRetry,
  parseWaitSeconds,
} from "../lib/http-retry";

const noSleep = async () => {};

function jsonResponse(status: number, body = "{}", headers: Record<string, string> = {}) {
  return new Response(body, { status, headers });
}

test("parseWaitSeconds: lê o header Retry-After", () => {
  assert.equal(parseWaitSeconds("34"), 34);
});

test("parseWaitSeconds: lê 'Wait 12 seconds' do corpo", () => {
  assert.equal(parseWaitSeconds(null, "You reached your request limit. Wait 12 seconds"), 12);
});

test("backoffDelayMs: cresce exponencialmente", () => {
  assert.ok(backoffDelayMs(0, 1000) >= 1000);
  assert.ok(backoffDelayMs(2, 1000) >= 4000);
});

test("fetchWithRetry: repete em 429 e respeita o tempo informado", async () => {
  const waits: number[] = [];
  let calls = 0;
  const res = await fetchWithRetry(
    "https://x.test",
    {},
    {
      fetchImpl: async () => {
        calls++;
        return calls === 1
          ? jsonResponse(429, "Wait 5 seconds", { "Retry-After": "5" })
          : jsonResponse(200, '{"ok":true}');
      },
      sleep: async (ms) => {
        waits.push(ms);
      },
    },
  );
  assert.equal(calls, 2);
  assert.equal(res.status, 200);
  assert.deepEqual(waits, [5000]);
});

test("fetchWithRetry: desiste após maxRetries e lança HttpError", async () => {
  await assert.rejects(
    fetchWithRetry(
      "https://x.test",
      {},
      { fetchImpl: async () => jsonResponse(429), sleep: noSleep, maxRetries: 2 },
    ),
    (err: unknown) => err instanceof HttpError && err.status === 429,
  );
});

test("fetchWithRetry: repete em erro 5xx", async () => {
  let calls = 0;
  const res = await fetchWithRetry(
    "https://x.test",
    {},
    {
      sleep: noSleep,
      fetchImpl: async () => {
        calls++;
        return calls < 3 ? jsonResponse(503) : jsonResponse(200);
      },
    },
  );
  assert.equal(res.status, 200);
  assert.equal(calls, 3);
});

test("fetchWithRetry: timeout aborta a requisição", async () => {
  await assert.rejects(
    fetchWithRetry(
      "https://x.test",
      {},
      {
        timeoutMs: 10,
        maxRetries: 0,
        sleep: noSleep,
        fetchImpl: (_url, init) =>
          new Promise((_resolve, reject) => {
            (init?.signal as AbortSignal).addEventListener("abort", () => {
              const err = new Error("aborted");
              err.name = "AbortError";
              reject(err);
            });
          }),
      },
    ),
    (err: unknown) => err instanceof TimeoutError,
  );
});

test("fetchWithRetry: 4xx comum não é repetido", async () => {
  let calls = 0;
  const res = await fetchWithRetry(
    "https://x.test",
    {},
    {
      sleep: noSleep,
      fetchImpl: async () => {
        calls++;
        return jsonResponse(404);
      },
    },
  );
  assert.equal(calls, 1);
  assert.equal(res.status, 404);
});

test("ConcurrencyLimiter: nunca ultrapassa o limite", async () => {
  const limiter = new ConcurrencyLimiter(2);
  let active = 0;
  let peak = 0;
  await Promise.all(
    Array.from({ length: 8 }, () =>
      limiter.run(async () => {
        active++;
        peak = Math.max(peak, active);
        await new Promise((r) => setTimeout(r, 5));
        active--;
      }),
    ),
  );
  assert.equal(peak, 2);
});
