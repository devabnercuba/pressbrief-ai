import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  step?: number;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function BriefingSection({ step, title, subtitle, icon, actions, children, className }: Props) {
  return (
    <section className={cn("rounded-xl border border-border bg-card p-6", className)}>
      <header className="flex items-start justify-between gap-4 border-b border-border/60 pb-4">
        <div className="flex items-start gap-3">
          {step !== undefined && (
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-primary/15 text-xs font-semibold text-primary">
              {step}
            </span>
          )}
          {icon && !step && <div className="text-primary">{icon}</div>}
          <div>
            <h2 className="text-base font-semibold tracking-tight text-foreground">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </header>
      <div className="mt-5">{children}</div>
    </section>
  );
}
