-- Caderno Aberto. Aparência por nota: fonte, escala e entrelinha escolhidas
-- pelo professor no editor e refletidas para todos que leem a nota,
-- incluindo os alunos que entram pelo link de compartilhamento.

-- 1. Nova coluna em notas (JSONB simples; vazio = padrão do app)

alter table public.notas
  add column if not exists aparencia jsonb not null default '{}'::jsonb;

comment on column public.notas.aparencia is
  'Aparência da leitura: {fonte, escala, entrelinha}. Objeto vazio usa o padrão do app.';

-- RLS e GRANTs já cobrem a nova coluna: as políticas de notas valem por
-- linha (for all) e os grants da tabela são de coluna inteira, portanto
-- nenhuma política nova é necessária.
