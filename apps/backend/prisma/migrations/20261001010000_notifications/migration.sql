-- CreateEnum
CREATE TYPE "TipoNotificacao" AS ENUM ('NOVA_MENSAGEM', 'SOLICITACAO_CRIADA', 'SOLICITACAO_ACEITA', 'SOLICITACAO_RECUSADA', 'SOLICITACAO_CONCLUIDA', 'SOLICITACAO_CANCELADA');

-- CreateTable
CREATE TABLE "Notificacao" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "tipo" "TipoNotificacao" NOT NULL,
    "chaveEvento" VARCHAR(100) NOT NULL,
    "titulo" VARCHAR(100) NOT NULL,
    "descricao" VARCHAR(500) NOT NULL,
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lidaEm" TIMESTAMP(3),
    "contratacaoId" INTEGER,
    "mensagemId" INTEGER,

    CONSTRAINT "Notificacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notificacao_usuarioId_id_idx" ON "Notificacao"("usuarioId", "id");

-- CreateIndex
CREATE INDEX "Notificacao_usuarioId_lidaEm_id_idx" ON "Notificacao"("usuarioId", "lidaEm", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Notificacao_usuarioId_chaveEvento_key" ON "Notificacao"("usuarioId", "chaveEvento");

-- AddForeignKey
ALTER TABLE "Notificacao" ADD CONSTRAINT "Notificacao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("idUsuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacao" ADD CONSTRAINT "Notificacao_contratacaoId_fkey" FOREIGN KEY ("contratacaoId") REFERENCES "Contratacao"("idContratacao") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacao" ADD CONSTRAINT "Notificacao_mensagemId_fkey" FOREIGN KEY ("mensagemId") REFERENCES "Mensagem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

