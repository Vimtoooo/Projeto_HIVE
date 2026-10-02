-- Additive: existing users, providers, requests and messages are preserved.
CREATE TABLE "Favorito" (
    "usuarioId" INTEGER NOT NULL,
    "prestadorId" INTEGER NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Favorito_pkey" PRIMARY KEY ("usuarioId", "prestadorId")
);
CREATE INDEX "Favorito_prestadorId_idx" ON "Favorito"("prestadorId");
ALTER TABLE "Favorito" ADD CONSTRAINT "Favorito_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("idUsuario") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Favorito" ADD CONSTRAINT "Favorito_prestadorId_fkey" FOREIGN KEY ("prestadorId") REFERENCES "Prestador"("idPrestador") ON DELETE CASCADE ON UPDATE CASCADE;
