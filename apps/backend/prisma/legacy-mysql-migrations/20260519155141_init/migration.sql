-- CreateTable
CREATE TABLE `Usuario` (
    `idUsuario` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `senha` VARCHAR(191) NOT NULL,
    `telefone` VARCHAR(191) NOT NULL,
    `cpf` VARCHAR(191) NOT NULL,
    `endereco` VARCHAR(191) NOT NULL,
    `tipoUsuario` ENUM('CONTRATANTE', 'PRESTADOR', 'AMBOS') NOT NULL,
    `dataCadastro` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `statusConta` ENUM('ATIVO', 'INATIVO', 'BLOQUEADO', 'PENDENTE') NOT NULL DEFAULT 'PENDENTE',

    UNIQUE INDEX `Usuario_email_key`(`email`),
    UNIQUE INDEX `Usuario_cpf_key`(`cpf`),
    PRIMARY KEY (`idUsuario`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Prestador` (
    `idPrestador` INTEGER NOT NULL,
    `areaAtuacao` VARCHAR(191) NOT NULL,
    `experiencia` VARCHAR(191) NOT NULL,
    `certificacoes` JSON NOT NULL,
    `avaliacaoMedia` DOUBLE NOT NULL DEFAULT 0.0,
    `cnpj` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Prestador_cnpj_key`(`cnpj`),
    PRIMARY KEY (`idPrestador`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Servico` (
    `idServico` INTEGER NOT NULL AUTO_INCREMENT,
    `titulo` VARCHAR(191) NOT NULL,
    `descricao` TEXT NOT NULL,
    `precoBase` DOUBLE NOT NULL,
    `dataCadastro` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` ENUM('ATIVO', 'INATIVO') NOT NULL DEFAULT 'ATIVO',
    `prestadorId` INTEGER NOT NULL,

    PRIMARY KEY (`idServico`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Contratacao` (
    `idContratacao` INTEGER NOT NULL AUTO_INCREMENT,
    `dataContratacao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` ENUM('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA') NOT NULL DEFAULT 'PENDENTE',
    `valor` DOUBLE NOT NULL,
    `formaPagamento` ENUM('CARTAO', 'PIX', 'BOLETO', 'DINHEIRO', 'TRANSFERENCIA') NOT NULL,
    `dataVencimento` DATETIME(3) NULL,
    `indicacaoId` VARCHAR(191) NULL,
    `servicoId` INTEGER NOT NULL,
    `contratanteId` INTEGER NOT NULL,

    PRIMARY KEY (`idContratacao`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Indicacao` (
    `idIndicacao` VARCHAR(191) NOT NULL,
    `meioIndicado` ENUM('APLICATIVO', 'WHATSAPP', 'EMAIL', 'TELEFONE', 'REDES_SOCIAIS', 'OUTRO') NOT NULL,
    `dataIndicacao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `statusIndicado` ENUM('PENDENTE', 'ACEITA', 'RECUSADA', 'EXPIRADA') NOT NULL DEFAULT 'PENDENTE',
    `observacao` TEXT NOT NULL,
    `indicadorId` INTEGER NOT NULL,
    `indicadoId` INTEGER NOT NULL,

    PRIMARY KEY (`idIndicacao`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Avaliacao` (
    `idAvaliacao` INTEGER NOT NULL AUTO_INCREMENT,
    `nota` DOUBLE NOT NULL,
    `comentario` TEXT NULL,
    `dataAvaliacao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `contratacaoId` INTEGER NOT NULL,

    UNIQUE INDEX `Avaliacao_contratacaoId_key`(`contratacaoId`),
    PRIMARY KEY (`idAvaliacao`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Fatura` (
    `idFatura` INTEGER NOT NULL AUTO_INCREMENT,
    `dataEmissao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `valorTotal` DOUBLE NOT NULL,
    `statusPagamento` ENUM('PENDENTE', 'PAGO', 'PARCIALMENTE_PAGO', 'CANCELADO', 'ESTORNADO') NOT NULL DEFAULT 'PENDENTE',
    `dataPagamento` DATETIME(3) NULL,
    `usuarioId` INTEGER NOT NULL,
    `contratacaoId` INTEGER NOT NULL,

    UNIQUE INDEX `Fatura_contratacaoId_key`(`contratacaoId`),
    PRIMARY KEY (`idFatura`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Financeiro` (
    `idFinanceiro` INTEGER NOT NULL AUTO_INCREMENT,
    `tipoRegistro` ENUM('RECEITA', 'DESPESA') NOT NULL,
    `valor` DOUBLE NOT NULL,
    `descricao` TEXT NULL,
    `dataRegistro` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `faturaId` INTEGER NULL,
    `contratacaoId` INTEGER NOT NULL,

    PRIMARY KEY (`idFinanceiro`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Prestador` ADD CONSTRAINT `Prestador_idPrestador_fkey` FOREIGN KEY (`idPrestador`) REFERENCES `Usuario`(`idUsuario`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Servico` ADD CONSTRAINT `Servico_prestadorId_fkey` FOREIGN KEY (`prestadorId`) REFERENCES `Prestador`(`idPrestador`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Contratacao` ADD CONSTRAINT `Contratacao_indicacaoId_fkey` FOREIGN KEY (`indicacaoId`) REFERENCES `Indicacao`(`idIndicacao`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Contratacao` ADD CONSTRAINT `Contratacao_servicoId_fkey` FOREIGN KEY (`servicoId`) REFERENCES `Servico`(`idServico`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Contratacao` ADD CONSTRAINT `Contratacao_contratanteId_fkey` FOREIGN KEY (`contratanteId`) REFERENCES `Usuario`(`idUsuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Indicacao` ADD CONSTRAINT `Indicacao_indicadorId_fkey` FOREIGN KEY (`indicadorId`) REFERENCES `Usuario`(`idUsuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Indicacao` ADD CONSTRAINT `Indicacao_indicadoId_fkey` FOREIGN KEY (`indicadoId`) REFERENCES `Usuario`(`idUsuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Avaliacao` ADD CONSTRAINT `Avaliacao_contratacaoId_fkey` FOREIGN KEY (`contratacaoId`) REFERENCES `Contratacao`(`idContratacao`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Fatura` ADD CONSTRAINT `Fatura_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`idUsuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Fatura` ADD CONSTRAINT `Fatura_contratacaoId_fkey` FOREIGN KEY (`contratacaoId`) REFERENCES `Contratacao`(`idContratacao`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Financeiro` ADD CONSTRAINT `Financeiro_faturaId_fkey` FOREIGN KEY (`faturaId`) REFERENCES `Fatura`(`idFatura`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Financeiro` ADD CONSTRAINT `Financeiro_contratacaoId_fkey` FOREIGN KEY (`contratacaoId`) REFERENCES `Contratacao`(`idContratacao`) ON DELETE RESTRICT ON UPDATE CASCADE;
