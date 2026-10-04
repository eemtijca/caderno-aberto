# Dados derivados e nomes padronizados dos recursos Azure.

resource "random_string" "sufixo" {
  length  = 4
  upper   = false
  special = false
  numeric = true
}

locals {
  nome_base = "${var.nome_aplicacao}-${var.ambiente}"

  nome_container_anexos = "anexos"

  # No modo local o endereço do PostgreSQL costuma ser o gateway do Docker com
  # a porta publicada; o nome devolvido pelo emulador não resolve na bridge.
  endereco_banco_local = var.endereco_banco_local != null ? var.endereco_banco_local : azurerm_postgresql_flexible_server.banco.fqdn

  nome_curto = lower(replace("${var.nome_aplicacao}${var.ambiente}", "-", ""))

  nome_storage = substr("${local.nome_curto}${random_string.sufixo.result}", 0, 24)

  nome_acr = lower(replace("${local.nome_curto}acr", "-", ""))

  nome_kv = substr("${local.nome_base}-kv", 0, 24)

  tags = {
    Aplicacao     = var.nome_aplicacao
    Ambiente      = var.ambiente
    GerenciadoPor = "terraform"
  }

  # No modo local o firewall do emulador não tem efeito prático.
  permitir_rede_publica_banco = var.modo_local ? true : !var.habilitar_rede_privada

  retencao_backup = var.modo_local ? 7 : var.retencao_backup_dias

  # O runtime e o CLI de migrações usam o mesmo papel dono do schema; o
  # caderno não tem papel de runtime separado.
  url_banco_producao = format(
    "postgresql://%s:%s@%s:5432/caderno?sslmode=require",
    "caderno",
    ephemeral.random_password.banco.result,
    azurerm_postgresql_flexible_server.banco.fqdn,
  )

  url_banco_local = format(
    "postgresql://%s:%s@%s/caderno",
    "caderno",
    var.senha_banco_local,
    local.endereco_banco_local,
  )

  # O hostname padrão do App Service segue o nome do recurso, então não é
  # preciso ler o atributo e criar um ciclo com APP_URL.
  url_aplicacao = var.modo_local ? "http://localhost:3000" : (
    var.dominio != null ? "https://${var.dominio}" : "https://${local.nome_base}-api.azurewebsites.net"
  )
}
