// API Provider — a Football-Data passa a ser apenas mais uma fonte de dados.
import type { DataSourceProvider, ProviderContext } from "../dataSourceTypes";
import { fromAppGame } from "../gameNormalizer";
import { listMatchesForRange } from "@/services/footballDataService";

export const apiProvider: DataSourceProvider = {
  type: "api",
  label: "API esportiva",
  async load({ source, range }: ProviderContext) {
    if (!range) return [];
    const games = await listMatchesForRange(range);
    return games.map((game) => fromAppGame(game, source.name));
  },
};
