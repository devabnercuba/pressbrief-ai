// Team Database — tipos públicos da camada de enriquecimento de clubes.

export interface TeamColors {
  primary: string;
  secondary: string;
}

export interface Team {
  /** Identificador estável (slug). */
  id: string;
  /** Nome oficial completo. Ex.: "Avaí Futebol Clube". */
  officialName: string;
  /** Nome curto usado na interface. Ex.: "Avaí". */
  shortName: string;
  /** Sigla oficial de 3 letras. Ex.: "AVA". */
  abbreviation: string;
  /** URL do escudo (ou asset local). Quando ausente é gerado a partir das cores. */
  crest?: string;
  city: string;
  state: string;
  country: string;
  colors: TeamColors;
  /** Divisão de referência (A, B, C, D). Apenas informativo. */
  division?: "A" | "B" | "C" | "D";
  /** Nomes alternativos reconhecidos pelo matcher. */
  aliases: string[];
}

export interface TeamMatch {
  team: Team;
  /** 0..1 — confiança do matching. */
  confidence: number;
  /** Como o clube foi encontrado. */
  strategy: "id" | "exact" | "alias" | "abbreviation" | "token" | "fuzzy";
}

/** Retorno usado pela UI quando o clube não existe na base. */
export interface ResolvedTeam {
  id: string;
  name: string;
  officialName: string;
  abbreviation: string;
  crest: string;
  city: string;
  state: string;
  country: string;
  colors: TeamColors;
  known: boolean;
  confidence: number;
}
