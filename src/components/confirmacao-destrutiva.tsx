"use client";

// Diálogo reutilizável para ações destrutivas, com fricção proporcional ao dano:
// digitação do alvo, motivo e senha (step-up).

import { useEffect, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface Alvo {
  rotulo: string;
  valor: string;
  placeholder?: string;
}

interface Props {
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
  titulo: string;
  descricao: React.ReactNode;
  resumo?: React.ReactNode;
  alvo?: Alvo;
  precisaMotivo?: boolean | { minimo?: number; rotulo?: string };
  exigeSenha?: boolean;
  textoConfirmar?: string;
  /** Ações restaurativas usam o botão padrão, sem o vermelho de perigo. */
  varianteConfirmar?: "default" | "destructive";
  onConfirmar: (dados: { senha: string; motivo: string }) => Promise<void>;
}

export function ConfirmacaoDestrutiva({
  aberto,
  onOpenChange,
  titulo,
  descricao,
  resumo,
  alvo,
  precisaMotivo,
  exigeSenha,
  textoConfirmar = "Confirmar",
  varianteConfirmar = "destructive",
  onConfirmar,
}: Props) {
  const [digitado, setDigitado] = useState("");
  const [motivo, setMotivo] = useState("");
  const [senha, setSenha] = useState("");
  const [processando, setProcessando] = useState(false);

  // Reinicia os campos a cada abertura.
  useEffect(() => {
    if (aberto) {
      setDigitado("");
      setMotivo("");
      setSenha("");
    }
  }, [aberto]);

  const minimoMotivo =
    typeof precisaMotivo === "object" ? (precisaMotivo.minimo ?? 5) : precisaMotivo ? 5 : 0;
  const rotuloMotivo =
    typeof precisaMotivo === "object" ? (precisaMotivo.rotulo ?? "Motivo") : "Motivo";

  const alvoOk = !alvo || digitado.trim().toLowerCase() === alvo.valor.trim().toLowerCase();
  const motivoOk = !precisaMotivo || motivo.trim().length >= minimoMotivo;
  const senhaOk = !exigeSenha || senha.length > 0;
  const podeConfirmar = alvoOk && motivoOk && senhaOk && !processando;

  const confirmar = async () => {
    setProcessando(true);
    try {
      await onConfirmar({ senha, motivo });
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível concluir a ação.");
    } finally {
      setProcessando(false);
    }
  };

  return (
    <AlertDialog
      open={aberto}
      onOpenChange={(v) => {
        if (!processando) onOpenChange(v);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="text-destructive h-5 w-5" aria-hidden /> {titulo}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <div>{descricao}</div>

              {resumo ? (
                <div className="bg-muted/40 rounded-lg border p-3 text-sm">{resumo}</div>
              ) : null}

              {alvo ? (
                <div className="grid gap-1.5">
                  <Label htmlFor="conf-alvo">{alvo.rotulo}</Label>
                  <Input
                    id="conf-alvo"
                    value={digitado}
                    onChange={(e) => setDigitado(e.target.value)}
                    placeholder={alvo.placeholder ?? alvo.valor}
                    autoComplete="off"
                    autoFocus
                    className="rounded-lg"
                  />
                </div>
              ) : null}

              {precisaMotivo ? (
                <div className="grid gap-1.5">
                  <Label htmlFor="conf-motivo">{rotuloMotivo}</Label>
                  <Textarea
                    id="conf-motivo"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    placeholder="Informe o motivo (mínimo de 5 caracteres)"
                    autoFocus={!alvo}
                    className="min-h-20 rounded-lg"
                  />
                </div>
              ) : null}

              {exigeSenha ? (
                <div className="grid gap-1.5">
                  <Label htmlFor="conf-senha">Sua senha</Label>
                  <Input
                    id="conf-senha"
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    autoComplete="current-password"
                    autoFocus={!alvo && !precisaMotivo}
                    className="rounded-lg"
                  />
                </div>
              ) : null}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-xl" disabled={processando}>
            Cancelar
          </AlertDialogCancel>
          <Button
            variant={varianteConfirmar}
            className="rounded-xl"
            disabled={!podeConfirmar}
            onClick={() => void confirmar()}
          >
            {processando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            {textoConfirmar}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
