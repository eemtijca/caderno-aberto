# Interface

Design system, temas e padrões de interface. Os tokens ficam em `src/app/globals.css` (Tailwind CSS v4) e os componentes base em `src/components/ui/` (shadcn/ui).

## Paleta

A marca usa o verde institucional `#008241`, definido como `brand-600` em OKLCH. A escala `brand-50` a `brand-950` está disponível como utilitários.

| Uso              | Token claro                     | Token escuro                        |
| ---------------- | ------------------------------- | ----------------------------------- |
| Fundo            | `--background` (branco quente)  | `--background` (cinza muito escuro) |
| Texto            | `--foreground`                  | `--foreground`                      |
| Primária         | `--primary` igual a `brand-600` | verde claro dessaturado             |
| Secundária/Suave | `--secondary` e `--muted`       | variante escura                     |
| Destaque         | `--accent` (verde suave)        | variante escura                     |
| Destrutiva       | `--destructive` (vermelho)      | variante escura                     |
| Borda/Entrada    | `--border` e `--input`          | variantes escuras                   |
| Foco             | `--ring` igual a `brand-600`    | verde claro                         |

O `@theme inline` mapeia os tokens semânticos para utilitários do Tailwind. A barra lateral tem tokens próprios (`--sidebar-*`).

Cada disciplina recebe uma das 10 cores de `src/lib/notas/cores.ts` (verde, teal, violeta, rosa, âmbar, laranja, ciano, fúcsia, lima e pedra), com classes para chip, borda, ponto, texto e tons suaves, em modo claro e escuro.

## Tipografia

| Fonte                 | Variável            | Papel                               |
| --------------------- | ------------------- | ----------------------------------- |
| Sora                  | `--font-display`    | Títulos e elementos de destaque     |
| Plus Jakarta Sans     | `--font-corpo`      | Corpo padrão da aplicação           |
| JetBrains Mono        | `--font-mono-latex` | Código e fórmulas                   |
| Lora                  | `--font-serifada`   | Aparência de nota Serifada          |
| Atkinson Hyperlegible | `--font-legivel`    | Aparência de nota Alta legibilidade |
| Lexend                | `--font-lexend`     | Aparência de nota Leitura fluida    |

As fontes são carregadas com `next/font/google`. Os títulos usam `--font-display`. A aparência por nota define `--na-fonte`, `--na-escala` e `--na-entrelinha`, aplicadas ao contêiner `.na-nota`. A matemática acompanha a escala da nota. Ver [editor.md](editor.md).

## Formas e animações

- Raio base de 12px (`--radius`), com derivados de 8px a 16px. Controles usam `rounded-lg` ou `rounded-xl`; cartões e painéis usam `rounded-2xl`; blocos de destaque usam `rounded-3xl`.
- Sombras discretas (`shadow-sm` em cartões, `shadow-md` no estado interativo e `shadow-lg` no botão flutuante). A impressão remove todas as sombras.
- Animações de entrada (`na-entra`, `na-cascata` e `na-pulso`) são curtas e respeitam `prefers-reduced-motion`.

## Temas

Claro, escuro e sistema, com `next-themes` (`attribute="class"`, padrão sistema). O HTML usa `suppressHydrationWarning`. O alternador exibe o ícone do tema oposto ao atual. A cor da barra do navegador acompanha o tema.

## Navegação

- Rotas hash: `#/`, `#/notas`, `#/organizacao`, `#/links`, `#/conta`, `#/admin`, `#/editor/:id`, `#/nota/:id`, `#/l/:token`, `#/entrar`, `#/codigo` e `#/solicitar`. Rota desconhecida volta ao início. A raiz anônima é a tela de login.
- Rotas reais: `/` (shell), `/l/[token]` (página pública com metadados e OpenGraph) e `/api/**`.
- Busca global com `Ctrl` ou `Cmd` mais `K`, com debounce, mínimo de 2 caracteres e tolerância a acentos.

## Responsividade

- Desktop (a partir de 1024px): barra lateral fixa de 256px com navegação completa e botão Nova nota.
- Mobile (abaixo de 1024px): barra superior e navegação inferior com cinco itens, incluindo o botão flutuante central de Nova nota. O conteúdo reserva espaço para a barra inferior.
- As grades usam `sm:grid-cols-2`, `sm:grid-cols-3` e `sm:grid-cols-4` conforme a vista. O editor alterna entre abas no mobile e duas colunas no desktop.

## Notificações

Os avisos usam Sonner, no topo e centralizados, com cores por tipo e botão de fechar. O tema do aviso segue o tema da aplicação. Há uma implementação legada de toast shadcn no repositório, não renderizada.

## Carregamento

Cada região tem estado próprio de carregamento com esqueletos e `aria-busy`. Números exibem marcador pulsante enquanto carregam. Botões em processamento mostram ícone de carregamento, e o editor sinaliza `salvando`, `salvo` ou erro em uma região de status.

## Acessibilidade

- Movimento reduzido: as animações próprias são desativadas e as durações são reduzidas a quase zero sob `prefers-reduced-motion: reduce`.
- Foco visível em controles e navegação.
- Rótulos e atributos ARIA em ícones, filtros, regiões e diálogos; o título e a descrição da busca global existem para leitores de tela.
- Marco semântico com `aside`, `header`, `main`, `nav` e `footer`.
- Imagens com texto alternativo derivado da legenda e estrutura `figure` e `figcaption`.
- Alternativas de quiz viram texto na impressão.

## Impressão

A área de impressão usa A4 com margens de 10mm por 11mm e duas colunas. A interface é oculta por `visibility`, o foco fica na área de impressão, o tema claro é forçado e os elementos de bloco respeitam `break-inside: avoid` e `orphans` e `widows`. Títulos usam `break-after: avoid`.
