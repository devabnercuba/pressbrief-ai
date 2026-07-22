import { Search, SlidersHorizontal } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const filters = [
  {
    label: "Competição",
    options: ["Todas", "Brasileirão Série A", "Copa do Brasil", "Campeonato Gaúcho"],
  },
  { label: "Estado", options: ["Todos", "SP", "RJ", "RS", "MG"] },
  { label: "Raio de distância", options: ["Qualquer", "50 km", "100 km", "300 km", "500 km"] },
  { label: "Data", options: ["Hoje", "Amanhã", "Esta semana", "Este mês"] },
  { label: "Coverage Score", options: ["Qualquer", "70+", "80+", "90+"] },
];

export function FilterBar() {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filtros
        </div>
        <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {filters.map((f) => (
            <Select key={f.label}>
              <SelectTrigger className="h-9 bg-background/50 text-xs">
                <SelectValue placeholder={f.label} />
              </SelectTrigger>
              <SelectContent>
                {f.options.map((o) => (
                  <SelectItem key={o} value={o}>
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}
        </div>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          <Search className="mr-1.5 h-4 w-4" /> Buscar
        </Button>
      </div>
    </div>
  );
}
