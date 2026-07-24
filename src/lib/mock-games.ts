// Mock data source. Consumidores devem importar via src/services/*, não daqui.
import type {
  ChecklistItem,
  Credential,
  DaySummary,
  Game,
  UserProfile,
} from "@/types";

export type {
  ChecklistItem,
  Credential,
  DaySummary,
  Game,
  Opportunity,
  Player as PriorityPlayer,
  ShotListItem as ShotItem,
  UserProfile,
  Weather,
} from "@/types";


const crest = (label: string, bg: string, fg = "#ffffff") =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bg}"/><stop offset="1" stop-color="${bg}" stop-opacity="0.7"/></linearGradient></defs><rect width="64" height="64" rx="14" fill="url(#g)"/><text x="50%" y="55%" text-anchor="middle" font-family="Inter,Arial" font-size="24" font-weight="700" fill="${fg}">${label}</text></svg>`,
  )}`;

const baseChecklist: ChecklistItem[] = [
  { id: "c1", label: "Confirmar credenciamento e retirar colete" },
  { id: "c2", label: "Testar cartões, baterias e backup" },
  { id: "c3", label: "Chegar 3h antes para posicionamento" },
  { id: "c4", label: "Registrar aquecimento e entrada dos times" },
  { id: "c5", label: "Enviar seleção preliminar no intervalo" },
  { id: "c6", label: "Coletiva pós-jogo e comemorações" },
];

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
    editorialScore: 92,
    distanceKm: 12,
    weather: { condition: "Ensolarado", tempC: 28, humidity: 62, icon: "sun" },
    pautasCount: 8,
    priorityPlayersCount: 5,
    opportunity: "high",
    reasons: [
      "Clássico de alta demanda editorial nacional",
      "Estádio icônico com alto valor de imagem",
      "Jogadores em destaque com contratos publicitários ativos",
    ],
    summary:
      "Fla-Flu no Maracanã lotado, com transmissão nacional e forte demanda de agências internacionais. Jogo decisivo pela ponta da tabela, com narrativas de rivalidade histórica e vários jogadores em janela de valorização de mercado.",
    pautas: [
      { id: "p1", title: "Disputa pela liderança", description: "Confronto direto entre os dois primeiros colocados." },
      { id: "p2", title: "Retorno de Ganso ao Maracanã", description: "Primeiro jogo após lesão de 3 meses." },
      { id: "p3", title: "Torcida recorde", description: "Expectativa de casa cheia com mais de 70 mil torcedores." },
      { id: "p4", title: "Arbitragem estreante", description: "Primeiro clássico do árbitro na Série A." },
    ],
    priorityPlayers: [
      { id: "pl1", name: "Ganso", team: "Fluminense", position: "Meia", number: 10, reason: "Retorno de lesão, alta demanda editorial", marketValue: "€4M", demand: "Alta" },
      { id: "pl2", name: "Arrascaeta", team: "Flamengo", position: "Meia", number: 14, reason: "Camisa 10 e principal articulador", marketValue: "€12M", demand: "Alta" },
      { id: "pl3", name: "Pedro", team: "Flamengo", position: "Atacante", number: 9, reason: "Artilheiro do campeonato", marketValue: "€22M", demand: "Alta" },
      { id: "pl4", name: "Cano", team: "Fluminense", position: "Atacante", number: 14, reason: "Retomando forma após transferência", marketValue: "€8M", demand: "Média" },
    ],
    mustShoot: [
      "Entrada dos times com bandeirão da torcida ao fundo",
      "Execução do hino com close nos capitães",
      "Primeiro gol e comemoração completa",
      "Reação do técnico em lance decisivo",
      "Foto ampla do Maracanã lotado ao pôr do sol",
    ],
    checklist: baseChecklist,
    shotList: [
      { id: "s1", title: "Aquecimento no gramado", description: "Ângulo baixo, foco em jogadores-chave", priority: "essencial" },
      { id: "s2", title: "Hinos com close nos capitães", description: "85mm+, ISO controlado", priority: "essencial" },
      { id: "s3", title: "Gols e comemorações", description: "Sequência rápida, prioridade artilheiros", priority: "essencial" },
      { id: "s4", title: "Torcida no lance decisivo", description: "Grande angular, sobreposição jogador + arquibancada", priority: "recomendada" },
      { id: "s5", title: "Detalhe tático do banco", description: "Reação do técnico, gestos de instrução", priority: "recomendada" },
      { id: "s6", title: "Coletiva pós-jogo", description: "Retratos verticais para editorial", priority: "extra" },
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
    editorialScore: 89,
    distanceKm: 28,
    weather: { condition: "Nublado", tempC: 21, humidity: 74, icon: "cloud" },
    pautasCount: 7,
    priorityPlayersCount: 4,
    opportunity: "high",
    reasons: [
      "Derby paulista com demanda internacional",
      "Estádio com iluminação premium para foto noturna",
      "Alta probabilidade de venda para agências europeias",
    ],
    summary:
      "Derby paulista no Allianz Parque com iluminação de estádio premium para foto noturna. Confronto histórico com forte demanda de agências europeias e narrativas de rivalidade que se estendem ao mercado internacional.",
    pautas: [
      { id: "p1", title: "Estreia do novo camisa 10", description: "Reforço recém-chegado da Europa." },
      { id: "p2", title: "Recorde de invencibilidade em casa", description: "Palmeiras busca 20º jogo sem derrota." },
      { id: "p3", title: "Corinthians com técnico novo", description: "Segundo jogo do novo comando técnico." },
    ],
    priorityPlayers: [
      { id: "pl1", name: "Endrick", team: "Palmeiras", position: "Atacante", number: 9, reason: "Recém-vendido para o Real Madrid", marketValue: "€35M", demand: "Alta" },
      { id: "pl2", name: "Yuri Alberto", team: "Corinthians", position: "Atacante", number: 9, reason: "Artilheiro em recuperação", marketValue: "€18M", demand: "Alta" },
      { id: "pl3", name: "Raphael Veiga", team: "Palmeiras", position: "Meia", number: 23, reason: "Cobrador de faltas, jogadas decisivas", marketValue: "€10M", demand: "Média" },
    ],
    mustShoot: [
      "Bandeirão gigante da torcida na entrada",
      "Efeitos de luz do Allianz no escurecer",
      "Duelo de camisas 9 em disputa aérea",
      "Comemoração de gol na frente da torcida rival",
    ],
    checklist: baseChecklist,
    shotList: [
      { id: "s1", title: "Show de luzes pré-jogo", description: "Ideal com 24mm, tripé se possível", priority: "essencial" },
      { id: "s2", title: "Entrada das equipes", description: "Ângulo do túnel dos vestiários", priority: "essencial" },
      { id: "s3", title: "Gols e comemorações", description: "Sequência 12fps mínimo", priority: "essencial" },
      { id: "s4", title: "Confrontos táticos", description: "Marcação individual dos meias", priority: "recomendada" },
      { id: "s5", title: "Reações do banco rival", description: "Emoção do técnico em lance polêmico", priority: "recomendada" },
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
    editorialScore: 74,
    distanceKm: 340,
    weather: { condition: "Chuva leve", tempC: 14, humidity: 88, icon: "rain" },
    pautasCount: 5,
    priorityPlayersCount: 3,
    opportunity: "medium",
    reasons: [
      "Grenal com forte demanda regional",
      "Boa acessibilidade de credenciamento",
      "Cobertura reduzida de fotógrafos independentes",
    ],
    summary:
      "Grenal decisivo pelo Gauchão com chuva prevista, o que abre oportunidade para imagens dramáticas e diferenciadas. Credenciamento com baixa concorrência de fotógrafos independentes.",
    pautas: [
      { id: "p1", title: "Final antecipada do Gauchão", description: "Vencedor larga na frente na final." },
      { id: "p2", title: "Chuva prevista", description: "Condições dramáticas para foto ambiente." },
      { id: "p3", title: "Retorno de ídolo aposentado", description: "Homenagem em campo antes do jogo." },
    ],
    priorityPlayers: [
      { id: "pl1", name: "Suárez", team: "Grêmio", position: "Atacante", number: 9, reason: "Referência técnica e midiática", marketValue: "€6M", demand: "Alta" },
      { id: "pl2", name: "Alan Patrick", team: "Internacional", position: "Meia", number: 10, reason: "Capitão e principal criador", marketValue: "€7M", demand: "Média" },
    ],
    mustShoot: [
      "Jogadores sob a chuva no aquecimento",
      "Bandeirão da torcida antes do apito",
      "Disputa aérea com respingos de água",
      "Homenagem ao ídolo no gramado",
    ],
    checklist: baseChecklist,
    shotList: [
      { id: "s1", title: "Ambiente chuvoso pré-jogo", description: "Capa d'água na lente, foco em textura", priority: "essencial" },
      { id: "s2", title: "Homenagem em campo", description: "Emoção do ídolo com a torcida", priority: "essencial" },
      { id: "s3", title: "Gols e disputas aéreas", description: "Priorizar contra-luz com chuva", priority: "essencial" },
      { id: "s4", title: "Torcida no lance final", description: "Grande angular, arquibancada iluminada", priority: "recomendada" },
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
    editorialScore: 80,
    distanceKm: 120,
    weather: { condition: "Céu limpo", tempC: 19, humidity: 55, icon: "night" },
    pautasCount: 6,
    priorityPlayersCount: 4,
    opportunity: "medium",
    reasons: [
      "Fase eliminatória com maior valor editorial",
      "Estádio novo com ângulos ainda pouco explorados",
      "Distância viável do hub de fotógrafos",
    ],
    summary:
      "Clássico mineiro pelas quartas da Copa do Brasil na Arena MRV. Estádio novo ainda oferece ângulos pouco explorados e alta demanda editorial pela fase eliminatória.",
    pautas: [
      { id: "p1", title: "Quartas de final decisivas", description: "Vencedor avança para semi valendo bolada." },
      { id: "p2", title: "Novos ângulos da Arena MRV", description: "Setores ainda pouco fotografados." },
      { id: "p3", title: "Clássico com histórico recente equilibrado", description: "Últimos 5 jogos terminaram 2-2-1." },
    ],
    priorityPlayers: [
      { id: "pl1", name: "Hulk", team: "Atlético-MG", position: "Atacante", number: 7, reason: "Referência da equipe, cobrador oficial", marketValue: "€5M", demand: "Alta" },
      { id: "pl2", name: "Matheus Pereira", team: "Cruzeiro", position: "Meia", number: 10, reason: "Meia criativo em alta", marketValue: "€9M", demand: "Média" },
      { id: "pl3", name: "Paulinho", team: "Atlético-MG", position: "Atacante", number: 10, reason: "Retorno após convocação", marketValue: "€14M", demand: "Alta" },
    ],
    mustShoot: [
      "Vista panorâmica noturna da Arena MRV",
      "Comemoração de gol no setor sul",
      "Cobrança de falta do Hulk",
      "Duelo dos meias no meio-campo",
    ],
    checklist: baseChecklist,
    shotList: [
      { id: "s1", title: "Panorâmica do estádio à noite", description: "Grande angular do topo da arquibancada", priority: "essencial" },
      { id: "s2", title: "Cobranças de falta", description: "Formação da barreira + goleiro", priority: "essencial" },
      { id: "s3", title: "Duelos individuais", description: "Meias em disputa por bola dividida", priority: "recomendada" },
      { id: "s4", title: "Bastidores do banco", description: "Comunicação técnico-jogadores", priority: "extra" },
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
    editorialScore: 62,
    distanceKm: 78,
    weather: { condition: "Nublado", tempC: 22, humidity: 78, icon: "cloud" },
    pautasCount: 4,
    priorityPlayersCount: 3,
    opportunity: "low",
    reasons: [
      "Alta concorrência de fotógrafos credenciados",
      "Iluminação limitada em setores específicos",
      "Demanda editorial moderada para o meio de semana",
    ],
    summary:
      "Clássico regional na Vila Belmiro. Menor demanda editorial por ser meio de semana, mas com narrativa forte de recuperação do Santos.",
    pautas: [
      { id: "p1", title: "Santos em recuperação", description: "Time busca sair da zona de rebaixamento." },
      { id: "p2", title: "Vila Belmiro histórica", description: "Ambientes clássicos do futebol brasileiro." },
    ],
    priorityPlayers: [
      { id: "pl1", name: "Lucas Moura", team: "São Paulo", position: "Meia", number: 7, reason: "Retorno ao futebol brasileiro", marketValue: "€12M", demand: "Alta" },
      { id: "pl2", name: "Guilherme", team: "Santos", position: "Atacante", number: 11, reason: "Revelação da base", marketValue: "€3M", demand: "Média" },
    ],
    mustShoot: [
      "Ambientes clássicos da Vila Belmiro",
      "Lucas Moura em ação com camisa tricolor",
      "Torcida santista no setor coberto",
    ],
    checklist: baseChecklist,
    shotList: [
      { id: "s1", title: "Arquitetura da Vila", description: "Ambientes históricos do estádio", priority: "essencial" },
      { id: "s2", title: "Lucas Moura em ação", description: "Priorizar dribles e finalizações", priority: "essencial" },
      { id: "s3", title: "Torcida santista", description: "Bandeirões e mosaicos", priority: "recomendada" },
    ],
  },
];

export const getGameById = (id: string): Game | undefined => mockGames.find((g) => g.id === id);

export const pendingCredentials: Credential[] = [
  { id: "cr1", gameId: "flu-fla-2026", homeTeam: "Fluminense", awayTeam: "Flamengo", status: "pendente", deadline: "24/07" },
  { id: "cr2", gameId: "pal-cor-2026", homeTeam: "Palmeiras", awayTeam: "Corinthians", status: "aguardando", deadline: "25/07" },
  { id: "cr3", gameId: "atl-cru-2026", homeTeam: "Atlético-MG", awayTeam: "Cruzeiro", status: "pendente", deadline: "27/07" },
];

export const daySummary: DaySummary = {
  gamesToday: 3,
  newOpportunities: 2,
  pendingCredentials: 3,
  totalPautas: mockGames.reduce((acc, g) => acc + g.pautasCount, 0),
};

export const userProfile: UserProfile = {
  firstName: "Rafael",
};

