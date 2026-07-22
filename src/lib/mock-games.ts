export type Opportunity = "high" | "medium" | "low";

export interface Game {
  id: string;
  homeTeam: string;
  homeCrest: string;
  awayTeam: string;
  awayCrest: string;
  competition: string;
  date: string; // ISO
  time: string;
  stadium: string;
  city: string;
  state: string;
  coverageScore: number;
  opportunity: Opportunity;
  reasons: string[];
}

// Colored placeholder crests via SVG data-URI
const crest = (label: string, bg: string, fg = "#ffffff") =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bg}"/><stop offset="1" stop-color="${bg}" stop-opacity="0.7"/></linearGradient></defs><rect width="64" height="64" rx="14" fill="url(#g)"/><text x="50%" y="55%" text-anchor="middle" font-family="Inter,Arial" font-size="24" font-weight="700" fill="${fg}">${label}</text></svg>`,
  )}`;

export const mockGames: Game[] = [
  {
    id: "flu-fla-2026",
    homeTeam: "Fluminense",
    homeCrest: crest("FLU", "#7A0F1A"),
    awayTeam: "Flamengo",
    awayCrest: crest("FLA", "#B71C1C"),
    competition: "Brasileirão Série A",
    date: "2026-07-25",
    time: "16:00",
    stadium: "Maracanã",
    city: "Rio de Janeiro",
    state: "RJ",
    coverageScore: 96,
    opportunity: "high",
    reasons: [
      "Clássico de alta demanda editorial nacional",
      "Estádio icônico com alto valor de imagem",
      "Jogadores em destaque com contratos publicitários ativos",
    ],
  },
  {
    id: "pal-cor-2026",
    homeTeam: "Palmeiras",
    homeCrest: crest("PAL", "#0E5B2F"),
    awayTeam: "Corinthians",
    awayCrest: crest("COR", "#111111"),
    competition: "Brasileirão Série A",
    date: "2026-07-26",
    time: "18:30",
    stadium: "Allianz Parque",
    city: "São Paulo",
    state: "SP",
    coverageScore: 92,
    opportunity: "high",
    reasons: [
      "Derby paulista com demanda internacional",
      "Estádio com iluminação premium para foto noturna",
      "Alta probabilidade de venda para agências europeias",
    ],
  },
  {
    id: "gre-int-2026",
    homeTeam: "Grêmio",
    homeCrest: crest("GRE", "#0A3B7A"),
    awayTeam: "Internacional",
    awayCrest: crest("INT", "#B00020"),
    competition: "Campeonato Gaúcho",
    date: "2026-07-27",
    time: "20:00",
    stadium: "Arena do Grêmio",
    city: "Porto Alegre",
    state: "RS",
    coverageScore: 78,
    opportunity: "medium",
    reasons: [
      "Grenal com forte demanda regional",
      "Boa acessibilidade de credenciamento",
      "Cobertura reduzida de fotógrafos independentes",
    ],
  },
  {
    id: "atl-cru-2026",
    homeTeam: "Atlético-MG",
    homeCrest: crest("CAM", "#0A0A0A"),
    awayTeam: "Cruzeiro",
    awayCrest: crest("CRU", "#1B3A8A"),
    competition: "Copa do Brasil",
    date: "2026-07-28",
    time: "21:30",
    stadium: "Arena MRV",
    city: "Belo Horizonte",
    state: "MG",
    coverageScore: 71,
    opportunity: "medium",
    reasons: [
      "Fase eliminatória com maior valor editorial",
      "Estádio novo com ângulos ainda pouco explorados",
      "Distância viável do hub de fotógrafos",
    ],
  },
  {
    id: "san-sao-2026",
    homeTeam: "Santos",
    homeCrest: crest("SAN", "#0A0A0A", "#ffffff"),
    awayTeam: "São Paulo",
    awayCrest: crest("SAO", "#B71C1C"),
    competition: "Brasileirão Série A",
    date: "2026-07-29",
    time: "19:00",
    stadium: "Vila Belmiro",
    city: "Santos",
    state: "SP",
    coverageScore: 54,
    opportunity: "low",
    reasons: [
      "Alta concorrência de fotógrafos credenciados",
      "Iluminação limitada em setores específicos",
      "Demanda editorial moderada para o meio de semana",
    ],
  },
];

export const getGameById = (id: string) => mockGames.find((g) => g.id === id);
