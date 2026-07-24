// Editorial Engine — módulo determinístico e independente de UI.
// Recebe fatores narrativos de uma partida e devolve uma EditorialAnalysis.
//
// Regras e pesos vivem em ./editorialRules.ts para permitir tuning sem
// alterar o algoritmo.
import {
  EDITORIAL_ABSENT_SCORE,
  EDITORIAL_KEYWORDS,
  EDITORIAL_LABELS,
  EDITORIAL_PRESENCE_THRESHOLD,
  EDITORIAL_PRESENT_SCORE,
  EDITORIAL_WEIGHTS,
  KNOWN_DERBIES,
  ratingFromScore,
  type EditorialFactorKey,
} from "./editorialRules";
import type {
  EditorialAnalysis,
  EditorialFactorBreakdown,
  EditorialInput,
} from "./types";

const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n));

function factorScore(value: boolean | number | undefined): number {
  if (value === undefined || value === null) return EDITORIAL_ABSENT_SCORE;
  if (typeof value === "boolean") return value ? EDITORIAL_PRESENT_SCORE : EDITORIAL_ABSENT_SCORE;
  if (Number.isNaN(value)) return EDITORIAL_ABSENT_SCORE;
  return clamp(value);
}

function isKnownDerby(home?: string, away?: string): boolean {
  if (!home || !away) return false;
  return KNOWN_DERBIES.some(
    ([a, b]) => (a === home && b === away) || (a === away && b === home),
  );
}

function inferFromText(text: string | undefined, key: EditorialFactorKey): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return EDITORIAL_KEYWORDS[key].some((kw) => lower.includes(kw.toLowerCase()));
}

export function analyzeEditorial(input: EditorialInput): EditorialAnalysis {
  const safe: EditorialInput = input ?? {};

  const factorValues: Record<EditorialFactorKey, boolean | number | undefined> = {
    titleRace: safe.titleRace,
    relegationBattle: safe.relegationBattle,
    farewell: safe.farewell,
    derby: safe.derby ?? isKnownDerby(safe.homeTeam, safe.awayTeam),
    record: safe.record,
    debut: safe.debut,
    injuryReturn: safe.injuryReturn,
    coachPressure: safe.coachPressure,
    playerInForm: safe.playerInForm,
    clubCrisis: safe.clubCrisis,
  };

  const breakdown: EditorialFactorBreakdown[] = (Object.keys(EDITORIAL_WEIGHTS) as EditorialFactorKey[])
    .map((key) => {
      const weight = EDITORIAL_WEIGHTS[key];
      const score = factorScore(factorValues[key]);
      return {
        key,
        label: EDITORIAL_LABELS[key],
        weight,
        score,
        contribution: weight * score,
      };
    });

  const editorialScore = clamp(Math.round(breakdown.reduce((acc, f) => acc + f.contribution, 0)));
  const rating = ratingFromScore(editorialScore);

  const positiveFactors: string[] = [];
  const attentionFactors: string[] = [];

  for (const f of breakdown) {
    if (f.score >= EDITORIAL_PRESENCE_THRESHOLD) positiveFactors.push(f.label);
  }

  // Fatores de atenção: contexto de instabilidade/risco.
  const attentionKeys: EditorialFactorKey[] = ["clubCrisis", "coachPressure", "relegationBattle"];
  for (const key of attentionKeys) {
    const f = breakdown.find((b) => b.key === key)!;
    if (f.score >= EDITORIAL_PRESENCE_THRESHOLD) attentionFactors.push(f.label);
  }

  const summary = buildSummary({
    homeTeam: safe.homeTeam,
    awayTeam: safe.awayTeam,
    competition: safe.competition,
    positiveFactors,
    rating,
  });

  return {
    editorialScore,
    rating,
    summary,
    positiveFactors,
    attentionFactors,
    breakdown,
  };
}

function buildSummary(args: {
  homeTeam?: string;
  awayTeam?: string;
  competition?: string;
  positiveFactors: string[];
  rating: EditorialAnalysis["rating"];
}): string {
  const teams = args.homeTeam && args.awayTeam ? `${args.homeTeam} x ${args.awayTeam}` : "Partida";
  const comp = args.competition ? ` pela ${args.competition}` : "";
  if (args.positiveFactors.length === 0) {
    return `${teams}${comp}: sem ganchos editoriais fortes identificados.`;
  }
  const top = args.positiveFactors.slice(0, 3).join(", ");
  return `${teams}${comp}: potencial ${args.rating.toLowerCase()} com destaques em ${top}.`;
}

// Helper para consumir objetos `Game` do domínio de UI. Como o tipo Game
// atual não carrega flags narrativas, inferimos fatores a partir de
// `reasons`/`summary` via palavras-chave definidas nas regras.
export function analyzeEditorialFromGame(game: {
  competition?: string;
  homeTeam?: string;
  awayTeam?: string;
  reasons?: string[];
  summary?: string;
}): EditorialAnalysis {
  const haystack = [game.summary ?? "", ...(game.reasons ?? [])].join(" \n ");

  return analyzeEditorial({
    competition: game.competition,
    homeTeam: game.homeTeam,
    awayTeam: game.awayTeam,
    titleRace: inferFromText(haystack, "titleRace"),
    relegationBattle: inferFromText(haystack, "relegationBattle"),
    farewell: inferFromText(haystack, "farewell"),
    derby: inferFromText(haystack, "derby") || isKnownDerby(game.homeTeam, game.awayTeam),
    record: inferFromText(haystack, "record"),
    debut: inferFromText(haystack, "debut"),
    injuryReturn: inferFromText(haystack, "injuryReturn"),
    coachPressure: inferFromText(haystack, "coachPressure"),
    playerInForm: inferFromText(haystack, "playerInForm"),
    clubCrisis: inferFromText(haystack, "clubCrisis"),
  });
}
