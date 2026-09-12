# ADR-003: isolamento pelo dono com RLS de barreira

- Estado: aceita.
- Contexto: multiusuário exige que nenhum professor alcance dados
  alheios, mesmo com falha de código.
- Decisão: cada consulta filtra `professorId`/`usuario.id`; políticas
  RLS por `app.usuario_atual` como segunda barreira, provadas com o
  papel sem privilégios `app_teste`.
- Consequências: duas camadas independentes; suítes de isolamento e
  contratos travam regressões.
