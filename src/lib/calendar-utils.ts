// Utilidades puras para o Calendário Inteligente.
// Sem dependência de React ou UI — reutilizáveis e testáveis.
import type { Game } from "@/types";
import type { AssignmentAnalysis } from "@/intelligence";

export interface RankedGame {
  game: Game;
  assignment: AssignmentAnalysis;
  coverageScore: number;
  editorialScore: number;
}

export interface CalendarFilters {
  competition: string; // "all" ou nome
  state: string;       // "all" ou UF
  maxDistanceKm: number | null; // null = sem limite
  onlyRecommended: boolean;
}

export const DEFAULT_FILTERS: CalendarFilters = {
  competition: "all",
  state: "all",
  maxDistanceKm: null,
  onlyRecommended: false,
};

export function filterRanked(ranked: RankedGame[], f: CalendarFilters): RankedGame[] {
  return ranked.filter((r) => {
    if (f.competition !== "all" && r.game.competition !== f.competition) return false;
    if (f.state !== "all" && r.game.state !== f.state) return false;
    if (f.maxDistanceKm != null && r.game.distanceKm > f.maxDistanceKm) return false;
    if (f.onlyRecommended && r.assignment.recommendation !== "Recomendado") return false;
    return true;
  });
}

export function gamesOnDate(ranked: RankedGame[], dateISO: string): RankedGame[] {
  return ranked
    .filter((r) => r.game.date === dateISO)
    .sort((a, b) => b.assignment.finalScore - a.assignment.finalScore);
}

export interface DaySummary {
  dateISO: string;
  total: number;
  recommended: number;
  avgPriority: number; // 0..5
}

export function summarizeByDay(ranked: RankedGame[]): Map<string, DaySummary> {
  const map = new Map<string, DaySummary>();
  for (const r of ranked) {
    const key = r.game.date;
    const cur = map.get(key) ?? { dateISO: key, total: 0, recommended: 0, avgPriority: 0 };
    cur.total += 1;
    if (r.assignment.recommendation === "Recomendado") cur.recommended += 1;
    cur.avgPriority += r.assignment.priority;
    map.set(key, cur);
  }
  for (const s of map.values()) s.avgPriority = s.total ? s.avgPriority / s.total : 0;
  return map;
}

export interface CalendarCell {
  dateISO: string;
  day: number;
  inMonth: boolean;
}

// Monta a grade de um mês (semanas de domingo→sábado), incluindo dias
// vizinhos para completar as linhas.
export function buildMonthGrid(year: number, month: number): CalendarCell[] {
  const first = new Date(year, month, 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay()); // volta ao domingo
  const cells: CalendarCell[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    cells.push({
      dateISO: toISO(d),
      day: d.getDate(),
      inMonth: d.getMonth() === month,
    });
  }
  return cells;
}

export function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Retorna { dateFrom, dateTo } cobrindo mês atual + próximo (formato YYYY-MM-DD).
export function currentAndNextMonthRange(from: Date = new Date()): {
  dateFrom: string;
  dateTo: string;
} {
  const start = new Date(from.getFullYear(), from.getMonth(), 1);
  const end = new Date(from.getFullYear(), from.getMonth() + 2, 0); // último dia do próximo mês
  return { dateFrom: toISO(start), dateTo: toISO(end) };
}
