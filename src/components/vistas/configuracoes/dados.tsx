"use client";

// Seção Dados: backup completo, restauração blindada e snapshots de rollback.
// A importação de uma nota avulsa fica na tela Notas.

import { useEffect, useRef, useState } from "react";
import { Download, FileJson, History, RefreshCw, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmacaoDestrutiva } from "@/components/confirmacao-destrutiva";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  importarBackup,
  listarSnapshots,
  validarBackup,
  type ResumoBackup,
  type ContagemDados,
} from "@/lib/notas/api-client";

interface Snap {
  caminho: string;
  criadoEm: string | null;
}

function plural(n: number, singular: string, pluralForma: string): string {
  return `${n} ${n === 1 ? singular : pluralForma}`;
}

function lista(itens: string[]): string {
  if (itens.length <= 1) return itens[0] ?? "";
  return `${itens.slice(0, -1).join(", ")} e ${itens[itens.length - 1]}`;
}

function resumoContagem(c: ContagemDados): string {
  return lista([
    plural(c.notas, "nota", "notas"),
    plural(c.disciplinas, "disciplina", "disciplinas"),
    plural(c.turmas, "turma", "turmas"),
    plural(c.links, "link", "links"),
  ]);
}

export function SecaoDados() {
  const qc = useQueryClient();
  const inputBackup = useRef<HTMLInputElement>(null);
  const [conteudo, setConteudo] = useState<string | null>(null);
  const [resumo, setResumo] = useState<{ backup: ResumoBackup; atual: ContagemDados } | null>(null);
  const [validando, setValidando] = useState(false);
  const [restaurando, setRestaurando] = useState(false);
  const [snapshots, setSnapshots] = useState<Snap[]>([]);

  const recarregar = () => {
    qc.invalidateQueries();
    window.location.reload();
  };

  const carregarSnapshots = () => {
    void listarSnapshots().then(setSnapshots);
  };

  useEffect(() => {
    carregarSnapshots();
  }, []);

  const selecionarArquivo = async (arquivo: File) => {
    setValidando(true);
    try {
      const texto = await arquivo.text();
      const r = await validarBackup(texto);
      setConteudo(texto);
      setResumo(r);
    } catch (e) {
      toast.error("Arquivo de backup inválido", {
        description: e instanceof Error ? e.message : "Verifique o formato do arquivo.",
      });
    } finally {
      setValidando(false);
      if (inputBackup.current) inputBackup.current.value = "";
    }
  };

  return (
    <section className="na-cascata border-border bg-card rounded-2xl border p-5">
      <h2 className="fonte-display flex items-center gap-2 text-lg font-bold">
        <Download className="h-4.5 w-4.5" aria-hidden /> Backup e restauração
      </h2>
      <p className="text-muted-foreground mt-1 text-sm">
        O backup completo inclui disciplinas, turmas, notas, links e imagens. Tudo em um único
        arquivo JSON, pronto para restaurar em qualquer conta.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="border-border space-y-2 rounded-xl border p-4">
          <p className="text-sm font-bold">Exportar tudo</p>
          <p className="text-muted-foreground text-[0.8rem] leading-snug">
            Baixe o arquivo JSON com todos os dados. Guarde uma cópia: é a garantia contra perdas.
          </p>
          <Button
            variant="outline"
            className="gap-2 rounded-lg"
            onClick={() => window.open("/api/backup", "_blank")}
          >
            <FileJson className="h-4 w-4" aria-hidden /> Baixar backup completo
          </Button>
        </div>

        <div className="border-border space-y-2 rounded-xl border p-4">
          <p className="text-sm font-bold">Restaurar</p>
          <p className="text-muted-foreground text-[0.8rem] leading-snug">
            Restaure um backup completo. A operação substitui todos os dados atuais e um snapshot é
            guardado para rollback. Para importar uma nota avulsa, use a tela Notas.
          </p>
          <input
            ref={inputBackup}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void selecionarArquivo(f);
            }}
          />
          <Button
            variant="outline"
            className="gap-2 rounded-lg"
            disabled={validando}
            onClick={() => inputBackup.current?.click()}
          >
            {validando ? (
              <RefreshCw className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Upload className="h-4 w-4" aria-hidden />
            )}
            {validando ? "Analisando..." : "Restaurar backup"}
          </Button>
        </div>
      </div>

      {snapshots.length > 0 ? (
        <div className="border-border mt-4 rounded-xl border p-4">
          <p className="flex items-center gap-2 text-sm font-bold">
            <History className="h-4 w-4" aria-hidden /> Snapshots recentes
          </p>
          <p className="text-muted-foreground mt-1 text-[0.8rem] leading-snug">
            Cópias automáticas do estado anterior a cada restauração. Baixe e reimporte para
            desfazer.
          </p>
          <ul className="mt-2 space-y-1.5">
            {snapshots.map((s) => (
              <li key={s.caminho} className="flex items-center justify-between gap-2 text-sm">
                <span className="text-muted-foreground">
                  {s.criadoEm ? new Date(s.criadoEm).toLocaleString("pt-BR") : "Snapshot"}
                </span>
                <Button asChild variant="ghost" size="sm" className="h-8 rounded-lg text-xs">
                  <a href={`/api/backup/snapshots?caminho=${encodeURIComponent(s.caminho)}`}>
                    <Download className="h-3.5 w-3.5" aria-hidden /> Baixar
                  </a>
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <ConfirmacaoDestrutiva
        aberto={Boolean(resumo)}
        onOpenChange={(o) => {
          if (!o) {
            setResumo(null);
            setConteudo(null);
          }
        }}
        titulo="Substituir todos os dados"
        descricao="A restauração apaga os dados atuais do professor e recria a partir do arquivo. Um snapshot do estado atual será guardado antes."
        resumo={
          resumo ? (
            <div className="space-y-2">
              <p>
                <b>Arquivo:</b> {resumoContagem(resumo.backup.contagem)}
                {resumo.backup.exportadoEm
                  ? ` (exportado em ${new Date(resumo.backup.exportadoEm).toLocaleString("pt-BR")})`
                  : ""}
                .
              </p>
              <p>
                <b>Será substituído:</b> {resumoContagem(resumo.atual)}.
              </p>
            </div>
          ) : null
        }
        alvo={{ rotulo: "Digite SUBSTITUIR para confirmar", valor: "SUBSTITUIR" }}
        textoConfirmar="Baixar backup atual e restaurar"
        onConfirmar={async () => {
          if (!conteudo) return;
          setRestaurando(true);
          try {
            // Guarda uma cópia local do estado atual antes de substituir.
            window.open("/api/backup", "_blank");
            const r = await importarBackup(conteudo);
            toast.success("Backup restaurado", {
              description: r.snapshot
                ? "Um snapshot do estado anterior foi guardado para rollback."
                : "Os dados anteriores foram substituídos.",
            });
            setTimeout(recarregar, 1000);
          } finally {
            setRestaurando(false);
          }
        }}
      />

      {restaurando ? (
        <p className="text-muted-foreground mt-3 flex items-center gap-1.5 text-sm">
          <RefreshCw className="h-3.5 w-3.5 animate-spin" aria-hidden /> restaurando...
        </p>
      ) : null}
    </section>
  );
}
