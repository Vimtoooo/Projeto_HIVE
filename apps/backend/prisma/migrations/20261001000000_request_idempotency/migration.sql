ALTER TABLE "Contratacao" ADD COLUMN "chave" UUID;
CREATE UNIQUE INDEX "Contratacao_contratanteId_chave_key" ON "Contratacao"("contratanteId", "chave");
