// Prompt Builder — monta o prompt estruturado do Assistente Editorial
// a partir de todas as análises já produzidas pelos engines.

import type { AIBriefInput, AIPrompt } from "./aiTypes";

export const AI_EDITOR_SYSTEM_PROMPT = [
  "Você é Editor-chefe de uma agência internacional de fotografia esportiva.",
  "Sua função é orientar um fotógrafo esportivo antes da partida.",
  "Regras obrigatórias:",
  "- Nunca responda como chatbot; não cumprimente, não faça perguntas.",
  "- Produza conteúdo objetivo, direto e acionável.",
  "- Priorize oportunidades fotográficas concretas.",
  "- Evite opiniões; destaque fatos verificáveis presentes nos dados fornecidos.",
  "- Explique brevemente o motivo de cada sugestão.",
  "- Escreva em português do Brasil.",
  "Responda SOMENTE com um objeto JSON válido no formato:",
  `{"mission":string,"executiveSummary":string,"photoChecklist":[{"label":string,"reason":string}],`,
  `"editorialTopics":[string],"priorityPlayers":[{"name":string,"team":string,"reason":string}],`,
  `"alerts":[string],"hiddenOpportunities":[string],`,
  `"recommendedShots":[{"title":string,"moment":string,"reason":string}],"confidence":number}`,
  "confidence é um número entre 0 e 1 refletindo a completude dos dados recebidos.",
].join("\n");

function section(title: string, body: unknown): string {
  return `## ${title}\n${typeof body === "string" ? body : JSON.stringify(body, null, 2)}`;
}

export function buildUserPrompt(input: AIBriefInput): string {
  const { game, coverage, editorial, assignment, news, brief } = input;

  const parts: string[] = [
    section("Partida", {
      id: game.id,
      confronto: `${game.homeTeam} x ${game.awayTeam}`,
      competicao: game.competition,
      data: game.date,
      horario: game.time,
      estadio: game.stadium,
      cidade: `${game.city}/${game.state}`,
      distanciaKm: game.distanceKm,
      clima: game.weather,
    }),
  ];

  if (coverage) {
    parts.push(
      section("Coverage Analysis", {
        score: coverage.coverageScore,
        rating: coverage.rating,
        positivos: coverage.positives,
        atencao: coverage.attention,
      }),
    );
  }

  if (editorial) {
    parts.push(
      section("Editorial Analysis", {
        score: editorial.editorialScore,
        rating: editorial.rating,
        resumo: editorial.summary,
        fatoresPositivos: editorial.positiveFactors,
        fatoresAtencao: editorial.attentionFactors,
      }),
    );
  }

  if (assignment) {
    parts.push(
      section("Assignment Analysis", {
        notaFinal: assignment.finalScore,
        prioridade: assignment.priority,
        recomendacao: assignment.recommendation,
        resumo: assignment.summary,
      }),
    );
  }

  if (news) {
    parts.push(
      section("Game News Analysis", {
        totalNoticias: news.totalNews,
        importanciaEditorial: news.editorialImportance,
        pautasSugeridas: news.suggestedTopics,
        alertas: news.alerts,
        confianca: news.confidence,
        manchetes: news.articles.slice(0, 8).map((a) => ({
          titulo: a.title,
          fonte: a.source,
          publicadoEm: a.publishedAt,
        })),
      }),
    );
  }

  if (brief) {
    parts.push(
      section("Brief Analysis (engines)", {
        resumo: brief.summary,
        pautas: brief.pautas.map((p) => p.title),
        jogadoresPrioritarios: brief.priorityPlayers.map((p) => ({
          nome: p.name,
          time: p.team,
          motivo: p.reason,
          demanda: p.demand,
        })),
        obrigatorias: brief.mustShoot,
        checklist: brief.checklist.map((c) => c.label),
        shotList: brief.shotList.map((s) => ({ titulo: s.title, prioridade: s.priority })),
      }),
    );
  }

  parts.push(
    "## Tarefa\nGere o briefing editorial fotográfico desta partida usando exclusivamente os dados acima. Não invente estatísticas ou notícias.",
  );

  return parts.join("\n\n");
}

export function buildPrompt(input: AIBriefInput): AIPrompt {
  const system = AI_EDITOR_SYSTEM_PROMPT;
  const user = buildUserPrompt(input);
  return {
    system,
    user,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  };
}

/** Assinatura determinística das entradas — usada como chave de cache. */
export function buildInputSignature(input: AIBriefInput): string {
  const seed = [
    input.game.id,
    input.coverage?.coverageScore ?? "-",
    input.editorial?.editorialScore ?? "-",
    input.assignment?.finalScore ?? "-",
    input.news?.totalNews ?? "-",
    input.news?.editorialImportance ?? "-",
  ].join("|");
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36);
}
