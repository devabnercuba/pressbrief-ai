import { Loader2 } from "lucide-react";

interface Props {
  message?: string;
}

export function LoadingState({ message = "Carregando calendário..." }: Props) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin text-primary" />
      {message}
    </div>
  );
}
