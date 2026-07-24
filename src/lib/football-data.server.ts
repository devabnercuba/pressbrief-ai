// Server-only helpers for Football-Data.org API.
// Never import this file from client-reachable code — the filename `.server.ts`
// enforces the boundary via the bundler.
const BASE_URL = "https://api.football-data.org/v4";

export async function fdFetch<T>(path: string): Promise<T> {
  const key = process.env.FOOTBALL_DATA_API_KEY;
  if (!key) {
    throw new Error("FOOTBALL_DATA_API_KEY não está configurada no servidor.");
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "X-Auth-Token": key },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Football-Data respondeu ${res.status}${body ? `: ${body.slice(0, 200)}` : ""}`,
    );
  }
  return (await res.json()) as T;
}
