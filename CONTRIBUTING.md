# Contribuindo

## Rotina

```bash
npm install
cp .env.example .env  # preencha DATABASE_URL, AUTH_SECRET e CRON_SECRET
npx prisma migrate deploy
npm run dev
```

Verificações antes de abrir um pull request: `npm run format:check`, `npm run lint`, `npm run tsc` e `npm test`.

## Convenções de código

- Código e comentários em português, curtos e diretos.
- Domínio em português (`notas`, `turmas`); infraestrutura em inglês (`backup`, `token`, nomes de pacotes).
- Rotas: sessão via `sessaoProfessor`, filtro pelo dono no banco e respostas via `json` ou `erroApi`, sem detalhes internos.
- Datas do banco trafegam como `Date` no servidor e ISO no JSON.
- Migrações: `npx prisma migrate dev --name ajuste`. Nunca edite uma migração aplicada, crie outra.
- Segredos apenas via ambiente. Ver [docs/ambiente.md](docs/ambiente.md).
- Ao alterar comportamento, atualize a documentação correspondente em [docs/](docs/README.md) e os testes.

## Comentários no código

- Cada arquivo próprio começa com um cabeçalho curto, de uma a duas linhas, descrevendo seu papel.
- Comente apenas trechos não óbvios, como decisões de segurança, contornos, cálculos e formatos de interoperabilidade.
- Não comente o óbvio nem repita o nome da função no comentário.

## Padrão da documentação

Toda a documentação usa português brasileiro com acentuação e cedilha corretas, em tom técnico e impessoal. Evite primeira pessoa, exclamações e frases de preenchimento.

Restrições de formatação:

- Não use travessão, meia-risca, reticências tipográficas, aspas curvas, setas ou símbolos decorativos. Use dois-pontos, vírgula, parênteses, `...` e aspas retas.
- Siga a sintaxe Markdown do GitHub: um único título de nível 1 por arquivo, hierarquia de títulos sem saltos, listas com `-`, cercas de código com linguagem e texto alternativo em imagens.
- Use links relativos para arquivos do repositório e mantenha o texto do link em uma única linha.
- Use alertas (`> [!NOTE]`, `> [!WARNING]`) com parcimônia, no máximo um ou dois por documento.
- Valide com `npm run format` antes de enviar.

## Decisões de arquitetura

Mudanças estruturais ganham uma nota curta em [docs/adr/](docs/adr/), com estado, contexto, decisão e consequências. Novas notas seguem a numeração sequencial e o formato dos ADRs existentes.

## Testes

Siga [tests/README.md](tests/README.md). Use a massa de teste com `@exemplo.br` e limpe os dados ao final.
