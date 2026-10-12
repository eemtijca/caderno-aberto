"use client";

// Diálogo institucional: projeto, desenvolvimento, repositório e licença.

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const DESENVOLVEDORES = [
  { nome: "Emanuel Lázaro", url: "https://github.com/emanuellcs" },
  { nome: "Prof. Josué Cavalcante", url: "https://github.com/wolf9611" },
];

const REPOSITORIO = "https://github.com/eemtijca/caderno-aberto";

export function DialogoSobre({ aberto, aoFechar }: { aberto: boolean; aoFechar: () => void }) {
  return (
    <Dialog
      open={aberto}
      onOpenChange={(valor) => {
        if (!valor) aoFechar();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="fonte-display">Sobre o Caderno Aberto</DialogTitle>
          <DialogDescription>
            Plataforma gratuita para professores elaborarem notas de aula e entregá-las aos alunos
            por links únicos e gerenciáveis.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div className="space-y-1.5">
            <p className="font-medium">Desenvolvimento</p>
            <ul className="space-y-1">
              {DESENVOLVEDORES.map(({ nome, url }) => (
                <li key={url}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline-offset-4 hover:underline"
                  >
                    {nome}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <p>
            <a
              href={REPOSITORIO}
              target="_blank"
              rel="noopener noreferrer"
              className="underline-offset-4 hover:underline"
            >
              Repositório do projeto no GitHub
            </a>
          </p>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Código aberto sob a licença MIT, mantido pela equipe do Caderno Aberto na EEMTI José
            Cláudio de Araújo.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
