import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Game } from "@/types";
import { useGamesStore } from "./games-store";
import {
  createRequest,
  transitionStatus,
  type CredentialRequest,
  type CredentialStatus,
} from "./credentials";

interface CredentialsStore {
  requests: CredentialRequest[];
  getByGameId: (gameId: string) => CredentialRequest | undefined;
  setStatus: (gameId: string, status: CredentialStatus) => void;
  updateNotes: (gameId: string, notes: string) => void;
  setExpectedResponseDate: (gameId: string, date: string | null) => void;
  ensureRequest: (game: Game, status?: CredentialStatus) => void;
}

const Ctx = createContext<CredentialsStore | null>(null);

export function CredentialsProvider({ children }: { children: ReactNode }) {
  const { savedGames } = useGamesStore();
  const [requests, setRequests] = useState<CredentialRequest[]>([]);

  // Sincroniza com Meus Jogos: novo interesse cria CR; remoção marca CANCELADO
  // (preservando histórico em vez de apagar).
  useEffect(() => {
    setRequests((prev) => {
      const map = new Map(prev.map((r) => [r.gameId, r]));
      // Adiciona/reativa
      for (const g of savedGames) {
        const cur = map.get(g.id);
        if (!cur) {
          map.set(g.id, createRequest(g, "INTERESSE"));
        } else if (cur.status === "CANCELADO") {
          map.set(g.id, transitionStatus({ ...cur, game: g }, "INTERESSE"));
        } else {
          // Atualiza snapshot do jogo (caso a API tenha novos dados)
          map.set(g.id, { ...cur, game: g });
        }
      }
      // Marca como CANCELADO quem saiu de Meus Jogos, exceto estados finais
      const savedIds = new Set(savedGames.map((g) => g.id));
      for (const r of map.values()) {
        if (!savedIds.has(r.gameId) && r.status !== "CANCELADO" && r.status !== "APROVADO" && r.status !== "NEGADO") {
          map.set(r.gameId, transitionStatus(r, "CANCELADO"));
        }
      }
      return Array.from(map.values());
    });
  }, [savedGames]);

  const getByGameId = useCallback(
    (gameId: string) => requests.find((r) => r.gameId === gameId),
    [requests],
  );

  const setStatus = useCallback((gameId: string, status: CredentialStatus) => {
    setRequests((prev) => prev.map((r) => (r.gameId === gameId ? transitionStatus(r, status) : r)));
  }, []);

  const updateNotes = useCallback((gameId: string, notes: string) => {
    setRequests((prev) => prev.map((r) => (r.gameId === gameId ? { ...r, notes } : r)));
  }, []);

  const setExpectedResponseDate = useCallback((gameId: string, date: string | null) => {
    setRequests((prev) =>
      prev.map((r) => (r.gameId === gameId ? { ...r, expectedResponseDate: date } : r)),
    );
  }, []);

  const ensureRequest = useCallback((game: Game, status: CredentialStatus = "INTERESSE") => {
    setRequests((prev) =>
      prev.some((r) => r.gameId === game.id) ? prev : [...prev, createRequest(game, status)],
    );
  }, []);

  const value = useMemo(
    () => ({ requests, getByGameId, setStatus, updateNotes, setExpectedResponseDate, ensureRequest }),
    [requests, getByGameId, setStatus, updateNotes, setExpectedResponseDate, ensureRequest],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCredentialsStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCredentialsStore must be used within CredentialsProvider");
  return ctx;
}
