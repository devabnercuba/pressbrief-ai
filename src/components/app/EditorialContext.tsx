import { Newspaper, AlertTriangle, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GameNewsAnalysis, NewsImportance } from "@/news";

interface Props {
  analysis: GameNewsAnalysis;
  className?: string;
}

const importanceTone: Record<NewsImportance, string> = {
  alta: "text-destructive border-destructive/30 bg-destructive/10",
  média: "text-warning border-warning/30 bg-warning/10",
  baixa: "text-muted-foreground border-border bg-muted/40",
};

export function EditorialContext({ analysis, className }: Props) {
  const { totalNews, editorialImportance, suggestedTopics, alerts, articles } = analysis;
  const empty = totalNews === 0;

  return (
    <div className={cn("rounded-xl border border-border bg-card/60 p-5", className)}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Newspaper className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Contexto Editorial</h3>
        </div>
        <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider", importanceTone[editorialImportance])}>
          {editorialImportance}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border/60 bg-background/40 p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Notícias relacionadas</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{totalNews}</p>
        </div>
        <div className="rounded-lg border border-border/60 bg-background/40 p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Pautas sugeridas</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{suggestedTopics.length}</p>
        </div>
        <div className="rounded-lg border border-border/60 bg-background/40 p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Alertas</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{alerts.length}</p>
        </div>
      </div>

      {empty ? (
        <p className="mt-4 text-xs text-muted-foreground">
          Nenhuma notícia relacionada nas últimas 24h. Provedores conectados aparecerão aqui automaticamente.
        </p>
      ) : (
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Principais pautas</p>
            <ul className="space-y-2">
              {suggestedTopics.map((t) => (
                <li key={t} className="flex items-start gap-2 rounded-md border border-border/60 bg-background/30 p-2 text-xs text-foreground/90">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {t}
                </li>
              ))}
              {!suggestedTopics.length && (
                <li className="text-xs text-muted-foreground">Sem pautas destacadas.</li>
              )}
            </ul>

            {alerts.length > 0 && (
              <>
                <p className="mb-2 mt-4 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Alertas</p>
                <ul className="space-y-2">
                  {alerts.map((a) => (
                    <li key={a} className="flex items-start gap-2 rounded-md border border-destructive/25 bg-destructive/5 p-2 text-xs text-foreground/90">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
                      {a}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <div>
            <p className="mb-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Últimas notícias</p>
            <ul className="space-y-2">
              {articles.slice(0, 5).map((a) => (
                <li key={a.id} className="rounded-md border border-border/60 bg-background/30 p-3">
                  <a href={a.url} target="_blank" rel="noreferrer" className="group flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground group-hover:text-primary">
                        {a.title}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {a.source} • {new Date(a.publishedAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-primary" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
