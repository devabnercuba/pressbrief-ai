// Team Normalizer — limpeza e canonicalização de nomes de clubes.
// Usado pelo TeamMatcher e por qualquer parser que precise comparar nomes.

const STATE_CODES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
  "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
  "SP", "SE", "TO",
];

/** Sufixos/prefixos societários e esportivos irrelevantes para o matching. */
const NOISE_TOKENS = new Set([
  "futebol", "clube", "esporte", "esportivo", "esportiva", "associacao",
  "atletico", "atletica", "sociedade", "sport", "club", "sc", "ec", "fc",
  "ac", "cr", "sa", "ltda", "sad", "saf", "recreativo", "regatas", "gremio",
  "clube de regatas", "de", "do", "da", "dos", "das", "e",
]);

export function stripAccents(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/** Remove HTML residual, caracteres duplicados e espaços extras. */
export function cleanText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/[\u00a0\t\r\n]+/g, " ")
    .replace(/([–—-])\1+/g, "$1")
    .replace(/\s*[-–—]\s*$/g, "")
    .replace(/^\s*[-–—]\s*/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export interface ParsedTeamName {
  /** Nome limpo, sem sufixo de estado. */
  name: string;
  /** UF detectada no sufixo (ex.: "Botafogo-SP" → "SP"). */
  state?: string;
}

/** Separa o sufixo de estado: "Operário-PR", "Botafogo (SP)", "Atlético MG". */
export function parseTeamName(raw: string): ParsedTeamName {
  const value = cleanText(raw);
  const match = /^(.*?)[\s]*[-–—/(]\s*([A-Za-z]{2})\s*\)?$/.exec(value);
  if (match) {
    const uf = match[2].toUpperCase();
    if (STATE_CODES.includes(uf)) {
      return { name: cleanText(match[1]), state: uf };
    }
  }
  return { name: value };
}

/** Chave de comparação: minúscula, sem acento, sem pontuação. */
export function normalizeTeamName(raw: string): string {
  return stripAccents(cleanText(raw))
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Tokens significativos (sem ruído societário). */
export function significantTokens(raw: string): string[] {
  return normalizeTeamName(raw)
    .split(" ")
    .filter((t) => t.length > 1 && !NOISE_TOKENS.has(t));
}

/** Chave canônica: tokens significativos ordenados. */
export function canonicalKey(raw: string): string {
  const tokens = significantTokens(raw);
  return (tokens.length > 0 ? tokens : normalizeTeamName(raw).split(" ")).sort().join(" ");
}

/** Similaridade 0..1 (Dice sobre bigramas) — usada como último recurso. */
export function similarity(a: string, b: string): number {
  const x = normalizeTeamName(a).replace(/\s/g, "");
  const y = normalizeTeamName(b).replace(/\s/g, "");
  if (!x || !y) return 0;
  if (x === y) return 1;
  const bigrams = (s: string) => {
    const out = new Map<string, number>();
    for (let i = 0; i < s.length - 1; i++) {
      const g = s.slice(i, i + 2);
      out.set(g, (out.get(g) ?? 0) + 1);
    }
    return out;
  };
  const ba = bigrams(x);
  const bb = bigrams(y);
  let hits = 0;
  for (const [g, n] of ba) hits += Math.min(n, bb.get(g) ?? 0);
  const total = x.length - 1 + (y.length - 1);
  return total > 0 ? (2 * hits) / total : 0;
}

export { STATE_CODES };
