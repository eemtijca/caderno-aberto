"use client";

// Vista Lixeira: itens excluídos recentemente, restauráveis dentro do prazo.

import { BookOpenText, Link2, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  useLixeira,
  useRestaurarLink,
  useRestaurarNota,
  type LixeiraInfo,
} from "@/lib/notas/api-client";
import { useQueryClient } from "@tanstack/react-query";

export function VistaLixeira() {
  const { data, isLoading } = useLixeira();
  const restaurarNota = useRestaurarNota();
  const restaurarLink = useRestaurarLink();
  const qc = useQueryClient();

  const restaurar = async (tipo: "nota" | "link", id: string, rotulo: string) => {
    try {
      if (tipo === "nota") await restaurarNota.mutateAsync(id);
      else await restaurarLink.mutateAsync(id);
      toast.success("Item restaurado", { description: rotulo });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível restaurar.");
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <header>
        <h1 className="fonte-display text-2xl font-bold">Lixeira</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Notas e links excluídos ficam disponíveis por {data?.dias ?? 30} dias antes da remoção
          definitiva.
        </p>
      </header>

      {isLoading ? (
        <div className="space-y-3" aria-busy="true">
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-5/6 rounded-2xl" />
        </div>
      ) : (
        <Conteudo
          dados={data}
          onRestaurar={restaurar}
          onLimpar={() => {
            qc.invalidateQueries({ queryKey: ["lixeira"] });
          }}
        />
      )}
    </div>
  );
}

function Conteudo({
  dados,
  onRestaurar,
  onLimpar,
}: {
  dados: LixeiraInfo | undefined;
  onRestaurar: (tipo: "nota" | "link", id: string, rotulo: string) => void;
  onLimpar: () => void;
}) {
  const notas = dados?.notas ?? [];
  const links = dados?.links ?? [];

  if (notas.length === 0 && links.length === 0) {
    return (
      <div className="border-border rounded-2xl border border-dashed p-10 text-center">
        <Trash2 className="text-muted-foreground/60 mx-auto h-8 w-8" aria-hidden />
        <p className="fonte-display mt-3 font-bold">A lixeira está vazia</p>
        <p className="text-muted-foreground mx-auto mt-1 max-w-md text-sm">
          Ao excluir uma nota ou um link, o item aparece aqui e pode ser restaurado por{" "}
          {dados?.dias ?? 30} dias.
        </p>
        <Button variant="outline" onClick={onLimpar} className="mt-4 rounded-xl">
          Atualizar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {notas.length > 0 ? (
        <section className="space-y-2">
          <h2 className="fonte-display px-1 text-lg font-bold">Notas</h2>
          <ul className="space-y-2">
            {notas.map((n) => (
              <li
                key={n.id}
                className="border-border bg-card flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3"
              >
                <BookOpenText className="text-muted-foreground h-4 w-4 shrink-0" aria-hidden />
                <span className="min-w-0 flex-1 truncate font-semibold">{n.titulo}</span>
                <span className="text-muted-foreground text-[0.72rem]">
                  {n.excluidoEm ? new Date(n.excluidoEm).toLocaleString("pt-BR") : ""}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 rounded-lg"
                  onClick={() => onRestaurar("nota", n.id, n.titulo)}
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Restaurar
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {links.length > 0 ? (
        <section className="space-y-2">
          <h2 className="fonte-display px-1 text-lg font-bold">Links</h2>
          <ul className="space-y-2">
            {links.map((l) => (
              <li
                key={l.id}
                className="border-border bg-card flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3"
              >
                <Link2 className="text-muted-foreground h-4 w-4 shrink-0" aria-hidden />
                <span className="min-w-0 flex-1 truncate font-semibold">
                  {l.nome || `Link de ${l.tipo}`}
                </span>
                <span className="text-muted-foreground text-[0.72rem]">
                  {l.excluidoEm ? new Date(l.excluidoEm).toLocaleString("pt-BR") : ""}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 rounded-lg"
                  onClick={() => onRestaurar("link", l.id, l.nome || `Link de ${l.tipo}`)}
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Restaurar
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
