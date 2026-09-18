# ADR-005: ciclo de vida da conta do professor

- Estado: aceita.
- Data: 2026.

## Contexto

O acesso é gerido pela administração por códigos de primeiro acesso. Faltava distinguir "conta nunca ativada" de "conta desativada pela administração" e dar à exclusão pelo admin as mesmas garantias do autoatendimento (aviso, reversibilidade e auditoria). O login respondia de forma genérica, sem informar o estado da conta.

## Decisão

- `profiles.statusConta` passa a registrar `ativo`, `suspenso` ou `excluindo`, com `motivo`, `suspensoEm` e `exclusaoOrigem`.
- O administrador pode **desativar** (reversível, encerra sessões e revoga códigos) ou **excluir** (permanente, com confirmação forte e auditoria). A conta de bootstrap (`ADMIN_EMAIL`) e o último administrador ativo são protegidos.
- O login só revela o estado da conta **depois** de conferir a senha: responde `CONTA_PENDENTE` ou `CONTA_SUSPENSA`, mantendo a não enumeração para terceiros.
- A suspensão e a exclusão exigem a senha do administrador (step-up) e motivo.
- A purga agendada remove contas com carência vencida e nunca administradores.

## Consequências

- O professor suspenso vê uma tela de status com o motivo e a orientação de contato.
- A gestão de contas fica auditável e reversível por padrão.
- Um campo a mais no perfil e respostas de login distintas exigem atualizar a documentação e os testes.

Referências: [modelo-de-dados.md](../modelo-de-dados.md), [api.md](../api.md), [seguranca.md](../seguranca.md).
