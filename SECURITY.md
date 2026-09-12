# Segurança

Reporte vulnerabilidades pelo GitHub, em issue privada ou security advisory. Nunca abra issue pública com dados sensíveis e nunca inclua dados reais de professores ou alunos.

## Como reportar

Inclua, quando possível:

- Descrição do problema e impacto potencial.
- Passos para reproduzir, com o menor exemplo possível.
- Versão ou commit afetado.
- Sugestão de correção, se houver.

O retorno é feito pelo próprio canal do GitHub. Vulnerabilidades confirmadas são corrigidas antes da divulgação pública.

## Compromissos

- Respostas de autenticação genéricas, sem enumeração de contas.
- Sessões revogáveis; troca e recuperação de senha invalidam as sessões ativas.
- Isolamento por professor no banco, com RLS como segunda barreira.
- Tokens de links públicos com 128 bits de entropia, expiração, pausa e revogação.
- Upload de imagens validado por bytes mágicos e SVG servido com sandbox.
- Dependências atualizadas via Dependabot para npm, GitHub Actions e Docker.

## Fora de escopo

- Engenharia social e ataques físicos.
- Negação de serviço volumétrica contra a infraestrutura de hospedagem.
- Vulnerabilidades em dependências já corrigidas em versões posteriores.

## Detalhes de implementação

O detalhamento dos controles está em [docs/seguranca.md](docs/seguranca.md).
