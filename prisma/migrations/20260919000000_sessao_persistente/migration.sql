-- Sessão persistente: distingue o cookie de refresh entre persistente (30 dias)
-- e cookie de sessão (expira ao fechar o navegador).

ALTER TABLE "sessoes" ADD COLUMN "persistente" BOOLEAN NOT NULL DEFAULT true;
