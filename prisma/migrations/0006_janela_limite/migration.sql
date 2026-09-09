-- Caderno Aberto. Migração 0006: janela do limite de tentativas.
-- Guarda cada tentativa com a chave (rota + IP) para o limite
-- valer entre instâncias e reinícios.

create table if not exists public.tentativas_limite (
  chave text not null,
  feita_em timestamptz not null default now(),
  constraint tentativas_limite_pkey primary key (chave, feita_em)
);

create index if not exists tentativas_limite_feita_idx on public.tentativas_limite (feita_em);
