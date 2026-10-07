-- CreateTable
CREATE TABLE "Sessao" (
    "tokenHash" TEXT NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "expiraEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sessao_pkey" PRIMARY KEY ("tokenHash")
);

-- CreateTable
CREATE TABLE "Conversa" (
    "id" SERIAL NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "prestadorId" INTEGER NOT NULL,
    "atualizadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conversa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mensagem" (
    "id" SERIAL NOT NULL,
    "conversaId" INTEGER NOT NULL,
    "remetenteId" INTEGER NOT NULL,
    "conteudo" VARCHAR(2000) NOT NULL,
    "enviadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "chave" UUID NOT NULL,

    CONSTRAINT "Mensagem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Sessao_usuarioId_idx" ON "Sessao"("usuarioId");

-- CreateIndex
CREATE INDEX "Sessao_expiraEm_idx" ON "Sessao"("expiraEm");

-- CreateIndex
CREATE INDEX "Conversa_prestadorId_atualizadaEm_idx" ON "Conversa"("prestadorId", "atualizadaEm");

-- CreateIndex
CREATE INDEX "Conversa_clienteId_atualizadaEm_idx" ON "Conversa"("clienteId", "atualizadaEm");

-- CreateIndex
CREATE UNIQUE INDEX "Conversa_clienteId_prestadorId_key" ON "Conversa"("clienteId", "prestadorId");

-- CreateIndex
CREATE INDEX "Mensagem_conversaId_id_idx" ON "Mensagem"("conversaId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Mensagem_conversaId_remetenteId_chave_key" ON "Mensagem"("conversaId", "remetenteId", "chave");

-- AddForeignKey
ALTER TABLE "Sessao" ADD CONSTRAINT "Sessao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("idUsuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversa" ADD CONSTRAINT "Conversa_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Usuario"("idUsuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversa" ADD CONSTRAINT "Conversa_prestadorId_fkey" FOREIGN KEY ("prestadorId") REFERENCES "Usuario"("idUsuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mensagem" ADD CONSTRAINT "Mensagem_conversaId_fkey" FOREIGN KEY ("conversaId") REFERENCES "Conversa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mensagem" ADD CONSTRAINT "Mensagem_remetenteId_fkey" FOREIGN KEY ("remetenteId") REFERENCES "Usuario"("idUsuario") ON DELETE CASCADE ON UPDATE CASCADE;
