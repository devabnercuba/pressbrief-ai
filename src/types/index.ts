// Shared TypeScript types for PressBrief AI.
// These interfaces are the contract used by services, components and future
// real data sources (Supabase, sports APIs, etc).

export type Opportunity = "high" | "medium" | "low";
export type DemandLevel = "Alta" | "Média" | "Baixa";
export type ShotPriority = "essencial" | "recomendada" | "extra";
export type CredentialStatus = "pendente" | "aprovado" | "aguardando";

export interface Weather {
  condition: string;
  tempC: number;
  humidity: number;
  icon: "sun" | "cloud" | "rain" | "night";
}

export interface Player {
  id: string;
  name: string;
  team: string;
  position: string;
  number: number;
  reason: string;
  marketValue: string;
  demand: DemandLevel;
}

export interface ShotListItem {
  id: string;
  title: string;
  description: string;
  priority: ShotPriority;
}

export interface ChecklistItem {
  id: string;
  label: string;
}

export interface Pauta {
  id: string;
  title: string;
  description: string;
}

export interface CoverageAnalysis {
  score: number;
  level: "Alta" | "Média" | "Baixa";
  reasons: string[];
}

export interface EditorialAnalysis {
  score: number;
  level: "Alta" | "Média" | "Baixa";
  highlights: string[];
}

export interface Game {
  id: string;
  homeTeam: string;
  homeCrest: string;
  awayTeam: string;
  awayCrest: string;
  competition: string;
  date: string;
  time: string;
  stadium: string;
  city: string;
  state: string;
  coverageScore: number;
  editorialScore: number;
  distanceKm: number;
  weather: Weather;
  pautasCount: number;
  priorityPlayersCount: number;
  opportunity: Opportunity;
  reasons: string[];
  summary: string;
  pautas: Pauta[];
  priorityPlayers: Player[];
  mustShoot: string[];
  checklist: ChecklistItem[];
  shotList: ShotListItem[];
}

export interface Briefing {
  gameId: string;
  summary: string;
  pautas: Pauta[];
  priorityPlayers: Player[];
  mustShoot: string[];
  checklist: ChecklistItem[];
  shotList: ShotListItem[];
  coverage: CoverageAnalysis;
  editorial: EditorialAnalysis;
}

export interface Credential {
  id: string;
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  status: CredentialStatus;
  deadline: string;
}

export interface DaySummary {
  gamesToday: number;
  newOpportunities: number;
  pendingCredentials: number;
  totalPautas: number;
}

export interface UserProfile {
  firstName: string;
}
