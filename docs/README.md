# Documentação

Índice dos documentos do Caderno Aberto. O [README raiz](../README.md) apresenta o produto e o guia rápido; este diretório concentra a documentação técnica e operacional.

## Por objetivo

| Objetivo                              | Documento                                                         |
| ------------------------------------- | ----------------------------------------------------------------- |
| Entender a proposta e rodar o projeto | [README raiz](../README.md)                                       |
| Executar localmente e configurar      | [ambiente.md](ambiente.md)                                        |
| Entender o código e as camadas        | [arquitetura.md](arquitetura.md)                                  |
| Trabalhar com o banco e migrações     | [banco.md](banco.md)                                              |
| Consultar as rotas HTTP               | [api.md](api.md)                                                  |
| Conhecer entidades e vocabulário      | [modelo-de-dados.md](modelo-de-dados.md)                          |
| Editar notas e blocos                 | [editor.md](editor.md)                                            |
| Manter a interface e o design system  | [interface.md](interface.md)                                      |
| Operar, restaurar e resolver falhas   | [operacao.md](operacao.md)                                        |
| Rodar e escrever testes               | [testes.md](testes.md) e [../tests/README.md](../tests/README.md) |
| Revisar segurança                     | [seguranca.md](seguranca.md) e [../SECURITY.md](../SECURITY.md)   |
| Publicar                              | [deploy.md](deploy.md)                                            |
| Contribuir                            | [../CONTRIBUTING.md](../CONTRIBUTING.md)                          |

## Decisões de arquitetura

As decisões estruturais ficam registradas como ADRs (Architecture Decision Records):

- [ADR-001: Prisma Client v7](adr/001-prisma-v7.md)
- [ADR-002: provedores agnósticos de e-mail e imagens](adr/002-provedores-agnosticos.md)
- [ADR-003: isolamento pelo dono com RLS de barreira](adr/003-isolamento.md)
- [ADR-004: acesso por código gerido pela administração](adr/004-acesso-por-codigo.md)

Novas decisões seguem o formato descrito em [../CONTRIBUTING.md](../CONTRIBUTING.md).

## Convenção editorial

Toda a documentação é escrita em português brasileiro, com tom técnico e impessoal. Não são usados travessões, reticências tipográficas, aspas curvas ou símbolos decorativos. Os documentos seguem a sintaxe Markdown do GitHub, com um único título de nível 1 por arquivo, links relativos para arquivos do repositório e alertas (`> [!NOTE]`, `> [!WARNING]`) usados com parcimônia.
