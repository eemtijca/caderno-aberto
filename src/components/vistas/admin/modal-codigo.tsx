"use client";

// Modal que exibe o código gerado uma única vez, com botão de copiar.

import { useState } from "react";
import { Check, Copy, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { copiarTexto } from "@/lib/clipboard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ROTULO_TIPO, type CodigoEmitido } from "./api";

export function ModalCodigo({
  emitido,
  aoFechar,
}: {
  emitido: CodigoEmitido | null;
  aoFechar: () => void;
}) {
  const [copiado, setCopiado] = useState(false);

  const copiar = async () => {
    if (!emitido) return;
    if (await copiarTexto(emitido.codigo)) {
      setCopiado(true);
      toast.success("Código copiado");
      setTimeout(() => setCopiado(false), 2000);
    } else {
      toast.error("Não foi possível copiar. Anote o código manualmente.");
    }
  };

  return (
    <Dialog
      open={Boolean(emitido)}
      onOpenChange={(aberto) => {
        if (!aberto) {
          setCopiado(false);
          aoFechar();
        }
      }}
    >
      <DialogContent
        className="sm:max-w-md"
        showCloseButton={false}
        // O código só aparece uma vez: evita perda por clique fora ou Esc.
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="fonte-display flex items-center gap-2">
            <KeyRound className="h-4.5 w-4.5" aria-hidden /> Código gerado
          </DialogTitle>
          <DialogDescription>
            Entregue este código a {emitido?.email}. Ele não será exibido novamente.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted mt-2 rounded-2xl p-4 text-center">
          <p className="text-muted-foreground text-[0.72rem] font-bold tracking-wider uppercase">
            {emitido ? ROTULO_TIPO[emitido.tipo] : ""}
          </p>
          <p className="fonte-display mt-2 font-mono text-3xl font-bold tracking-[0.3em] break-all">
            {emitido?.codigo}
          </p>
          <p className="text-muted-foreground mt-2 text-xs">
            Expira em {emitido ? new Date(emitido.expiraEm).toLocaleString("pt-BR") : ""}
          </p>
        </div>

        <DialogFooter className="sm:justify-between">
          <Button variant="outline" className="gap-2 rounded-xl" onClick={copiar}>
            {copiado ? (
              <Check className="h-4 w-4" aria-hidden />
            ) : (
              <Copy className="h-4 w-4" aria-hidden />
            )}
            {copiado ? "Copiado" : "Copiar código"}
          </Button>
          <Button className="rounded-xl" onClick={aoFechar}>
            Concluir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
