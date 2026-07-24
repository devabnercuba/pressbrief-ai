// Thin server-function wrappers. Keep this module free of runtime helpers
// (see tanstack-serverfn-splitting): only imports, types, and createServerFn
// declarations live at module scope.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { fdFetch } from "./football-data.server";

export interface FDTeam {
  id: number;
  name: string;
  shortName?: string;
  tla?: string;
  crest?: string;
}

export interface FDCompetition {
  id: number;
  name: string;
  code: string;
  emblem?: string;
  area?: { name: string };
}

export interface FDMatch {
  id: number;
  utcDate: string;
  status: string;
  matchday?: number;
  competition: FDCompetition;
  homeTeam: FDTeam;
  awayTeam: FDTeam;
  venue?: string;
  score?: { fullTime?: { home: number | null; away: number | null } };
}

export const fetchMatches = createServerFn({ method: "GET" })
  .inputValidator((input: { dateFrom?: string; dateTo?: string } | undefined) =>
    z
      .object({ dateFrom: z.string().optional(), dateTo: z.string().optional() })
      .parse(input ?? {}),
  )
  .handler(async ({ data }) => {
    const params = new URLSearchParams();
    if (data.dateFrom) params.set("dateFrom", data.dateFrom);
    if (data.dateTo) params.set("dateTo", data.dateTo);
    const qs = params.toString();
    return fdFetch<{ matches: FDMatch[] }>(`/matches${qs ? `?${qs}` : ""}`);
  });

export const fetchCompetitions = createServerFn({ method: "GET" }).handler(
  async () => fdFetch<{ competitions: FDCompetition[] }>("/competitions"),
);

export const fetchTeamsByCompetition = createServerFn({ method: "GET" })
  .inputValidator((input: { code: string }) =>
    z.object({ code: z.string().min(2) }).parse(input),
  )
  .handler(async ({ data }) =>
    fdFetch<{ teams: FDTeam[] }>(`/competitions/${data.code}/teams`),
  );

export const fetchStandings = createServerFn({ method: "GET" })
  .inputValidator((input: { code: string }) =>
    z.object({ code: z.string().min(2) }).parse(input),
  )
  .handler(async ({ data }) =>
    fdFetch<{ standings: unknown[] }>(`/competitions/${data.code}/standings`),
  );

export const fetchMatchById = createServerFn({ method: "GET" })
  .inputValidator((input: { id: number }) =>
    z.object({ id: z.number().int().positive() }).parse(input),
  )
  .handler(async ({ data }) => fdFetch<FDMatch>(`/matches/${data.id}`));
