// Universal Data Source (UDS) — contratos comuns a todas as fontes de dados.
// Nenhum Engine conhece a origem dos dados: todos recebem apenas Game[].

export type DataSourceType =
  | "api"
  | "url"
  | "excel"
  | "pdf"
  | "rss"
  | "json"
  | "manual"
  | "database";

export type DataSourceStatus = "ok" | "erro" | "vazio" | "pendente" | "desativado";

/** Modelo universal de jogo — saída obrigatória de todo Provider. */
export interface NormalizedGame {
  id: string;
  competition: string;
  season: string;
  round: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  homeTeam: string;
  awayTeam: string;
  stadium: string;
  city: string;
  state: string;
  country: string;
  status: string;
  source: string;
}

/** Dados crus aceitos pelo normalizador (qualquer parser/provider). */
export interface RawGameInput {
  id?: string | number | null;
  competition?: string | null;
  season?: string | number | null;
  round?: string | number | null;
  date?: string | null;
  time?: string | null;
  utcDate?: string | null;
  homeTeam?: string | null;
  awayTeam?: string | null;
  stadium?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  status?: string | null;
}

/** Configuração de uma fonte cadastrada pelo usuário. */
export interface DataSourceConfig {
  id: string;
  name: string;
  type: DataSourceType;
  /** URL da fonte (quando aplicável). */
  url?: string;
  /** Conteúdo bruto para fontes manuais/coladas. */
  content?: string;
  enabled: boolean;
}

export interface DateRangeInput {
  dateFrom: string;
  dateTo: string;
}

export interface ProviderContext {
  source: DataSourceConfig;
  range?: DateRangeInput;
}

/** Todo provider implementa esta interface — nada mais é exigido. */
export interface DataSourceProvider {
  type: DataSourceType;
  label: string;
  load(context: ProviderContext): Promise<NormalizedGame[]>;
}

/** Estatísticas por fonte, exibidas no painel Data Sources. */
export interface DataSourceStats {
  sourceId: string;
  name: string;
  type: DataSourceType;
  status: DataSourceStatus;
  lastUpdate: number | null;
  games: number;
  durationMs: number;
  message?: string;
}
