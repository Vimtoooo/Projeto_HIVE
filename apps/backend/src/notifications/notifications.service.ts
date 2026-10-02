import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { NotificationQueryDto } from './notifications.dto';
const select = {
  id: true,
  tipo: true,
  titulo: true,
  descricao: true,
  criadaEm: true,
  lidaEm: true,
  contratacao: {
    select: { idContratacao: true, servico: { select: { prestadorId: true } } },
  },
  mensagem: { select: { conversaId: true } },
} satisfies Prisma.NotificacaoSelect;
type Row = Prisma.NotificacaoGetPayload<{ select: typeof select }>;
function present(row: Row, user: number) {
  const { contratacao, mensagem, ...fields } = row;
  return {
    ...fields,
    destino: contratacao
      ? `/solicitacoes?pedido=${contratacao.idContratacao}&papel=${contratacao.servico.prestadorId === user ? 'prestador' : 'cliente'}`
      : mensagem
        ? `/mensagens?conversa=${mensagem.conversaId}`
        : null,
  };
}
@Injectable()
export class NotificationsService {
  constructor(private readonly db: PrismaClient) {}
  // Must run in the originating operation's transaction, never independently.
  emit(
    tx: Prisma.TransactionClient,
    data: Prisma.NotificacaoUncheckedCreateInput,
  ) {
    return tx.notificacao.upsert({
      where: {
        usuarioId_chaveEvento: {
          usuarioId: data.usuarioId,
          chaveEvento: data.chaveEvento,
        },
      },
      create: data,
      update: {},
    });
  }
  async summary(user: number) {
    const [naoLidas, last] = await this.db.$transaction(
      [
        this.db.notificacao.count({ where: { usuarioId: user, lidaEm: null } }),
        this.db.notificacao.findFirst({
          where: { usuarioId: user },
          orderBy: { id: 'desc' },
          select: { id: true },
        }),
      ],
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
    return { usuarioId: user, naoLidas, ateId: last?.id ?? 0 };
  }
  async list(user: number, q: NotificationQueryDto) {
    return this.db.$transaction(
      async (tx) => {
        const last = await tx.notificacao.findFirst({
          where: { usuarioId: user },
          orderBy: { id: 'desc' },
          select: { id: true },
        });
        const ateId = q.ateId ?? last?.id ?? 0;
        const rows = await tx.notificacao.findMany({
          where: {
            usuarioId: user,
            id: { lte: ateId, ...(q.antes ? { lt: q.antes } : {}) },
            ...(q.naoLidas ? { lidaEm: null } : {}),
            ...(q.categoria
              ? {
                  tipo:
                    q.categoria === 'mensagens'
                      ? 'NOVA_MENSAGEM'
                      : { not: 'NOVA_MENSAGEM' },
                }
              : {}),
          },
          orderBy: { id: 'desc' },
          select,
          take: q.limite + 1,
        });
        return {
          usuarioId: user,
          itens: rows.slice(0, q.limite).map((row) => present(row, user)),
          ateId,
          proximoCursor: rows.length > q.limite ? rows[q.limite - 1].id : null,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
  }
  async detail(user: number, id: number) {
    const row = await this.db.notificacao.findFirst({
      where: { id, usuarioId: user },
      select,
    });
    if (!row)
      throw new NotFoundException('Notificação indisponível ou removida.');
    return present(row, user);
  }
  async read(user: number, id: number) {
    await this.db.notificacao.updateMany({
      where: { id, usuarioId: user, lidaEm: null },
      data: { lidaEm: new Date() },
    });
    return this.detail(user, id);
  }
  async readAll(user: number, ateId: number) {
    const result = await this.db.notificacao.updateMany({
      where: { usuarioId: user, id: { lte: ateId }, lidaEm: null },
      data: { lidaEm: new Date() },
    });
    return { atualizadas: result.count };
  }
}
