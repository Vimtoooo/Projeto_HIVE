import { PrismaClient } from '@prisma/client';

/** Remove somente os registros associados aos emails exatos desta execução. */
export async function limparDados(
  prisma: PrismaClient,
  emails: string[],
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const usuarios = { email: { in: emails } };
    const contratos = { contratante: usuarios };
    await tx.financeiro.deleteMany({ where: { contratacao: contratos } });
    await tx.avaliacao.deleteMany({ where: { contratacao: contratos } });
    await tx.fatura.deleteMany({ where: { contratacao: contratos } });
    await tx.contratacao.deleteMany({ where: contratos });
    await tx.indicacao.deleteMany({ where: { indicador: usuarios } });
    await tx.servico.deleteMany({
      where: { prestador: { usuario: usuarios } },
    });
    await tx.prestador.deleteMany({ where: { usuario: usuarios } });
    await tx.usuario.deleteMany({ where: usuarios });
  });
}
