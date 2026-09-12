# ADR-004: acesso por código gerido pela administração

- Estado: aceita.
- Data: 2026.

## Contexto

A aplicação atende uma única escola e não dispõe de domínio de e-mail verificado para envio transacional. O cadastro e a recuperação dependiam de links enviados por e-mail, o que tornava o fluxo inoperante. O produto também deixa de ser um SaaS: a tela inicial passa a ser o login.

## Decisão

1. Remover o envio de e-mail e a verificação por link.
2. Usar um código de 8 caracteres de um alfabeto sem ambíguos, gerado com aleatoriedade criptográfica e guardado apenas como HMAC-SHA256 com o `AUTH_SECRET`.
3. Introduzir o papel `admin` em `usuarios.papel` e um console em `#/admin` com fila de solicitações, emissão e revogação de códigos, gestão de contas e auditoria.
4. Criar o primeiro administrador por script idempotente (`npm run criar-admin`) a partir de `ADMIN_EMAIL`, `ADMIN_SENHA` e `ADMIN_NOME`.
5. Primeiro acesso e recuperação compartilham um único endpoint de uso de código; o professor solicita e a administração entrega o código.
6. Registrar ações sensíveis em `eventos_seguranca`.

## Alternativas consideradas

- Manter o e-mail como canal opcional: descartada pela dependência de provedor e pelo custo de manter dois fluxos.
- Código em texto puro no banco: descartada pelo risco de vazamento em dumps e logs; o HMAC com pepper protege o segredo.
- Auto-cadastro aberto: descartada porque a escola controla quem recebe acesso.
- Papel de administrador separado das funções de professor: descartada porque, na escola, a gestão também produz notas.

## Consequências

- O acesso não depende de infraestrutura de e-mail nem de qualquer plataforma específica.
- A segurança do código depende de HMAC, validade curta, um código ativo por par (e-mail, tipo), consumo atômico e bloqueio por tentativas.
- Existe mais um papel a proteger, reconferido no banco a cada requisição; mudar papel ou desativar a conta derruba as sessões.
- A administração passa a ter um console e uma trilha de auditoria a manter.

Referências: [seguranca.md](../seguranca.md), [api.md](../api.md), [ambiente.md](../ambiente.md) e [arquitetura.md](../arquitetura.md).
