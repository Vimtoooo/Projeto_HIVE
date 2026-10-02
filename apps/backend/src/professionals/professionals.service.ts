import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { ProfessionalsQueryDto } from './professionals.dto';
const available = {
  usuario: { statusConta: 'ATIVO' },
  servicos: { some: { status: 'ATIVO' } },
} satisfies Prisma.PrestadorWhereInput;
// Explicit allowlist: no contact details, documents, passwords or residential address.
const summary = {
  idPrestador: true,
  areaAtuacao: true,
  usuario: { select: { nome: true } },
  servicos: {
    where: { status: 'ATIVO' },
    orderBy: [{ precoBase: 'asc' }, { idServico: 'asc' }],
    take: 1,
    select: { precoBase: true },
  },
  _count: { select: { servicos: { where: { status: 'ATIVO' } } } },
} satisfies Prisma.PrestadorSelect;
const services = {
  idServico: true,
  titulo: true,
  descricao: true,
  precoBase: true,
} satisfies Prisma.ServicoSelect;
@Injectable()
export class ProfessionalsService {
  constructor(private readonly db: PrismaClient) {}
  private async rating(tx: Prisma.TransactionClient, id: number) {
    const result = await tx.avaliacao.aggregate({
      where: { contratacao: { servico: { prestadorId: id } } },
      _count: { nota: true },
      _avg: { nota: true },
    });
    return { quantidade: result._count.nota, media: result._avg.nota };
  }
  list(q: ProfessionalsQueryDto) {
    const contains = (value: string) => ({
      contains: value,
      mode: Prisma.QueryMode.insensitive,
    });
    const where: Prisma.PrestadorWhereInput = {
      ...available,
      ...(q.areaAtuacao ? { areaAtuacao: contains(q.areaAtuacao) } : {}),
      ...(q.texto
        ? {
            OR: [
              { usuario: { nome: contains(q.texto) } },
              { areaAtuacao: contains(q.texto) },
              {
                servicos: {
                  some: {
                    status: 'ATIVO',
                    OR: [
                      { titulo: contains(q.texto) },
                      { descricao: contains(q.texto) },
                    ],
                  },
                },
              },
            ],
          }
        : {}),
    };
    return this.db.$transaction(
      async (tx) => {
        const rows = await tx.prestador.findMany({
          where,
          select: summary,
          orderBy: [{ usuario: { nome: 'asc' } }, { idPrestador: 'asc' }],
          skip: (q.pagina - 1) * q.limite,
          take: q.limite,
        });
        const total = await tx.prestador.count({ where });
        const itens: {
          idPrestador: number;
          nome: string;
          areaAtuacao: string;
          precoInicial: number;
          quantidadeServicos: number;
          avaliacao: { quantidade: number; media: number | null };
        }[] = [];
        for (const row of rows) {
          itens.push({
            idPrestador: row.idPrestador,
            nome: row.usuario.nome,
            areaAtuacao: row.areaAtuacao,
            precoInicial: row.servicos[0].precoBase,
            quantidadeServicos: row._count.servicos,
            avaliacao: await this.rating(tx, row.idPrestador),
          });
        }
        return { itens, total, pagina: q.pagina, limite: q.limite };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
  }
  detail(id: number) {
    return this.db.$transaction(
      async (tx) => {
        const row = await tx.prestador.findFirst({
          where: { ...available, idPrestador: id },
          select: {
            idPrestador: true,
            areaAtuacao: true,
            experiencia: true,
            certificacoes: true,
            usuario: { select: { nome: true } },
            servicos: {
              where: { status: 'ATIVO' },
              orderBy: [{ titulo: 'asc' }, { idServico: 'asc' }],
              select: services,
            },
          },
        });
        if (!row) throw new NotFoundException('Profissional indisponível.');
        const { usuario, ...profile } = row;
        return {
          ...profile,
          nome: usuario.nome,
          avaliacao: await this.rating(tx, id),
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
  }
}
