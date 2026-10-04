# Segredos da aplicação no Secret Manager. Em produção os valores nascem
# efêmeros e só chegam ao cofre; no modo local valem os valores de
# desenvolvimento do tfvars.

ephemeral "random_password" "banco" {
  length  = 32
  special = false
}

ephemeral "random_password" "auth_secret" {
  length  = 48
  special = false
}

ephemeral "random_password" "cron" {
  length  = 48
  special = false
}

resource "google_secret_manager_secret" "database_url" {
  secret_id = "${local.nome_base}-database-url"
  project   = local.projeto

  replication {
    auto {}
  }

  # O emulador não guarda rótulos em segredos, então eles ficam restritos à
  # produção para não gerar drift falso no modo local.
  labels = var.modo_local ? null : local.rotulos
}

resource "google_secret_manager_secret_version" "database_url" {
  secret      = google_secret_manager_secret.database_url.id
  secret_data = var.modo_local ? local.url_banco_local : null

  secret_data_wo         = var.modo_local ? null : local.url_banco_producao
  secret_data_wo_version = var.modo_local ? null : var.versao_segredos
}

resource "google_secret_manager_secret" "direct_url" {
  secret_id = "${local.nome_base}-direct-url"
  project   = local.projeto

  replication {
    auto {}
  }

  labels = var.modo_local ? null : local.rotulos
}

resource "google_secret_manager_secret_version" "direct_url" {
  secret      = google_secret_manager_secret.direct_url.id
  secret_data = var.modo_local ? local.url_banco_local : null

  secret_data_wo         = var.modo_local ? null : local.url_banco_producao
  secret_data_wo_version = var.modo_local ? null : var.versao_segredos
}

resource "google_secret_manager_secret" "auth_secret" {
  secret_id = "${local.nome_base}-auth-secret"
  project   = local.projeto

  replication {
    auto {}
  }

  labels = var.modo_local ? null : local.rotulos
}

resource "google_secret_manager_secret_version" "auth_secret" {
  secret      = google_secret_manager_secret.auth_secret.id
  secret_data = var.modo_local ? var.auth_secret_local : null

  secret_data_wo         = var.modo_local ? null : ephemeral.random_password.auth_secret.result
  secret_data_wo_version = var.modo_local ? null : var.versao_segredos
}

resource "google_secret_manager_secret" "cron" {
  secret_id = "${local.nome_base}-cron-secret"
  project   = local.projeto

  replication {
    auto {}
  }

  labels = var.modo_local ? null : local.rotulos
}

resource "google_secret_manager_secret_version" "cron" {
  secret      = google_secret_manager_secret.cron.id
  secret_data = var.modo_local ? var.cron_secret_local : null

  secret_data_wo         = var.modo_local ? null : ephemeral.random_password.cron.result
  secret_data_wo_version = var.modo_local ? null : var.versao_segredos
}

resource "google_secret_manager_secret" "s3_access_key" {
  count = var.modo_local ? 0 : 1

  secret_id = "${local.nome_base}-s3-access-key"
  project   = local.projeto

  replication {
    auto {}
  }

  labels = var.modo_local ? null : local.rotulos
}

resource "google_secret_manager_secret_version" "s3_access_key" {
  count = var.modo_local ? 0 : 1

  secret                 = google_secret_manager_secret.s3_access_key[0].id
  secret_data_wo         = google_storage_hmac_key.api[0].access_id
  secret_data_wo_version = var.versao_segredos
}

resource "google_secret_manager_secret" "s3_secret_key" {
  count = var.modo_local ? 0 : 1

  secret_id = "${local.nome_base}-s3-secret-key"
  project   = local.projeto

  replication {
    auto {}
  }

  labels = var.modo_local ? null : local.rotulos
}

resource "google_secret_manager_secret_version" "s3_secret_key" {
  count = var.modo_local ? 0 : 1

  secret                 = google_secret_manager_secret.s3_secret_key[0].id
  secret_data_wo         = google_storage_hmac_key.api[0].secret
  secret_data_wo_version = var.versao_segredos
}
