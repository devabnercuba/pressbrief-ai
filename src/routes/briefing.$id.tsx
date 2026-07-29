import { useEffect, useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, FileText, Star, AlertTriangle, ListChecks, Check, LayoutGrid, Camera } from "lucide-react";
import { Layout } from "@/components/app/Layout";
import { Header } from "@/components/app/Header";
import { Button } from "@/components/ui/button";
import { CoverageScore } from "@/components/app/CoverageScore";
import { EditorialScore } from "@/components/app/EditorialScore";

import { GameSummary } from "@/components/app/GameSummary";
import { BriefingSection } from "@/components/app/BriefingSection";
import { PlayerPriorityCard } from "@/components/app/PlayerPriorityCard";
import { ShotList } from "@/components/app/ShotList";
import { EditorialContext } from "@/components/app/EditorialContext";
import { cn } from "@/lib/utils";
import { getGameById } from "@/services/gameService";
import { getMatchGameById } from "@/services/footballDataService";
import { getNewsService, type GameNewsAnalysis } from "@/news";
import type { Game } from "@/types";


export const Route = createFileRoute("/briefing/$id")({
  head: () => ({
    meta: [
      { title: "Briefing — PressBrief AI" },
      { name: "description", content: "Briefing profissional de preparação para cobertura fotográfica esportiva." },
      { property: "og:title", content: "Briefing — PressBrief AI" },
      { property: "og:description", content: "Resumo, pautas, jogadores prioritários, shot list e checklist." },
    ],
  }),
  loader: async ({ params }): Promise<{ game: Game }> => {
    const game = getGameById(params.id) ?? (await getMatchGameById(params.id).catch(() => undefined));
    if (!game) throw notFound();
    return { game };
  },
  component: BriefingPage,
});

function BriefingPage() {
  const { game } = Route.useLoaderData();
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const toggle = (id: string) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const progress = game.checklist.length
    ? Math.round((checked.size / game.checklist.length) * 100)
    : 0;

  return (
    <Layout>
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2 text-muted-foreground">
        <Link to="/">
          <ArrowLeft className="mr-1 h-4 w-4" /> Voltar ao Dashboard
        </Link>
      </Button>

      <Header
        title={`${game.homeTeam} vs ${game.awayTeam}`}
        subtitle={`${game.competition} • ${game.stadium}, ${game.city}`}
        actions={
          <div className="flex items-center gap-4">
            <CoverageScore score={game.coverageScore} size="md" label="Coverage" />
            <EditorialScore score={game.editorialScore} size="md" label="Editorial" />
          </div>
        }
      />

      <div className="mt-6 space-y-5">
        {/* 1 — Resumo da partida */}
        <BriefingSection step={1} title="Resumo da partida" subtitle="Contexto e narrativa principal">
          <GameSummary game={game} />
        </BriefingSection>

        {/* 2 — Principais pautas */}
        <BriefingSection
          step={2}
          title="Principais pautas"
          subtitle={`${game.pautas.length} narrativas mapeadas`}
          icon={<FileText className="h-4 w-4" />}
        >
          <ul className="grid gap-3 sm:grid-cols-2">
            {game.pautas.map((p: Game["pautas"][number]) => (
              <li key={p.id} className="rounded-lg border border-border bg-background/40 p-4">
                <div className="flex items-start gap-3">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{p.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{p.description}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </BriefingSection>

        {/* 3 — Jogadores prioritários */}
        <BriefingSection
          step={3}
          title="Jogadores prioritários"
          subtitle={`${game.priorityPlayers.length} atletas com alta demanda editorial`}
          icon={<Star className="h-4 w-4" />}
        >
          <div className="grid gap-3 md:grid-cols-2">
            {game.priorityPlayers.map((p: Game["priorityPlayers"][number]) => (
              <PlayerPriorityCard key={p.id} player={p} />
            ))}
          </div>
        </BriefingSection>

        {/* 4 — Não pode deixar de fotografar */}
        <BriefingSection
          step={4}
          title="O que você NÃO pode deixar de fotografar"
          subtitle="Momentos obrigatórios da cobertura"
          icon={<AlertTriangle className="h-4 w-4" />}
        >
          <ul className="grid gap-2 sm:grid-cols-2">
            {game.mustShoot.map((item: string, i: number) => (
              <li key={item} className="flex gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-destructive/15 text-[11px] font-semibold text-destructive">
                  {i + 1}
                </span>
                <p className="text-sm text-foreground/90">{item}</p>
              </li>
            ))}
          </ul>
        </BriefingSection>

        {/* 5 — Checklist de cobertura */}
        <BriefingSection
          step={5}
          title="Checklist de cobertura"
          subtitle="Prepare-se antes, durante e depois do jogo"
          icon={<ListChecks className="h-4 w-4" />}
          actions={
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="tabular-nums">{checked.size}/{game.checklist.length}</span>
              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-border/60">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          }
        >
          <ul className="space-y-2">
            {game.checklist.map((item: Game["checklist"][number]) => {
              const done = checked.has(item.id);
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => toggle(item.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg border border-border bg-background/40 p-3 text-left transition-colors hover:border-border/80",
                      done && "opacity-60",
                    )}
                  >
                    <span
                      className={cn(
                        "grid h-5 w-5 shrink-0 place-items-center rounded border transition-colors",
                        done ? "border-success bg-success text-success-foreground" : "border-border bg-card",
                      )}
                    >
                      {done && <Check className="h-3 w-3" />}
                    </span>
                    <span className={cn("text-sm text-foreground", done && "line-through")}>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Shot list */}
          <div className="mt-6 rounded-lg border border-border/60 bg-background/30 p-4">
            <div className="mb-3 flex items-center gap-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              <Camera className="h-3 w-3 text-primary" />
              Shot list sugerido
            </div>
            <ShotList shots={game.shotList} />
          </div>
        </BriefingSection>
      </div>

      <div className="mt-6 flex justify-end">
        <Button asChild variant="outline" size="sm">
          <Link to="/">
            <LayoutGrid className="mr-1.5 h-4 w-4" /> Voltar ao Dashboard
          </Link>
        </Button>
      </div>
    </Layout>
  );
}
