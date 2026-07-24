import { createContext, useContext, useState, type ReactNode } from "react";
import type { Game } from "@/types";


interface GamesStore {
  savedGames: Game[];
  addGame: (game: Game) => void;
  removeGame: (id: string) => void;
  hasGame: (id: string) => boolean;
}

const Ctx = createContext<GamesStore | null>(null);

export function GamesProvider({ children }: { children: ReactNode }) {
  const [savedGames, setSavedGames] = useState<Game[]>([]);

  const addGame = (game: Game) =>
    setSavedGames((prev) => (prev.some((g) => g.id === game.id) ? prev : [...prev, game]));
  const removeGame = (id: string) => setSavedGames((prev) => prev.filter((g) => g.id !== id));
  const hasGame = (id: string) => savedGames.some((g) => g.id === id);

  return (
    <Ctx.Provider value={{ savedGames, addGame, removeGame, hasGame }}>{children}</Ctx.Provider>
  );
}

export function useGamesStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useGamesStore must be used within GamesProvider");
  return ctx;
}
