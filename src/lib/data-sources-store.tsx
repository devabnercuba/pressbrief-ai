// Fontes de dados cadastradas pelo usuário (Universal Data Source).
// Persistidas localmente; o DataSource Manager consome esta lista.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { DataSourceConfig, DataSourceType } from "@/dataSources/dataSourceTypes";

const STORAGE_KEY = "pressbrief:data-sources:v1";

export const DEFAULT_SOURCES: DataSourceConfig[] = [
  {
    id: "football-data-api",
    name: "Football-Data API",
    type: "api",
    enabled: true,
  },
];

export const SOURCE_TYPE_LABELS: Record<DataSourceType, string> = {
  api: "API",
  url: "URL",
  excel: "Planilha",
  pdf: "PDF",
  rss: "RSS",
  json: "JSON",
  manual: "Manual",
  database: "Banco de dados",
};

interface DataSourcesContextValue {
  sources: DataSourceConfig[];
  addSource: (input: Omit<DataSourceConfig, "id">) => DataSourceConfig;
  updateSource: (id: string, patch: Partial<Omit<DataSourceConfig, "id">>) => void;
  removeSource: (id: string) => void;
  toggleSource: (id: string) => void;
}

const DataSourcesContext = createContext<DataSourcesContextValue | null>(null);

function readStored(): DataSourceConfig[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DataSourceConfig[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function DataSourcesProvider({ children }: { children: ReactNode }) {
  const [sources, setSources] = useState<DataSourceConfig[]>(DEFAULT_SOURCES);

  useEffect(() => {
    const stored = readStored();
    if (stored) setSources(stored);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sources));
  }, [sources]);

  const addSource = useCallback((input: Omit<DataSourceConfig, "id">) => {
    const source: DataSourceConfig = {
      ...input,
      id: `src-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    };
    setSources((prev) => [...prev, source]);
    return source;
  }, []);

  const updateSource = useCallback(
    (id: string, patch: Partial<Omit<DataSourceConfig, "id">>) => {
      setSources((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    },
    [],
  );

  const removeSource = useCallback((id: string) => {
    setSources((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const toggleSource = useCallback((id: string) => {
    setSources((prev) => prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)));
  }, []);

  const value = useMemo(
    () => ({ sources, addSource, updateSource, removeSource, toggleSource }),
    [sources, addSource, updateSource, removeSource, toggleSource],
  );

  return <DataSourcesContext.Provider value={value}>{children}</DataSourcesContext.Provider>;
}

export function useDataSources(): DataSourcesContextValue {
  const ctx = useContext(DataSourcesContext);
  if (!ctx) throw new Error("useDataSources precisa estar dentro de DataSourcesProvider");
  return ctx;
}
