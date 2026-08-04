// Team Matcher — reconhece nomes diferentes do mesmo clube e devolve
// dados enriquecidos. Nunca lança erro: clube desconhecido recebe um
// escudo padrão e o nome original limpo.
import { TEAM_DATABASE } from "./teamDatabase";
import {
  canonicalKey,
  cleanText,
  normalizeTeamName,
  parseTeamName,
  similarity,
} from "./teamNormalizer";
import type { ResolvedTeam, Team, TeamMatch } from "./teamTypes";

const UNKNOWN_COLORS = { primary: "#27272A", secondary: "#A1A1AA" };

// ---------- Índices ----------
const byExact = new Map<string, Team>();
const byCanonical = new Map<string, Team[]>();
const byAbbrev = new Map<string, Team>();

function indexName(name: string, team: Team) {
  const exact = normalizeTeamName(name);
  if (exact && !byExact.has(exact)) byExact.set(exact, team);
  const canon = canonicalKey(name);
  if (canon) {
    const list = byCanonical.get(canon) ?? [];
    if (!list.includes(team)) list.push(team);
    byCanonical.set(canon, list);
  }
}

for (const team of TEAM_DATABASE) {
  indexName(team.officialName, team);
  indexName(team.shortName, team);
  for (const alias of team.aliases) indexName(alias, team);
  const abbrev = team.abbreviation.toLowerCase();
  if (!byAbbrev.has(abbrev)) byAbbrev.set(abbrev, team);
}

// ---------- Escudos ----------
function crestDataUri(label: string, primary: string, secondary: string): string {
  const text = label.slice(0, 3).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${primary}"/><stop offset="100%" stop-color="${secondary}"/></linearGradient></defs><rect width="64" height="64" rx="14" fill="url(#g)"/><text x="50%" y="57%" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="20" font-weight="700" fill="#FFFFFF" stroke="#00000055" stroke-width="0.5">${text}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function crestFor(team: Team): string {
  return team.crest ?? crestDataUri(team.abbreviation, team.colors.primary, team.colors.secondary);
}

/** Escudo padrão para clubes fora da base. */
export function defaultCrest(label = "?"): string {
  const clean = cleanText(label) || "?";
  return crestDataUri(clean, UNKNOWN_COLORS.primary, UNKNOWN_COLORS.secondary);
}

// ---------- Matching ----------
export function matchTeam(rawName: string): TeamMatch | undefined {
  const raw = cleanText(rawName);
  if (!raw) return undefined;

  const { name, state } = parseTeamName(raw);
  const candidatesFor = (list: Team[]): Team | undefined => {
    if (list.length === 1) return list[0];
    if (state) {
      const inState = list.find((t) => t.state === state);
      if (inState) return inState;
    }
    return list[0];
  };

  // 1) Nome exato (com e sem UF).
  for (const variant of [raw, name]) {
    const key = normalizeTeamName(variant);
    const hit = byExact.get(key);
    if (hit) {
      if (!state || hit.state === state || variant === raw) {
        return { team: hit, confidence: 1, strategy: "exact" };
      }
    }
  }

  // 2) Sigla.
  const abbrevHit = byAbbrev.get(normalizeTeamName(raw));
  if (abbrevHit && raw.length <= 4) {
    return { team: abbrevHit, confidence: 0.9, strategy: "abbreviation" };
  }

  // 3) Chave canônica (tokens significativos).
  for (const variant of [raw, name]) {
    const list = byCanonical.get(canonicalKey(variant));
    if (list?.length) {
      const team = candidatesFor(list);
      if (team) return { team, confidence: state && team.state === state ? 0.95 : 0.85, strategy: "alias" };
    }
  }

  // 4) Token principal + UF (ex.: "Botafogo-SP").
  if (state) {
    const tokenMatch = TEAM_DATABASE.filter(
      (t) => t.state === state && similarity(t.shortName, name) >= 0.6,
    );
    const best = tokenMatch.sort((a, b) => similarity(b.shortName, name) - similarity(a.shortName, name))[0];
    if (best) return { team: best, confidence: 0.8, strategy: "token" };
  }

  // 5) Fuzzy como último recurso.
  let bestTeam: Team | undefined;
  let bestScore = 0;
  for (const team of TEAM_DATABASE) {
    const score = Math.max(
      similarity(name, team.shortName),
      similarity(name, team.officialName),
      ...team.aliases.map((a) => similarity(name, a)),
    );
    if (score > bestScore) {
      bestScore = score;
      bestTeam = team;
    }
  }
  if (bestTeam && bestScore >= 0.82) {
    return { team: bestTeam, confidence: Number(bestScore.toFixed(2)), strategy: "fuzzy" };
  }

  return undefined;
}

/** Sempre devolve algo renderizável — nunca quebra a interface. */
export function resolveTeam(rawName: string): ResolvedTeam {
  const raw = cleanText(rawName);
  const match = matchTeam(raw);
  if (match) {
    const t = match.team;
    return {
      id: t.id,
      name: t.shortName,
      officialName: t.officialName,
      abbreviation: t.abbreviation,
      crest: crestFor(t),
      city: t.city,
      state: t.state,
      country: t.country,
      colors: t.colors,
      known: true,
      confidence: match.confidence,
    };
  }

  const { name, state } = parseTeamName(raw);
  const fallbackName = name || raw || "Não informado";
  const initials = fallbackName
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();

  return {
    id: `desconhecido-${normalizeTeamName(fallbackName).replace(/\s+/g, "-") || "clube"}`,
    name: fallbackName,
    officialName: fallbackName,
    abbreviation: initials || "N/I",
    crest: defaultCrest(initials || fallbackName),
    city: "Não informado",
    state: state ?? "Não informado",
    country: "Brasil",
    colors: UNKNOWN_COLORS,
    known: false,
    confidence: 0,
  };
}

/** Atalho usado por parsers: nome canônico curto. */
export function canonicalTeamName(rawName: string): string {
  return resolveTeam(rawName).name;
}
