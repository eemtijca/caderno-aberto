// Estado de carregamento do segmento raiz.

import { NotebookPen } from "lucide-react";

export default function Carregando() {
  return (
    <div className="bg-background flex min-h-dvh items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <span className="bg-primary text-primary-foreground flex h-12 w-12 items-center justify-center rounded-2xl">
          <NotebookPen className="h-6 w-6" aria-hidden />
        </span>
        <span className="flex items-center gap-2" role="status">
          <span className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-b-transparent" />
          <span className="text-muted-foreground text-sm">Carregando...</span>
        </span>
      </div>
    </div>
  );
}
