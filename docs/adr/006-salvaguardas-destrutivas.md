# ADR-006: salvaguardas contra ações destrutivas

- Estado: aceita.
- Data: 2026.

## Contexto

Diversas ações apagavam dados de forma definitiva e imediata: excluir nota, link, disciplina, turma, restaurar um backup substitutivo e excluir contas. A restauração de backup não tinha confirmação, a exclusão de link no diálogo de compartilhamento não pedia confirmação e a purga agendada era destrutiva por padrão.

## Decisão

Adotar defesa em profundidade, proporcional ao dano:

- **Lixeira**: notas e links ganham `excluidoEm`; as consultas filtram itens excluídos e a purga remove após `LIXEIRA_DIAS` (padrão 30). A interface oferece restaurar e desfazer por toast.
- **Confirmação proporcional** (`ConfirmacaoDestrutiva`): digitação do alvo, motivo e senha conforme o nível de risco.
- **Backup blindado**: `POST /api/backup/validar` faz dry-run com resumo do impacto; a restauração exige digitar `SUBSTITUIR`, baixa o backup atual e grava um snapshot para rollback em `GET /api/backup/snapshots`.
- **Guardrails de admin**: motivo e senha obrigatórios, proteção do último administrador e do bootstrap, auditoria de cada ação.
- **Quatro olhos** opcional (`APROVACAO_DUPLA=1`): uma ação destrutiva vira solicitação que outro administrador aprova na aba Aprovações.
- **Purga segura**: `?confirmar=1` para executar; sem ele, apenas pré-visualiza. O dump lógico antes de migrar é opcional (`BACKUP_BEFORE_MIGRATE=1`).

## Consequências

- A exclusão de notas e links passa a ocupar espaço até a purga e exige filtrar `excluidoEm` em todas as consultas.
- Disciplinas e turmas seguem com exclusão real, porque o índice único por nome impediria recriar o mesmo nome com um registro na lixeira.
- Ações críticas ganham fricção intencional e rastro de auditoria.

Referências: [modelo-de-dados.md](../modelo-de-dados.md), [operacao.md](../operacao.md), [seguranca.md](../seguranca.md).
