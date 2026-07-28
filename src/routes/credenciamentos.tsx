import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { FileCheck, Calendar, Trophy, StickyNote } from "lucide-react";
import { Layout, EmptyState } from "@/components/app/Layout";
import { Header } from "@/components/app/Header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCredentialsStore } from "@/lib/credentials-store";
import {
  CREDENTIAL_STATUSES,
  groupByStatus,
  type CredentialRequest,
  type CredentialStatus,
} from "@/lib/credentials";

export const Route = createFileRoute("/credenciamentos")({
  head: () => ({
    meta: [
      { title: "Credenciamentos — PressBrief AI" },
      { name: "description", content: "Acompanhe o status de credenciamento das suas coberturas." },
      { property: "og:title", content: "Credenciamentos — PressBrief AI" },
      { property: "og:description", content: "Fluxo de credenciamento: interesse, solicitação, aprovação." },
    ],
  }),
  component: CredentialsPage,
});

function formatDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}
function formatDateTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function CredentialsPage() {
  const { requests } = useCredentialsStore();
  const groups = useMemo(() => groupByStatus(requests), [requests]);

  if (requests.length === 0) {
    return (
      <Layout>
        <Header title="Credenciamentos" subtitle="Acompanhe o status das suas solicitações." />
        <EmptyState
          icon={<FileCheck className="h-8 w-8" />}
          title="Nenhuma solicitação ainda"
          description="Marque um jogo como 'Tenho Interesse' para iniciar um credenciamento."
        />
      </Layout>
    );
  }

  return (
    <Layout>
      <Header
        title="Credenciamentos"
        subtitle={`${requests.length} solicitação(ões) em acompanhamento.`}
      />
      <div className="mt-6 space-y-8">
        {CREDENTIAL_STATUSES.map((status) => {
          const items = groups[status];
          if (items.length === 0) return null;
          return (
            <section key={status}>
              <div className="flex items-center gap-2">
                <span className={statusPillClass(status)}>{status}</span>
                <span className="text-xs text-muted-foreground">{items.length} jogo(s)</span>
              </div>
              <div className="mt-3 space-y-3">
                {items.map((r) => <CredentialCard key={r.id} req={r} />)}
              </div>
            </section>
          );
        })}
      </div>
    </Layout>
  );
}

function CredentialCard({ req }: { req: CredentialRequest }) {
  const { setStatus, updateNotes } = useCredentialsStore();
  const g = req.game;
  return (
    <article className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex -space-x-2">
            <img src={g.homeCrest} alt="" className="h-10 w-10 rounded-lg ring-2 ring-card" />
            <img src={g.awayCrest} alt="" className="h-10 w-10 rounded-lg ring-2 ring-card" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-foreground">
              {g.homeTeam} <span className="text-muted-foreground">vs</span> {g.awayTeam}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Trophy className="h-3 w-3" />{g.competition}</span>
              <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(g.date)} · {g.time}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={statusPillClass(req.status)}>{req.status}</span>
          <Select value={req.status} onValueChange={(v) => setStatus(req.gameId, v as CredentialStatus)}>
            <SelectTrigger className="h-8 w-[190px] bg-background/50 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CREDENTIAL_STATUSES.map((s) => (
                <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <MetaField label="Solicitado em" value={formatDateTime(req.requestedAt)} />
        <MetaField label="Resposta esperada" value={formatDateTime(req.expectedResponseDate)} />
        <MetaField label="Aprovado em" value={formatDateTime(req.approvedAt)} />
      </div>

      <div className="mt-4">
        <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          <StickyNote className="h-3 w-3" /> Observações
        </label>
        <Textarea
          value={req.notes}
          onChange={(e) => updateNotes(req.gameId, e.target.value)}
          placeholder="Contato da assessoria, número do protocolo, etc."
          className="min-h-[68px] bg-background/50 text-xs"
        />
      </div>
    </article>
  );
}

function MetaField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/40 p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function statusPillClass(status: CredentialStatus): string {
  const base = "rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider";
  const tone: Record<CredentialStatus, string> = {
    "INTERESSE": "text-primary border-primary/30 bg-primary/10",
    "NÃO SOLICITADO": "text-muted-foreground border-border bg-muted/30",
    "SOLICITADO": "text-warning border-warning/30 bg-warning/10",
    "APROVADO": "text-success border-success/30 bg-success/10",
    "NEGADO": "text-destructive border-destructive/30 bg-destructive/10",
    "CANCELADO": "text-muted-foreground border-border bg-muted/20",
  };
  return `${base} ${tone[status]}`;
}
