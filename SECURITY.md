# Segurança

Reporte vulnerabilidades pelo GitHub (issue privada ou security
advisory), nunca em issue pública e nunca com dados reais.

## Compromissos

- Respostas de autenticação genéricas (sem enumeração).
- Sessões revogáveis; troca e recuperação invalidam as ativas.
- Isolamento por professor no banco, com RLS de segunda barreira.
- Dependências atualizadas via Dependabot (npm, actions, docker).

## Fora de escopo deste arquivo

Detalhes de implementação: ver `docs/seguranca.md`.
