import { Link, useRouterState } from "@tanstack/react-router";
import { Radar, Star, Calendar, BarChart3, User, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGamesStore } from "@/lib/games-store";

const items = [
  { to: "/", label: "Radar", icon: Radar },
  { to: "/meus-jogos", label: "Meus Jogos", icon: Star },
  { to: "/calendario", label: "Calendário", icon: Calendar },
  { to: "/historico", label: "Histórico", icon: BarChart3 },
  { to: "/perfil", label: "Perfil", icon: User },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
] as const;

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { savedGames } = useGamesStore();

  return (
    <aside className="hidden md:flex md:w-64 lg:w-72 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="px-6 pt-7 pb-8">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <span className="text-sm font-bold">P</span>
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-sidebar-foreground">
              PressBrief AI
            </h1>
          </div>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Inteligência para Fotógrafos Esportivos
        </p>
      </div>

      <nav className="flex-1 px-3">
        <ul className="space-y-0.5">
          {items.map((item) => {
            const active =
              item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            const badge = item.to === "/meus-jogos" ? savedGames.length : 0;
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={cn(
                    "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      active ? "text-primary" : "text-sidebar-foreground/60",
                    )}
                  />
                  <span className="flex-1">{item.label}</span>
                  {badge > 0 && (
                    <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      {badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4">
        <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-3">
          <p className="text-xs font-medium text-sidebar-foreground">Beta v0.1</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Dados simulados. Integrações em breve.
          </p>
        </div>
      </div>
    </aside>
  );
}
