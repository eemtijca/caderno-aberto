# ADR-002: provedores agnósticos de e-mail e imagens

- Estado: substituída parcialmente pelo [ADR-004](004-acesso-por-codigo.md). O envio de e-mail foi removido; a interface agnóstica de armazenamento de imagens permanece válida.
- Data: 2026.

## Contexto

Acoplar o sistema a um único provedor de e-mail ou de armazenamento prende o deploy a um fornecedor e dificulta ambientes de desenvolvimento e CI. O sistema envia poucos e-mails transacionais e armazena imagens de figuras, ambos com requisitos simples.

## Decisão

Definir interfaces únicas e escolher a implementação por variável de ambiente:

- `ProvedorEmail` (`log`, `smtp` ou `resend`).
- `ProvedorArmazenamento` (`disk` local ou `s3` compatível com S3).

## Alternativas consideradas

- Provedores fixos (por exemplo, apenas Resend e S3): descartada pela dependência de fornecedor e pelo custo em desenvolvimento.
- Envio direto pela aplicação sem interface: descartada pela dificuldade de testar e trocar de provedor.

## Consequências

- Qualquer servidor SMTP ou serviço compatível com S3 atende ao sistema.
- O provedor `log` cobre desenvolvimento e CI, integrado à outbox de teste, desligada em produção.
- A interface precisa cobrir o mínimo comum entre provedores, o que limita recursos específicos.

Referências: [ambiente.md](../ambiente.md) e [operacao.md](../operacao.md).
