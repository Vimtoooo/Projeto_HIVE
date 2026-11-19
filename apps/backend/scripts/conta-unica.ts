import { Prisma, PrismaClient } from '@prisma/client';
import { criarPrismaClient } from '../src/persistence/prisma-client.factory';

async function analisar(db: Prisma.TransactionClient) {
  const contas = await db.usuario.findMany({
    select: {
      idUsuario: true,
      tipoUsuario: true,
      prestadorPerfil: {
        select: {
          cnpj: true,
          areaAtuacao: true,
          experiencia: true,
          _count: { select: { servicos: true } },
        },
      },
    },
    orderBy: { idUsuario: 'asc' },
  });
  const contagens: Record<string, number> = {};
  const elegiveis: number[] = [];
  const inconsistencias: { idUsuario: number; motivo: string }[] = [];
  for (const conta of contas) {
    const perfil = conta.prestadorPerfil;
    const grupo = `${conta.tipoUsuario}:${perfil ? 'comPerfil' : 'semPerfil'}`;
    contagens[grupo] = (contagens[grupo] ?? 0) + 1;
    let motivo = '';
    if (!perfil && conta.tipoUsuario !== 'CONTRATANTE')
      motivo = 'Tipo profissional sem perfil';
    if (
      perfil &&
      (!/^\d{14}$/.test(perfil.cnpj) ||
        !perfil.areaAtuacao.trim() ||
        !perfil.experiencia.trim())
    )
      motivo = 'Dados profissionais incompletos';
    if (perfil && perfil._count.servicos === 0) motivo = 'Perfil sem serviço';
    if (perfil && conta.tipoUsuario === 'CONTRATANTE')
      motivo = 'Contratante com perfil profissional';
    if (motivo) inconsistencias.push({ idUsuario: conta.idUsuario, motivo });
    else if (perfil && conta.tipoUsuario === 'PRESTADOR')
      elegiveis.push(conta.idUsuario);
  }
  return { contagens, elegiveis, inconsistencias };
}

export function diagnosticarContas(db: PrismaClient) {
  return db.$transaction(analisar, {
    isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
  });
}
export function converterContas(db: PrismaClient) {
  return db.$transaction(
    async (tx) => {
      const antes = await analisar(tx);
      const resultado = await tx.usuario.updateMany({
        where: { idUsuario: { in: antes.elegiveis }, tipoUsuario: 'PRESTADOR' },
        data: { tipoUsuario: 'AMBOS' },
      });
      return {
        antes,
        idsConvertidos: antes.elegiveis,
        convertidas: resultado.count,
        depois: await analisar(tx),
      };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

if (require.main === module) {
  const db = criarPrismaClient();
  void (async () => {
    try {
      const args = process.argv.slice(2);
      const aplicar = args.includes('--aplicar');
      const banco = new URL(process.env.DATABASE_URL!).pathname.slice(1);
      if (aplicar && !args.includes(`--confirmar-banco=${banco}`))
        throw Error(
          'Para converter, informe --aplicar e --confirmar-banco=NOME_EXATO.',
        );
      const resultado = aplicar
        ? await converterContas(db)
        : await diagnosticarContas(db);
      console.log(
        JSON.stringify(
          { operacao: aplicar ? 'conversao' : 'diagnostico', ...resultado },
          null,
          2,
        ),
      );
    } catch {
      console.error(
        'Operação não concluída. Confira conexão, destino e confirmação; nenhuma correção automática de inconsistências é executada.',
      );
      process.exitCode = 1;
    } finally {
      await db.$disconnect();
    }
  })();
}
