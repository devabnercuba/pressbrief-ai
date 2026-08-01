// Configuração central das competições suportadas pelo PressBrief.
// Nenhum ID/código de competição deve existir fora deste arquivo.
//
// Escopo atual: competições nacionais brasileiras + continentais sul-americanas.
// Estaduais já possuem o campo `scope: "estadual"` reservado para o futuro.

export type CompetitionScope = "nacional" | "continental" | "estadual";

export interface SupportedCompetition {
  /** Código Football-Data (quando existir). */
  code: string;
  /** ID Football-Data (quando conhecido). */
  id?: number;
  /** Nome exibido na interface. */
  label: string;
  scope: CompetitionScope;
  /** Variações de nome retornadas por provedores externos. */
  aliases: string[];
  /** Estaduais ficam desabilitadas até serem liberadas. */
  enabled: boolean;
}

export const SUPPORTED_COMPETITIONS: SupportedCompetition[] = [
  {
    code: "BSA",
    id: 2013,
    label: "Campeonato Brasileiro Série A",
    scope: "nacional",
    aliases: ["campeonato brasileiro serie a", "brasileirao serie a", "serie a betano", "brasileirao"],
    enabled: true,
  },
  {
    code: "BSB",
    label: "Campeonato Brasileiro Série B",
    scope: "nacional",
    aliases: ["campeonato brasileiro serie b", "brasileirao serie b"],
    enabled: true,
  },
  {
    code: "BSC",
    label: "Campeonato Brasileiro Série C",
    scope: "nacional",
    aliases: ["campeonato brasileiro serie c", "brasileirao serie c"],
    enabled: true,
  },
  {
    code: "BSD",
    label: "Campeonato Brasileiro Série D",
    scope: "nacional",
    aliases: ["campeonato brasileiro serie d", "brasileirao serie d"],
    enabled: true,
  },
  {
    code: "CDB",
    label: "Copa do Brasil",
    scope: "nacional",
    aliases: ["copa do brasil", "copa betano do brasil"],
    enabled: true,
  },
  {
    code: "SCB",
    label: "Supercopa do Brasil",
    scope: "nacional",
    aliases: ["supercopa do brasil", "supercopa rei"],
    enabled: true,
  },
  {
    code: "CLI",
    id: 2152,
    label: "Copa Libertadores",
    scope: "continental",
    aliases: ["copa libertadores", "conmebol libertadores", "libertadores"],
    enabled: true,
  },
  {
    code: "CSA",
    label: "Copa Sul-Americana",
    scope: "continental",
    aliases: ["copa sudamericana", "conmebol sudamericana", "copa sul americana", "sul-americana"],
    enabled: true,
  },
  {
    code: "RSA",
    label: "Recopa Sul-Americana",
    scope: "continental",
    aliases: ["recopa sudamericana", "recopa sul americana", "recopa"],
    enabled: true,
  },
];

/** Códigos habilitados — usados nas chamadas à API. */
export const SUPPORTED_COMPETITION_CODES = SUPPORTED_COMPETITIONS.filter(
  (c) => c.enabled,
).map((c) => c.code);

export const SUPPORTED_COMPETITION_IDS = SUPPORTED_COMPETITIONS.filter(
  (c) => c.enabled && typeof c.id === "number",
).map((c) => c.id as number);

/** Normaliza acentos/caixa para comparação tolerante. */
export function normalizeCompetitionName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function findSupportedCompetition(input: {
  code?: string | null;
  id?: number | null;
  name?: string | null;
}): SupportedCompetition | undefined {
  const code = input.code?.toUpperCase();
  const name = input.name ? normalizeCompetitionName(input.name) : undefined;

  return SUPPORTED_COMPETITIONS.find((c) => {
    if (!c.enabled) return false;
    if (code && c.code === code) return true;
    if (input.id != null && c.id === input.id) return true;
    if (name) {
      if (normalizeCompetitionName(c.label) === name) return true;
      if (c.aliases.some((a) => normalizeCompetitionName(a) === name)) return true;
    }
    return false;
  });
}

export function isSupportedCompetition(input: {
  code?: string | null;
  id?: number | null;
  name?: string | null;
}): boolean {
  return findSupportedCompetition(input) !== undefined;
}
