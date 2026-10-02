import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
@Injectable()
export class FavoritesService {
  constructor(private readonly db: PrismaClient) {}
  list(user: number) {
    return this.db.$transaction(
      async (tx) => {
        const rows = await tx.favorito.findMany({
          where: { usuarioId: user },
          orderBy: [{ criadoEm: 'desc' }, { prestadorId: 'asc' }],
          select: {
            criadoEm: true,
            prestador: {
              select: {
                idPrestador: true,
                areaAtuacao: true,
                usuario: { select: { nome: true, statusConta: true } },
                servicos: {
                  where: { status: 'ATIVO' },
                  orderBy: [{ precoBase: 'asc' }, { idServico: 'asc' }],
                  take: 1,
                  select: { precoBase: true },
                },
                _count: {
                  select: { servicos: { where: { status: 'ATIVO' } } },
                },
              },
            },
          },
        });
        const itens: {
          idPrestador: number;
          nome: string;
          areaAtuacao: string;
          criadoEm: Date;
          disponivel: boolean;
          profissional: {
            idPrestador: number;
            nome: string;
            areaAtuacao: string;
            precoInicial: number;
            quantidadeServicos: number;
            avaliacao: { quantidade: number; media: number | null };
          } | null;
        }[] = [];
        for (const { prestador: p, criadoEm } of rows) {
          const disponivel =
            p.usuario.statusConta === 'ATIVO' && p.servicos.length > 0;
          const rating = disponivel
            ? await tx.avaliacao.aggregate({
                where: {
                  contratacao: { servico: { prestadorId: p.idPrestador } },
                },
                _count: { nota: true },
                _avg: { nota: true },
              })
            : null;
          itens.push({
            idPrestador: p.idPrestador,
            nome: p.usuario.nome,
            areaAtuacao: p.areaAtuacao,
            criadoEm,
            disponivel,
            profissional: rating
              ? {
                  idPrestador: p.idPrestador,
                  nome: p.usuario.nome,
                  areaAtuacao: p.areaAtuacao,
                  precoInicial: p.servicos[0].precoBase,
                  quantidadeServicos: p._count.servicos,
                  avaliacao: {
                    quantidade: rating._count.nota,
                    media: rating._avg.nota,
                  },
                }
              : null,
          });
        }
        return { usuarioId: user, itens };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
  }
  async save(user: number, provider: number) {
    if (user === provider)
      throw new BadRequestException(
        'Escolha outro profissional para favoritar.',
      );
    try {
      await this.db.$transaction(async (tx) => {
        const existing = await tx.favorito.findUnique({
          where: {
            usuarioId_prestadorId: { usuarioId: user, prestadorId: provider },
          },
        });
        // Repeated PUT preserves the original date, even if the saved provider became unavailable.
        if (existing) return;
        const available = await tx.prestador.findFirst({
          where: {
            idPrestador: provider,
            usuario: { statusConta: 'ATIVO' },
            servicos: { some: { status: 'ATIVO' } },
          },
          select: { idPrestador: true },
        });
        if (!available)
          throw new NotFoundException('Profissional indisponível.');
        await tx.favorito.createMany({
          data: [{ usuarioId: user, prestadorId: provider }],
          skipDuplicates: true,
        });
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2003'
      )
        throw new NotFoundException('Profissional indisponível.');
      throw e;
    }
    return { usuarioId: user, prestadorId: provider, favorito: true };
  }
  async remove(user: number, provider: number) {
    await this.db.favorito.deleteMany({
      where: { usuarioId: user, prestadorId: provider },
    });
    return { usuarioId: user, prestadorId: provider, favorito: false };
  }
}
