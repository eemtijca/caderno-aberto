-- Ciclo de vida da conta (status, motivo), lixeira de notas e links e
-- aprovação em duas etapas (quatro olhos).

-- AlterTable profiles
ALTER TABLE "profiles" ADD COLUMN "status_conta" TEXT NOT NULL DEFAULT 'ativo';
ALTER TABLE "profiles" ADD COLUMN "motivo" TEXT NOT NULL DEFAULT '';
ALTER TABLE "profiles" ADD COLUMN "suspenso_em" TIMESTAMPTZ;
ALTER TABLE "profiles" ADD COLUMN "exclusao_origem" TEXT;

-- AlterTable notas (lixeira)
ALTER TABLE "notas" ADD COLUMN "excluido_em" TIMESTAMPTZ;

-- AlterTable links (lixeira)
ALTER TABLE "links" ADD COLUMN "excluido_em" TIMESTAMPTZ;

-- CreateIndex
CREATE INDEX "notas_professor_excluido_idx" ON "notas"("professor_id", "excluido_em");

-- CreateIndex
CREATE INDEX "links_professor_excluido_idx" ON "links"("professor_id", "excluido_em");

-- CreateTable aprovacoes_acao
CREATE TABLE "aprovacoes_acao" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tipo" TEXT NOT NULL,
    "alvo_id" UUID NOT NULL,
    "alvo_email" TEXT NOT NULL,
    "motivo" TEXT NOT NULL DEFAULT '',
    "solicitado_por" UUID NOT NULL,
    "aprovado_por" UUID,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "expira_em" TIMESTAMPTZ NOT NULL,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "aprovacoes_acao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "aprovacoes_status_idx" ON "aprovacoes_acao"("status", "criado_em" DESC);
