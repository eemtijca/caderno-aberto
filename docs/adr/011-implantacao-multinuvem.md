# ADR-011: implantação em AWS, Azure e GCP com Terraform

- Estado: aceita.
- Data: 2026.

## Contexto

O produto já era publicado na Vercel, com o perfil serverless documentado em [deploy.md](../deploy.md). Surgiu a necessidade de oferecer uma segunda opção de implantação que rode a mesma aplicação em nuvens tradicionais, com infraestrutura declarativa e testável sem custo de nuvem.

## Decisão

Cada nuvem ganhou um módulo raiz de Terraform em `infra/terraform/<nuvem>`, parametrizado por `modo_local`. No modo local os recursos apontam para os emuladores do Floci e usam valores de desenvolvimento; fora dele valem os serviços gerenciados, com criptografia, backups e segredos write-only.

O alvo de computação é ECS Fargate na AWS, App Service no Azure em produção e Container Apps no modo local, e Cloud Run no GCP. O banco é sempre PostgreSQL gerenciado, com a mesma conexão de runtime e de CLI: o caderno não tem papel de runtime separado, então `DATABASE_URL` e `DIRECT_URL` usam o papel dono do schema. As imagens usam S3 na AWS, Blob Storage no Azure, com o driver `azure-blob` adicionado à interface de armazenamento, e GCS com chaves HMAC no GCP.

O ciclo local e de integração contínua usa `infra/floci/compose.floci.yml` e `infra/floci/testar.sh`, que aplicam e destroem cada nuvem no emulador e conferem a sonda `GET /api`.

## Alternativas consideradas

- Provisionar tudo com scripts imperativos de CLI: descartada pela ausência de estado, plano e revisão do que muda.
- Um único módulo genérico entre nuvens: descartada pelas diferenças de rede, segredos e computação, que ficariam cheias de condicionais.
- Manter apenas a Vercel: descartada pela exigência de uma opção auto-hospedada em nuvem tradicional.

## Consequências

- A Vercel continua sendo a opção padrão documentada; a nuvem tradicional é uma alternativa.
- O caminho de produção depende de recursos que o emulador não cobre, como App Service, Key Vault e Artifact Registry, validados por `terraform validate` e não pelo Floci.
- O modo local tem limites registrados em [implantacao-nuvem.md](../implantacao-nuvem.md), como a ausência de ECR, ACR e Artifact Registry e a injeção de segredos no ECS emulado.
- A imagem precisa ser publicada no registro de cada nuvem antes do apply de produção.
- Rotação automática da senha do banco fica como evolução; a troca acontece ao incrementar `versao_segredos`.

Referências: [implantacao-nuvem.md](../implantacao-nuvem.md), [deploy.md](../deploy.md) e [ambiente.md](../ambiente.md).
