# Implantação em nuvem

O projeto pode ser implantado na AWS, no Azure ou no GCP com Terraform, além da Vercel. Cada nuvem tem um módulo raiz independente em `infra/terraform/<nuvem>`, com dois modos:

- `modo_local = true`: usa os emuladores do Floci, recursos mínimos e as imagens locais. Serve para testar o Terraform e a aplicação sem conta em nuvem.
- `modo_local = false`: caminho de produção, com serviços gerenciados, criptografia, backups, identificadores e segredos write-only.

O [ADR-011](adr/011-implantacao-multinuvem.md) registra a decisão.

## Arquitetura por nuvem

| Camada              | AWS                                   | Azure                                                | GCP                           |
| ------------------- | ------------------------------------- | ---------------------------------------------------- | ----------------------------- |
| Computação          | ECS Fargate atrás de ALB              | App Service (produção) e Container Apps (modo local) | Cloud Run v2                  |
| Banco               | RDS PostgreSQL 17                     | PostgreSQL Flexible Server                           | Cloud SQL PostgreSQL          |
| Anexos              | S3 privado                            | Blob Storage privado com o driver `azure-blob`       | GCS privado com chaves HMAC   |
| Segredos            | Secrets Manager                       | Key Vault                                            | Secret Manager                |
| Registro de imagens | ECR                                   | Azure Container Registry                             | Artifact Registry             |
| Observabilidade     | CloudWatch Logs e alarmes             | Log Analytics e alertas                              | Cloud Logging e alerta de 5xx |
| Rede                | VPC com sub-redes públicas e privadas | VNet com sub-redes delegadas                         | VPC com Cloud SQL privado     |

A aplicação não usa Redis: a purga agendada é disparada por cron e o restante do estado vive no PostgreSQL.

## Pré-requisitos

- Terraform 1.11 ou superior.
- Docker com Compose.
- Floci CLI e emuladores (`floci`, `floci-az` e `floci-gcp`).
- AWS CLI, Azure CLI e gcloud apenas para inspeção manual; os scripts usam `curl` e o próprio Terraform.
- Node 24 para construir a imagem da aplicação.

## Estrutura

```text
infra/
  floci/
    compose.floci.yml   # emuladores usados nos testes locais e no CI
    testar.sh           # ciclo completo por nuvem
  terraform/
    validar.sh          # init sem backend e validate nas três nuvens
    aws/
    azure/
    gcp/
```

Cada módulo tem `versions.tf`, `providers.tf`, `variables.tf`, `locals.tf`, os recursos separados por assunto, `outputs.tf` e os exemplos `terraform.tfvars.example`, `terraform.tfvars.local.example` e, na AWS, `backend.hcl.example`. Os arquivos `.tfvars` reais não são versionados.

## Comandos

```bash
npm run infra:fmt        # formata todos os módulos
npm run infra:validar    # init sem backend e validate nas três nuvens
npm run infra:floci      # aplica e destrói nas três nuvens pelo Floci
npm run infra:floci:aws  # apenas AWS
npm run infra:floci:azure
npm run infra:floci:gcp
```

O script `infra/floci/testar.sh` constrói a imagem `caderno-aberto:local` quando necessário, sobe os emuladores quando as portas padrão não respondem, aplica o Terraform, confere a sonda `GET /api` e destrói os recursos. Use `MANTER=true` para preservar o ambiente após o teste.

## Modo de produção

1. Publique a imagem no registro da nuvem e informe `imagem_aplicacao`.
2. Copie `terraform.tfvars.example` para `terraform.tfvars` e ajuste os valores. Na AWS, informe também `certificado_arn`; o balanceador só encaminha HTTP na ausência do certificado no modo local.
3. Configure o backend remoto. Na AWS há um exemplo em `backend.hcl.example` com bucket versionado, criptografia e lockfile; no Azure e no GCP use o backend nativo correspondente.
4. Rode `terraform init` e `terraform plan` e revise o plano antes de aplicar. O repositório não aplica em produção por conta própria.

As senhas do banco, o `AUTH_SECRET` e o `CRON_SECRET` nascem de valores efêmeros e chegam aos cofres por argumentos write-only, sem registro no state. O caminho de produção de cada nuvem foi validado por `terraform validate`; os testes automatizados cobrem o modo local.

## Migrações

O entrypoint do contêiner aguarda o banco, aplica as migrações com `node ./docker/app/migrar.mjs` e só então sobe o servidor. O migrador usa `DIRECT_URL` e cai para `DATABASE_URL` quando ela não existe; nos módulos de nuvem as duas apontam para o mesmo banco e o mesmo papel dono do schema, porque o caderno não tem papel de runtime separado. Em mais de uma réplica as migrações podem competir; o primeiro deploy deve acontecer com uma réplica antes de escalar.

## Limites do modo local

- A AWS não cria ECR, o Azure não cria ACR e o GCP não cria Artifact Registry no modo local, porque o emulador mantém o registro de apoio inalcançável após a primeira operação e a exclusão do recurso não conclui.
- O ECS emulado não injeta segredos do Secrets Manager; no modo local as variáveis vão no ambiente da tarefa, com valores de desenvolvimento.
- O Key Vault e o Log Analytics ficam restritos à produção no Azure: o emulador não responde ao data plane de certificados nem à listagem de workspaces excluídos.
- O Container Apps emulado exige `FLOCI_AZ_SERVICES_CONTAINER_APPS_MOCKED=false` e TLS, configuração já presente em `compose.floci.yml`, e o script renova o sufixo de revisão a cada execução para forçar uma revisão nova.
- O ingress do floci-az tenta o upgrade h2c e o servidor Node do Next fecha a conexão; o Container App local roda um sidecar nginx que responde em HTTP/1.1 e repassa para o Next na porta interna. Em produção o App Service fala HTTP/1.1 direto, sem o sidecar.
- O floci-gcp tem a mesma limitação de h2c no ingress e não implementa sidecars, então a sonda do GCP usa a porta do runtime do Cloud Run emulado; o serviço e a URL gerada continuam sendo validados pelo Terraform.
- O contêiner de anexos do Blob é criado pelo script de teste no modo local, porque a exclusão no emulador não tem efeito.
- No modo local das três nuvens a aplicação usa `STORAGE_DRIVER=disk`; o bucket ou a conta de armazenamento é criado pelo Terraform apenas para validar a infraestrutura. No GCP o bucket é criado e a chave HMAC fica restrita à produção.
- O PostgreSQL do emulador do Azure não cria o banco no motor; o script o cria com `createdb` antes do segundo apply.

## Segurança

- Nenhum segredo é versionado em `tfvars`; os valores de produção são gerados pelo Terraform e gravados em cofres por argumentos write-only.
- O bucket de imagens não aceita acesso público; a leitura continua passando pela aplicação.
- Na AWS o acesso ao S3 usa o papel da tarefa, sem chaves de longa duração; no Azure vale a identidade gerenciada e, no GCP, as chaves HMAC ficam no Secret Manager.
- As tarefas e o banco ficam em sub-redes privadas, com grupos de segurança encadeados e sem portas de banco expostas.
- O domínio próprio é opcional. Sem ele, o TLS usa os endpoints gerenciados de cada plataforma.
