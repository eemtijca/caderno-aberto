# ADR-003: isolamento pelo dono com RLS de barreira

- Estado: aceita.
- Data: 2026.

## Contexto

O sistema é multiusuário. Nenhum professor pode alcançar dados de outro, mesmo diante de falha de código. Uma única camada de filtro é frágil: um `where` esquecido expõe dados.

## Decisão

Aplicar duas camadas independentes:

1. Filtro explícito por `professorId` ou `usuario.id` em cada consulta da API.
2. Políticas RLS por `app.usuario_atual` como segunda barreira, provadas com o papel sem privilégios `app_teste`.

## Alternativas consideradas

- Apenas filtro na API: descartada pela ausência de barreira contra erros de código.
- Apenas RLS: descartada porque a aplicação conecta com o dono do schema e a RLS não isolaria o runtime por si só.

## Consequências

- Duas camadas independentes de proteção.
- As suítes de isolamento e de contratos travam regressões.
- A RLS é exercitada nos testes com `SET ROLE app_teste`; em produção permanece como backstop documentado.

Referências: [banco.md](../banco.md), [seguranca.md](../seguranca.md) e [arquitetura.md](../arquitetura.md).
