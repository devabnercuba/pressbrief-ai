// Regras e pesos configuráveis do Editorial Engine.
// Alterar aqui NÃO deve exigir mudanças no algoritmo (editorialEngine.ts).

export type EditorialFactorKey =
  | "titleRace"
  | "relegationBattle"
  | "farewell"
  | "derby"
  | "record"
  | "debut"
  | "injuryReturn"
  | "coachPressure"
  | "playerInForm"
  | "clubCrisis";

export interface EditorialWeights {
  titleRace: number;
  relegationBattle: number;
  farewell: number;
  derby: number;
  record: number;
  debut: number;
  injuryReturn: number;
  coachPressure: number;
  playerInForm: number;
  clubCrisis: number;
}

// Pesos somam 1.0 (100%).
export const EDITORIAL_WEIGHTS: EditorialWeights = {
  titleRace: 0.18,
  relegationBattle: 0.15,
  derby: 0.15,
  farewell: 0.1,
  record: 0.1,
  clubCrisis: 0.08,
  coachPressure: 0.07,
  playerInForm: 0.07,
  injuryReturn: 0.05,
  debut: 0.05,
};

export const EDITORIAL_LABELS: Record<EditorialFactorKey, string> = {
  titleRace: "Briga pelo título",
  relegationBattle: "Briga contra o rebaixamento",
  farewell: "Despedida",
  derby: "Clássico",
  record: "Recorde em jogo",
  debut: "Estreia",
  injuryReturn: "Retorno de lesão",
  coachPressure: "Técnico pressionado",
  playerInForm: "Jogador em grande fase",
  clubCrisis: "Crise no clube",
};

// Pontuação aplicada quando o fator está presente (true) ou ausente (false).
// Valores 0..100.
export const EDITORIAL_PRESENT_SCORE = 100;
export const EDITORIAL_ABSENT_SCORE = 0;

// Limiar para considerar um fator como "presente" quando vier como número (0..100).
export const EDITORIAL_PRESENCE_THRESHOLD = 60;

// Clássicos conhecidos — pares (ordem indiferente).
export const KNOWN_DERBIES: ReadonlyArray<readonly [string, string]> = [
  ["Flamengo", "Fluminense"],
  ["Flamengo", "Vasco"],
  ["Flamengo", "Botafogo"],
  ["Fluminense", "Vasco"],
  ["Fluminense", "Botafogo"],
  ["Vasco", "Botafogo"],
  ["Palmeiras", "Corinthians"],
  ["Palmeiras", "São Paulo"],
  ["Palmeiras", "Santos"],
  ["Corinthians", "São Paulo"],
  ["Corinthians", "Santos"],
  ["São Paulo", "Santos"],
  ["Grêmio", "Internacional"],
  ["Atlético-MG", "Cruzeiro"],
];

// Palavras-chave para inferir fatores a partir de textos livres (reasons/summary).
export const EDITORIAL_KEYWORDS: Record<EditorialFactorKey, string[]> = {
  titleRace: ["título", "liderança", "líder", "campeão", "g4", "topo da tabela"],
  relegationBattle: ["rebaixamento", "z4", "degola", "zona de rebaixamento"],
  farewell: ["despedida", "último jogo", "aposentadoria", "adeus"],
  derby: ["clássico", "classico", "rivalidade", "derby"],
  record: ["recorde", "marca histórica", "milésimo", "história do clube"],
  debut: ["estreia", "estreante", "primeiro jogo"],
  injuryReturn: ["retorno", "volta de lesão", "recuperado", "reestreia"],
  coachPressure: ["pressionado", "pressão", "demissão", "cargo em risco"],
  playerInForm: ["grande fase", "artilheiro", "em alta", "boa fase", "protagonista"],
  clubCrisis: ["crise", "protesto", "torcida revoltada", "diretoria"],
};

export function ratingFromScore(score: number): "Excelente" | "Bom" | "Regular" | "Baixo" {
  if (score >= 85) return "Excelente";
  if (score >= 70) return "Bom";
  if (score >= 50) return "Regular";
  return "Baixo";
}
