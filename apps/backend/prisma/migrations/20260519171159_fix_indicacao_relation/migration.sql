/*
  Warnings:

  - You are about to alter the column `indicacaoId` on the `contratacao` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - The primary key for the `indicacao` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `meioIndicado` on the `indicacao` table. All the data in the column will be lost.
  - You are about to drop the column `statusIndicado` on the `indicacao` table. All the data in the column will be lost.
  - You are about to alter the column `idIndicacao` on the `indicacao` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - Added the required column `meioIndicacao` to the `Indicacao` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `contratacao` DROP FOREIGN KEY `Contratacao_indicacaoId_fkey`;

-- DropForeignKey
ALTER TABLE `indicacao` DROP FOREIGN KEY `Indicacao_indicadoId_fkey`;

-- DropIndex
DROP INDEX `Contratacao_indicacaoId_fkey` ON `contratacao`;

-- DropIndex
DROP INDEX `Indicacao_indicadoId_fkey` ON `indicacao`;

-- AlterTable
ALTER TABLE `contratacao` MODIFY `indicacaoId` INTEGER NULL;

-- AlterTable
ALTER TABLE `indicacao` DROP PRIMARY KEY,
    DROP COLUMN `meioIndicado`,
    DROP COLUMN `statusIndicado`,
    ADD COLUMN `meioIndicacao` ENUM('APLICATIVO', 'WHATSAPP', 'EMAIL', 'TELEFONE', 'REDES_SOCIAIS', 'OUTRO') NOT NULL,
    ADD COLUMN `statusIndicacao` ENUM('PENDENTE', 'ACEITA', 'RECUSADA', 'EXPIRADA') NOT NULL DEFAULT 'PENDENTE',
    MODIFY `idIndicacao` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`idIndicacao`);

-- AddForeignKey
ALTER TABLE `Contratacao` ADD CONSTRAINT `Contratacao_indicacaoId_fkey` FOREIGN KEY (`indicacaoId`) REFERENCES `Indicacao`(`idIndicacao`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Indicacao` ADD CONSTRAINT `Indicacao_indicadoId_fkey` FOREIGN KEY (`indicadoId`) REFERENCES `Prestador`(`idPrestador`) ON DELETE RESTRICT ON UPDATE CASCADE;
