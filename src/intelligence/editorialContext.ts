// Editorial Context — deriva relevância editorial e fatores narrativos
// a partir do jogo (competição, clubes, rodada, clássico) e das notícias
// coletadas pela News Intelligence. Evita que o Editorial Score fique
// zerado quando existe informação relevante.
import { KNOWN_DERBIES, EDITORIAL_KEYWORDS, type EditorialFactorKey } from "./editorialRules";
import { COMPETITION_TIER, CLUB_TIER, DIVISION_TIER, DEFAULT_CLUB_SCORE } from "./coverageRules";
import { matchTeam } from "@/data/teamDatabase";
import type { GameNewsAnalysis } from "@/news/newsTypes";

const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n));

export interface EditorialContextInput {
  competition?: string;
  homeTeam?: string;
  awayTeam?: string;
  round?: string;
  summary?: string;
  reasons?: string[];
  news?: GameNewsAnalysis;
}

function competitionRelevance(name?: string): number {
  if (!name) return 35;
  const direct = COMPETITION_TIER[name];
  if (direct != null) return direct;
  const lower = name.toLowerCase();
  const hit = Object.entries(COMPETITION_TIER).find(([k]) => lower.includes(k.toLowerCase()));
  return hit ? hit[1] : 40;
}

function clubRelevance(name?: string): number {
  if (!name) return DEFAULT_CLUB_SCORE;
  const direct = CLUB_TIER[name];
  if (direct != null) return direct;
  const match = matchTeam(name);
  if (match) return CLUB_TIER[match.team.shortName] ?? DIVISION_TIER[match.team.division ?? "D"] ?? DEFAULT_CLUB_SCORE;
  return DEFAULT_CLUB_SCORE;
}

export function isKnownDerby(home?: string, away?: string): boolean {
  if (!home || !away) return false;
  return KNOWN_DERBIES.some(([a, b]) => (a === home && b === away) || (a === away && b === home));
}

/** Número da rodada, quando disponível ("12ª rodada" → 12). */
export function roundNumber(round?: string): number | undefined {
  if (!round) return undefined;
  const m = /(\d{1,2})/.exec(round);
  return m ? Number(m[1]) : undefined;
}

/**
 * Relevância editorial de base (0..100): sempre > 0 quando há competição
 * ou clubes conhecidos.
 */
export function baseRelevanceFor(input: EditorialContextInput): number {
  const home = clubRelevance(input.homeTeam);
  const away = clubRelevance(input.awayTeam);
  const clubs = (home + away) / 2;
  // Sem competição informada, a relevância vem dos clubes envolvidos.
  const comp = input.competition ? competitionRelevance(input.competition) : Math.max(55, clubs);

  let base = comp * 0.5 + clubs * 0.4;

  if (isKnownDerby(input.homeTeam, input.awayTeam)) base += 12;

  const rn = roundNumber(input.round);
  if (rn != null) {
    if (rn >= 30) base += 8;      // reta final: título e rebaixamento
    else if (rn <= 3) base += 5;  // estreias
  }

  const news = input.news;
  if (news) {
    base += Math.min(12, news.totalNews * 2);
    if (news.editorialImportance === "alta") base += 10;
    else if (news.editorialImportance === "média") base += 5;
  }

  return clamp(Math.round(base));
}

function textHas(haystack: string, key: EditorialFactorKey): boolean {
  return EDITORIAL_KEYWORDS[key].some((kw) => haystack.includes(kw.toLowerCase()));
}

/** Deriva intensidade (0..100) de cada fator narrativo. */
export function deriveEditorialFactors(
  input: EditorialContextInput,
): Record<EditorialFactorKey, number> {
  const newsText = (input.news?.articles ?? [])
    .map((a) => `${a.title} ${a.summary} ${a.tags.join(" ")}`)
    .join(" ");
  const haystack = [input.summary ?? "", ...(input.reasons ?? []), newsText]
    .join(" ")
    .toLowerCase();

  const rn = roundNumber(input.round);
  const comp = competitionRelevance(input.competition);
  const clubs = (clubRelevance(input.homeTeam) + clubRelevance(input.awayTeam)) / 2;

  const factors: Record<EditorialFactorKey, number> = {
    titleRace: 0,
    relegationBattle: 0,
    farewell: 0,
    derby: 0,
    record: 0,
    debut: 0,
    injuryReturn: 0,
    coachPressure: 0,
    playerInForm: 0,
    clubCrisis: 0,
  };

  for (const key of Object.keys(factors) as EditorialFactorKey[]) {
    if (textHas(haystack, key)) factors[key] = 85;
  }

  if (isKnownDerby(input.homeTeam, input.awayTeam)) factors.derby = 100;

  // Contexto de calendário: reta final aquece título/rebaixamento.
  if (rn != null && rn >= 30 && comp >= 60) {
    factors.titleRace = Math.max(factors.titleRace, 65);
    factors.relegationBattle = Math.max(factors.relegationBattle, 60);
  }
  if (rn != null && rn <= 2) factors.debut = Math.max(factors.debut, 60);

  // Clubes de grande porte sempre têm protagonistas em evidência.
  if (clubs >= 85) factors.playerInForm = Math.max(factors.playerInForm, 62);
  else if (clubs >= 70) factors.playerInForm = Math.max(factors.playerInForm, 50);

  // Alertas de notícias reforçam crise/pressão/lesão.
  for (const insight of input.news?.insights ?? []) {
    const boost = insight.importance === "alta" ? 90 : insight.importance === "média" ? 70 : 55;
    if (insight.category === "crise") factors.clubCrisis = Math.max(factors.clubCrisis, boost);
    if (insight.category === "lesão") factors.injuryReturn = Math.max(factors.injuryReturn, boost);
    if (insight.category === "estreia") factors.debut = Math.max(factors.debut, boost);
    if (insight.category === "recorde") factors.record = Math.max(factors.record, boost);
    if (insight.category === "clássico") factors.derby = Math.max(factors.derby, boost);
  }

  return factors;
}
