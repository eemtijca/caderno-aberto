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

Cada disciplina também escolhe um ícone entre 16 opções (`ICONES_DISCIPLINA`). A escolha usa `SeletorIcone` (`src/components/seletor-icone.tsx`), um menu suspenso em que cada opção mostra o ícone e o rótulo do nome.

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
- Animações de entrada (`na-entra`, `na-cascata`, `na-pulso` e `na-realce`) são curtas e respeitam `prefers-reduced-motion`. A cascata tem teto de atraso para listas longas.
- Painéis expansíveis usam `Collapsible` com `animate-collapsible-down` e `animate-collapsible-up` (metadados da nota e notas sem turma), e o conteúdo das abas entra com fade. O status de salvamento e o bloco recém-inserido ou duplicado recebem realce próprio.

## Temas

Claro, escuro e sistema, com `next-themes` (`attribute="class"`, padrão sistema). O HTML usa `suppressHydrationWarning`. A cor da barra do navegador acompanha o tema.

Há dois controles de tema:

- `SeletorTema` (`src/components/seletor-tema.tsx`): menu com as três opções (Sistema, Claro e Escuro), indicador na opção ativa e ícone do tema corrente no botão. Usado na tela de login e na interface autenticada (sidebar e topbar).
- Alternador binário da página pública: revela o ícone do tema oposto ao atual.

Os elementos clicáveis usam `cursor: pointer` por uma regra global em `globals.css`; os primitivos de menu e seleção não fixam mais `cursor-default`.

## Navegação

- Rotas hash: `#/`, `#/notas`, `#/organizacao`, `#/links`, `#/lixeira`, `#/configuracoes` com as seções `#/configuracoes/perfil`, `#/configuracoes/seguranca`, `#/configuracoes/disciplinas`, `#/configuracoes/turmas`, `#/configuracoes/dados` e `#/configuracoes/exclusao`, `#/admin`, `#/recuperacao`, `#/editor/:id`, `#/nota/:id`, `#/l/:token`, `#/entrar`, `#/codigo` e `#/solicitar`. O alias `#/conta` abre Configurações. Rota desconhecida volta ao início. A raiz anônima é a tela de login.
- Rotas reais: `/` (shell), `/l/[token]` (página pública com metadados e OpenGraph) e `/api/**`.
- Busca global com `Ctrl` ou `Cmd` mais `K`, com debounce, mínimo de 2 caracteres e tolerância a acentos.
- No mobile, a barra superior concentra a busca, o seletor de tema e o menu de perfil (Configurações e Sair). A barra inferior mantém cinco itens; o botão Mais abre um painel inferior (`Drawer`) com as opções que não cabem, como Turmas e Administração para contas admin.
- A tela de login oferece "Manter conectado neste dispositivo", marcado por padrão e lembrado no navegador para os próximos acessos, inclusive no uso de código e na troca de senha. Desmarcado, a sessão usa cookie de sessão e expira em 24 horas no servidor.

## Responsividade

- Desktop (a partir de 1024px): barra lateral fixa de 256px com navegação completa, botão Nova nota e um controle para recolher a barra a 76px, exibindo apenas os ícones. A preferência fica no navegador.
- Mobile (abaixo de 1024px): barra superior com logo, busca, seletor de tema e menu de perfil, e navegação inferior com cinco itens, incluindo o botão flutuante central de Nova nota. O perfil reúne Configurações e Sair; o botão Mais abre um painel inferior com as opções restantes (Turmas e Administração, quando aplicável). O conteúdo reserva espaço para a barra inferior.
- As grades usam `sm:grid-cols-2`, `sm:grid-cols-3` e `sm:grid-cols-4` conforme a vista. O editor alterna entre abas no mobile e duas colunas no desktop.

## Notificações

Os avisos usam Sonner, no topo e centralizados, com cores por tipo e botão de fechar. O tema do aviso segue o tema da aplicação. Ações reversíveis (notas e links na lixeira) oferecem **Desfazer** no próprio aviso. Há uma implementação legada de toast shadcn no repositório, não renderizada.

## Telas de estado

`TelaEstado` (`src/components/tela-estado.tsx`) padroniza erros e avisos: não encontrado, sessão expirada, sem permissão, removido, limite, erro interno, indisponível, offline, link inválido, pausado ou expirado, conta pendente, conta desativada e carência. As páginas do App Router (`not-found.tsx`, `error.tsx` e `global-error.tsx`) usam o mesmo padrão. Um aviso global aparece quando o navegador fica offline.

## Confirmação de ações destrutivas

`ConfirmacaoDestrutiva` (`src/components/confirmacao-destrutiva.tsx`) aplica fricção proporcional ao risco: exige digitar o alvo (e-mail ou palavra), informar motivo e confirmar com a senha conforme o caso. O botão de confirmar só habilita quando os campos conferem.

## Listas, filtros e paginação

Listas longas usam o paginador compartilhado (`src/components/paginacao.tsx`): resumo do intervalo, botões numerados com elipses no desktop e indicador compacto no mobile. Ao trocar de página a rolagem volta ao topo e o conteúdo entra com animação. Notas, Links, Lixeira e coleção pública paginam no cliente (`usePaginacao`), sobre dados já completos. Tamanhos: 12 notas, 10 links, 10 itens por seção da lixeira, 10 aulas na coleção pública e 20 nas listas do admin.

As listas do console de administração (Solicitações, Códigos, Usuários, Aprovações e Auditoria) paginam no servidor (`usePaginacaoServidor`): cada página é buscada com `pagina` e `porPagina`, o rodapé exibe o total real devolvido pela API e o filtro de cada aba reinicia a paginação. Assim os contadores do topo e a listagem ficam coerentes mesmo com centenas de registros.

Os filtros de Notas ficam em um botão com contador de ativos: painel em popover no desktop e bottom sheet no mobile, agrupado por disciplina, ano, mês e turma. Os filtros aplicados viram chips removíveis abaixo da busca e sobrevivem à navegação dentro da sessão (`useEstadoSessao`), assim como a posição de rolagem por rota.

## Atualização e seleção múltipla

As consultas usam `staleTime: 0`: ao entrar em uma tela, dados velhos são refeitos automaticamente. Todas as telas com dados exibem o `BotaoAtualizar` (`RefreshCw` girando enquanto busca, com rótulo apenas quando faz sentido), incluindo a leitura, o editor (salvar e atualizar), a página pública e as seções de Configurações e Administração.

Listas com ações em lote (Notas, Links e Lixeira) têm um modo de seleção: o botão Selecionar mostra os checkboxes, o clique no item marca em vez de abrir, o cabeçalho oferece Selecionar todos (todos os itens filtrados, inclusive entre páginas) e uma barra flutuante (`BarraLote`) concentra as ações, a contagem e o cancelar, posicionada acima da navegação inferior no mobile. A barra sobe ao entrar no modo de seleção, desce ao sair com transição suave e fica fixa à viewport durante a rolagem, renderizada em portal no `body`. `Esc` sai do modo. As ações rodam em servidor por lotes de até 100 ids, e itens ausentes ficam selecionados para nova tentativa. Na Lixeira, o botão Limpar lixeira esvazia a lixeira em definitivo, exigindo digitar LIMPAR para confirmar.

## Carregamento

Cada região tem estado próprio de carregamento com esqueletos e `aria-busy`. Números exibem marcador pulsante enquanto carregam. Botões em processamento mostram ícone de carregamento e ficam desabilitados, incluindo salvar inline, restaurar da lixeira, revogar código, duplicar nota, importar nota e as atualizações do admin. O editor sinaliza `alterações pendentes`, `salvando`, `salvo` ou erro em uma região de status.

## Acessibilidade

- Movimento reduzido: as animações próprias são desativadas e as durações são reduzidas a quase zero sob `prefers-reduced-motion: reduce`.
- Foco visível em controles e navegação.
- Rótulos e atributos ARIA em ícones, filtros, regiões e diálogos; o título e a descrição da busca global existem para leitores de tela.
- Marco semântico com `aside`, `header`, `main`, `nav` e `footer`.
- Imagens com texto alternativo derivado da legenda e estrutura `figure` e `figcaption`.
- Alternativas de quiz viram texto na impressão.

## Impressão

A área de impressão usa A4 com margens de 10mm por 11mm e duas colunas. O documento é renderizado em um portal no `body` (`AreaImpressao` e `DocumentoImpresso` em `src/components/notas/area-impressao.tsx`), oculto na tela e exibido apenas no papel; a interface sai por `display`, sem ocupar espaço, o que elimina a página em branco ao final. O tema escuro é suspenso durante a impressão (`src/hooks/use-impressao.ts`) para preservar as cores das caixas. O cabeçalho impresso reúne disciplina, período, turmas, título, professor, resumo e habilidades, e o rodapé fecha com a assinatura da nota. Elementos de bloco respeitam `break-inside: avoid` e `orphans` e `widows`; títulos usam `break-after: avoid`. Ver [ADR-007](adr/007-impressao-em-portal.md).
