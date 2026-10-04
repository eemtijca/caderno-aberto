# Service account dedicada, serviço Cloud Run v2 e as ligações de IAM de
# produção. No modo local o serviço roda sem VPC e recebe variáveis de ambiente
# simples; em produção usa rede privada, segredos do Secret Manager, chaves
# HMAC do bucket e imagem do Artifact Registry.

resource "google_service_account" "api" {
  account_id   = substr("${local.nome_base}-api", 0, 30)
  display_name = "Aplicação do ${var.nome_aplicacao}"
  project      = local.projeto
}

resource "google_cloud_run_v2_service" "api" {
  name                = local.nome_base
  project             = local.projeto
  location            = var.regiao
  ingress             = "INGRESS_TRAFFIC_ALL"
  deletion_protection = var.modo_local ? false : true

  template {
    service_account = google_service_account.api.email

    dynamic "scaling" {
      for_each = var.modo_local ? [] : [1]

      content {
        min_instance_count = var.min_instancias
        max_instance_count = var.max_instancias
      }
    }

    dynamic "vpc_access" {
      for_each = local.rede_privada ? [1] : []

      content {
        egress = "PRIVATE_RANGES_ONLY"

        network_interfaces {
          network    = google_compute_network.principal[0].id
          subnetwork = google_compute_subnetwork.app[0].id
        }
      }
    }

    containers {
      image = var.imagem_aplicacao

      ports {
        container_port = 3000
      }

      resources {
        limits = {
          cpu    = var.cpu_servico
          memory = var.memoria_servico
        }
      }

      env {
        name  = "NODE_ENV"
        value = "production"
      }

      env {
        name  = "PORT"
        value = "3000"
      }

      env {
        name  = "HOST"
        value = "0.0.0.0"
      }

      # O Next standalone escuta no HOSTNAME; fixar em 0.0.0.0 garante a
      # interface do contêiner para o Cloud Run.
      env {
        name  = "HOSTNAME"
        value = "0.0.0.0"
      }

      env {
        name  = "APP_URL"
        value = local.url_aplicacao
      }

      env {
        name  = "UPLOAD_DIR"
        value = "/data/imagens"
      }

      env {
        name  = "STORAGE_DRIVER"
        value = var.modo_local ? "disk" : "s3"
      }

      # No modo local valem os valores de desenvolvimento; em produção os
      # mesmos nomes apontam para versões do Secret Manager.
      env {
        name  = "DATABASE_URL"
        value = var.modo_local ? local.url_banco_local : null

        dynamic "value_source" {
          for_each = var.modo_local ? [] : [1]

          content {
            secret_key_ref {
              secret  = google_secret_manager_secret.database_url.id
              version = "latest"
            }
          }
        }
      }

      env {
        name  = "DIRECT_URL"
        value = var.modo_local ? local.url_banco_local : null

        dynamic "value_source" {
          for_each = var.modo_local ? [] : [1]

          content {
            secret_key_ref {
              secret  = google_secret_manager_secret.direct_url.id
              version = "latest"
            }
          }
        }
      }

      env {
        name  = "AUTH_SECRET"
        value = var.modo_local ? var.auth_secret_local : null

        dynamic "value_source" {
          for_each = var.modo_local ? [] : [1]

          content {
            secret_key_ref {
              secret  = google_secret_manager_secret.auth_secret.id
              version = "latest"
            }
          }
        }
      }

      env {
        name  = "CRON_SECRET"
        value = var.modo_local ? var.cron_secret_local : null

        dynamic "value_source" {
          for_each = var.modo_local ? [] : [1]

          content {
            secret_key_ref {
              secret  = google_secret_manager_secret.cron.id
              version = "latest"
            }
          }
        }
      }

      dynamic "env" {
        for_each = var.modo_local ? [] : [1]

        content {
          name  = "STORAGE_S3_BUCKET"
          value = google_storage_bucket.anexos.name
        }
      }

      dynamic "env" {
        for_each = var.modo_local ? [] : [1]

        content {
          name  = "STORAGE_S3_REGION"
          value = "auto"
        }
      }

      dynamic "env" {
        for_each = var.modo_local ? [] : [1]

        content {
          name  = "STORAGE_S3_ENDPOINT"
          value = "https://storage.googleapis.com"
        }
      }

      dynamic "env" {
        for_each = var.modo_local ? [] : [1]

        content {
          name = "STORAGE_S3_ACCESS_KEY"

          value_source {
            secret_key_ref {
              secret  = google_secret_manager_secret.s3_access_key[0].id
              version = "latest"
            }
          }
        }
      }

      dynamic "env" {
        for_each = var.modo_local ? [] : [1]

        content {
          name = "STORAGE_S3_SECRET_KEY"

          value_source {
            secret_key_ref {
              secret  = google_secret_manager_secret.s3_secret_key[0].id
              version = "latest"
            }
          }
        }
      }
    }
  }
}

resource "google_secret_manager_secret_iam_member" "api" {
  for_each = var.modo_local ? toset([]) : toset(concat(
    [
      google_secret_manager_secret.database_url.secret_id,
      google_secret_manager_secret.direct_url.secret_id,
      google_secret_manager_secret.auth_secret.secret_id,
      google_secret_manager_secret.cron.secret_id,
      google_secret_manager_secret.s3_access_key[0].secret_id,
      google_secret_manager_secret.s3_secret_key[0].secret_id,
    ],
  ))

  project   = local.projeto
  secret_id = each.value
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.api.email}"
}

resource "google_artifact_registry_repository_iam_member" "api" {
  count = var.modo_local ? 0 : 1

  project    = local.projeto
  location   = var.regiao
  repository = google_artifact_registry_repository.api[0].name
  role       = "roles/artifactregistry.reader"
  member     = "serviceAccount:${google_service_account.api.email}"
}
