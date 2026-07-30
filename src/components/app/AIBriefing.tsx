import { useCallback, useEffect, useState } from "react";
import {
  Sparkles,
  RefreshCw,
  Target,
  ListChecks,
  Star,
  AlertTriangle,
  Lightbulb,
  Camera,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateAIBrief } from "@/lib/ai-brief.functions";
import type { AIBrief } from "@/ai/aiTypes";
import type { Game } from "@/types";

interface Props {
  game: Game;
}

function Block({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-background/40 p-4">
      <div className="mb-3 flex items-center gap-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
        <span className="text-primary">{icon}</span>
        {title}
      </div>
      {children}
    </div>
  );
}

export function AIBriefing({ game }: Props) {
  const [brief, setBrief] = useState<AIBrief | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);

  const load = useCallback(
    async (force = false) => {
      setLoading(true);
      setError(undefined);
      try {
        const result = await generateAIBrief({ data: { game, force } });
        setBrief(result);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Não foi possível gerar o briefing inteligente.");
      } finally {
        setLoading(false);
      }
    },
    [game],
  );

  useEffect(() => {
    void load(false);
  }, [load]);

  if (loading && !brief) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        O editor-chefe está analisando estatísticas, notícias e contexto editorial…
      </div>
    );
  }

  if (error && !brief) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
        <p className="text-sm text-foreground">{error}</p>
        <Button size="sm" variant="outline" className="mt-3" onClick={() => void load(true)}>
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Tentar novamente
        </Button>
      </div>
    );
  }

  if (!brief) return null;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-primary/25 bg-primary/5 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-widest text-primary">
              <Sparkles className="h-3 w-3" /> Missão da cobertura
            </div>
            <p className="mt-2 text-sm font-medium leading-relaxed text-foreground">{brief.mission}</p>
          </div>
          <Button size="sm" variant="ghost" onClick={() => void load(true)} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
          <span>Confiança {Math.round(brief.confidence * 100)}%</span>
          {brief.meta && (
            <>
              <span>·</span>
              <span>{brief.meta.model}</span>
              <span>·</span>
              <span>{brief.meta.cached ? "em cache" : `${brief.meta.latencyMs ?? 0} ms`}</span>
            </>
          )}
        </div>
      </div>

      <Block icon={<Target className="h-3 w-3" />} title="Resumo executivo">
        <p className="text-sm leading-relaxed text-foreground/90">{brief.executiveSummary}</p>
      </Block>

      {brief.alerts.length > 0 && (
        <Block icon={<AlertTriangle className="h-3 w-3" />} title="Alertas">
          <ul className="space-y-2">
            {brief.alerts.map((a) => (
              <li key={a} className="rounded-md border border-destructive/20 bg-destructive/5 p-2.5 text-sm text-foreground/90">
                {a}
              </li>
            ))}
          </ul>
        </Block>
      )}

      {brief.editorialTopics.length > 0 && (
        <Block icon={<Sparkles className="h-3 w-3" />} title="Pautas editoriais">
          <ul className="grid gap-2 sm:grid-cols-2">
            {brief.editorialTopics.map((t) => (
              <li key={t} className="flex gap-2 text-sm text-foreground/90">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                {t}
              </li>
            ))}
          </ul>
        </Block>
      )}

      {brief.priorityPlayers.length > 0 && (
        <Block icon={<Star className="h-3 w-3" />} title="Jogadores prioritários">
          <ul className="grid gap-3 sm:grid-cols-2">
            {brief.priorityPlayers.map((p) => (
              <li key={p.name} className="rounded-md border border-border bg-card p-3">
                <p className="text-sm font-medium text-foreground">
                  {p.name}
                  {p.team ? <span className="text-muted-foreground"> · {p.team}</span> : null}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{p.reason}</p>
              </li>
            ))}
          </ul>
        </Block>
      )}

      {brief.recommendedShots.length > 0 && (
        <Block icon={<Camera className="h-3 w-3" />} title="Fotos recomendadas">
          <ul className="space-y-2">
            {brief.recommendedShots.map((s) => (
              <li key={s.title} className="rounded-md border border-border bg-card p-3">
                <p className="text-sm font-medium text-foreground">
                  {s.title}
                  {s.moment ? <span className="text-muted-foreground"> · {s.moment}</span> : null}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.reason}</p>
              </li>
            ))}
          </ul>
        </Block>
      )}

      {brief.photoChecklist.length > 0 && (
        <Block icon={<ListChecks className="h-3 w-3" />} title="Checklist fotográfico">
          <ul className="space-y-2">
            {brief.photoChecklist.map((c) => (
              <li key={c.label} className="flex gap-3 rounded-md border border-border bg-card p-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-success" />
                <div>
                  <p className="text-sm text-foreground">{c.label}</p>
                  {c.reason && <p className="mt-0.5 text-xs text-muted-foreground">{c.reason}</p>}
                </div>
              </li>
            ))}
          </ul>
        </Block>
      )}

      {brief.hiddenOpportunities.length > 0 && (
        <Block icon={<Lightbulb className="h-3 w-3" />} title="Oportunidades escondidas">
          <ul className="space-y-2">
            {brief.hiddenOpportunities.map((o) => (
              <li key={o} className="flex gap-2 text-sm text-foreground/90">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                {o}
              </li>
            ))}
          </ul>
        </Block>
      )}
    </div>
  );
}
