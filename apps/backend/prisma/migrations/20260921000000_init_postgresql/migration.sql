-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "FormaPagamento" AS ENUM ('CARTAO', 'PIX', 'BOLETO', 'DINHEIRO', 'TRANSFERENCIA');

-- CreateEnum
CREATE TYPE "MeioIndicado" AS ENUM ('APLICATIVO', 'WHATSAPP', 'EMAIL', 'TELEFONE', 'REDES_SOCIAIS', 'OUTRO');

-- CreateEnum
CREATE TYPE "StatusConta" AS ENUM ('ATIVO', 'INATIVO', 'BLOQUEADO', 'PENDENTE');

-- CreateEnum
CREATE TYPE "StatusContratacao" AS ENUM ('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "StatusIndicado" AS ENUM ('PENDENTE', 'ACEITA', 'RECUSADA', 'EXPIRADA');

-- CreateEnum
CREATE TYPE "StatusPagamento" AS ENUM ('PENDENTE', 'PAGO', 'PARCIALMENTE_PAGO', 'CANCELADO', 'ESTORNADO');

-- CreateEnum
CREATE TYPE "StatusServico" AS ENUM ('ATIVO', 'INATIVO');

-- CreateEnum
CREATE TYPE "TipoRegistro" AS ENUM ('RECEITA', 'DESPESA');

-- CreateEnum
CREATE TYPE "TipoUsuario" AS ENUM ('CONTRATANTE', 'PRESTADOR', 'AMBOS');

-- CreateTable
CREATE TABLE "Usuario" (
    "idUsuario" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,
    "tipoUsuario" "TipoUsuario" NOT NULL,
    "dataCadastro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statusConta" "StatusConta" NOT NULL DEFAULT 'PENDENTE',

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("idUsuario")
);

-- CreateTable
CREATE TABLE "Prestador" (
    "idPrestador" INTEGER NOT NULL,
    "areaAtuacao" TEXT NOT NULL,
    "experiencia" TEXT NOT NULL,
    "certificacoes" TEXT[],
    "avaliacaoMedia" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "cnpj" TEXT NOT NULL,

    CONSTRAINT "Prestador_pkey" PRIMARY KEY ("idPrestador")
);

-- CreateTable
CREATE TABLE "Servico" (
    "idServico" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "precoBase" DOUBLE PRECISION NOT NULL,
    "dataCadastro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "StatusServico" NOT NULL DEFAULT 'ATIVO',
    "prestadorId" INTEGER NOT NULL,

    CONSTRAINT "Servico_pkey" PRIMARY KEY ("idServico")
);

-- CreateTable
CREATE TABLE "Contratacao" (
    "idContratacao" SERIAL NOT NULL,
    "dataContratacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "StatusContratacao" NOT NULL DEFAULT 'PENDENTE',
    "valor" DOUBLE PRECISION NOT NULL,
    "formaPagamento" "FormaPagamento" NOT NULL,
    "dataVencimento" TIMESTAMP(3),
    "indicacaoId" INTEGER,
    "servicoId" INTEGER NOT NULL,
    "contratanteId" INTEGER NOT NULL,

    CONSTRAINT "Contratacao_pkey" PRIMARY KEY ("idContratacao")
);

-- CreateTable
CREATE TABLE "Indicacao" (
    "idIndicacao" SERIAL NOT NULL,
    "meioIndicacao" "MeioIndicado" NOT NULL,
    "dataIndicacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statusIndicacao" "StatusIndicado" NOT NULL DEFAULT 'PENDENTE',
    "observacao" TEXT NOT NULL,
    "indicadorId" INTEGER NOT NULL,
    "indicadoId" INTEGER NOT NULL,

    CONSTRAINT "Indicacao_pkey" PRIMARY KEY ("idIndicacao")
);

-- CreateTable
CREATE TABLE "Avaliacao" (
    "idAvaliacao" SERIAL NOT NULL,
    "nota" DOUBLE PRECISION NOT NULL,
    "comentario" TEXT,
    "dataAvaliacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contratacaoId" INTEGER NOT NULL,

    CONSTRAINT "Avaliacao_pkey" PRIMARY KEY ("idAvaliacao")
);

-- CreateTable
CREATE TABLE "Fatura" (
    "idFatura" SERIAL NOT NULL,
    "dataEmissao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valorTotal" DOUBLE PRECISION NOT NULL,
    "statusPagamento" "StatusPagamento" NOT NULL DEFAULT 'PENDENTE',
    "dataPagamento" TIMESTAMP(3),
    "usuarioId" INTEGER NOT NULL,
    "contratacaoId" INTEGER NOT NULL,

    CONSTRAINT "Fatura_pkey" PRIMARY KEY ("idFatura")
);

-- CreateTable
CREATE TABLE "Financeiro" (
    "idFinanceiro" SERIAL NOT NULL,
    "tipoRegistro" "TipoRegistro" NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "descricao" TEXT,
    "dataRegistro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "faturaId" INTEGER,
    "contratacaoId" INTEGER NOT NULL,

    CONSTRAINT "Financeiro_pkey" PRIMARY KEY ("idFinanceiro")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_cpf_key" ON "Usuario"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "Prestador_cnpj_key" ON "Prestador"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "Avaliacao_contratacaoId_key" ON "Avaliacao"("contratacaoId");

-- CreateIndex
CREATE UNIQUE INDEX "Fatura_contratacaoId_key" ON "Fatura"("contratacaoId");

-- AddForeignKey
ALTER TABLE "Prestador" ADD CONSTRAINT "Prestador_idPrestador_fkey" FOREIGN KEY ("idPrestador") REFERENCES "Usuario"("idUsuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Servico" ADD CONSTRAINT "Servico_prestadorId_fkey" FOREIGN KEY ("prestadorId") REFERENCES "Prestador"("idPrestador") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contratacao" ADD CONSTRAINT "Contratacao_indicacaoId_fkey" FOREIGN KEY ("indicacaoId") REFERENCES "Indicacao"("idIndicacao") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contratacao" ADD CONSTRAINT "Contratacao_servicoId_fkey" FOREIGN KEY ("servicoId") REFERENCES "Servico"("idServico") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contratacao" ADD CONSTRAINT "Contratacao_contratanteId_fkey" FOREIGN KEY ("contratanteId") REFERENCES "Usuario"("idUsuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Indicacao" ADD CONSTRAINT "Indicacao_indicadorId_fkey" FOREIGN KEY ("indicadorId") REFERENCES "Usuario"("idUsuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Indicacao" ADD CONSTRAINT "Indicacao_indicadoId_fkey" FOREIGN KEY ("indicadoId") REFERENCES "Prestador"("idPrestador") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Avaliacao" ADD CONSTRAINT "Avaliacao_contratacaoId_fkey" FOREIGN KEY ("contratacaoId") REFERENCES "Contratacao"("idContratacao") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fatura" ADD CONSTRAINT "Fatura_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("idUsuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fatura" ADD CONSTRAINT "Fatura_contratacaoId_fkey" FOREIGN KEY ("contratacaoId") REFERENCES "Contratacao"("idContratacao") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Financeiro" ADD CONSTRAINT "Financeiro_faturaId_fkey" FOREIGN KEY ("faturaId") REFERENCES "Fatura"("idFatura") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Financeiro" ADD CONSTRAINT "Financeiro_contratacaoId_fkey" FOREIGN KEY ("contratacaoId") REFERENCES "Contratacao"("idContratacao") ON DELETE RESTRICT ON UPDATE CASCADE;
