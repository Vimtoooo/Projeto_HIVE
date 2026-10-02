import { NotificationsService } from '../notifications/notifications.service';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import {
  CreateRequestDto,
  RequestActionDto,
  RequestQueryDto,
} from './requests.dto';
const identity = { idUsuario: true, nome: true } as const;
const select = {
  idContratacao: true,
  dataContratacao: true,
  status: true,
  valor: true,
  formaPagamento: true,
  contratanteId: true,
  contratante: { select: identity },
  servico: {
    select: {
      idServico: true,
      titulo: true,
      descricao: true,
      prestadorId: true,
      prestador: {
        select: { areaAtuacao: true, usuario: { select: identity } },
      },
    },
  },
  fatura: { select: { statusPagamento: true } },
  _count: { select: { financeiros: true } },
} satisfies Prisma.ContratacaoSelect;
type Row = Prisma.ContratacaoGetPayload<{ select: typeof select }>;
const access = (user: number): Prisma.ContratacaoWhereInput => ({
  OR: [{ contratanteId: user }, { servico: { prestadorId: user } }],
});
function financialBlock(row: Row) {
  return (
    row._count.financeiros > 0 ||
    (row.fatura !== null &&
      !['PENDENTE', 'CANCELADO'].includes(row.fatura.statusPagamento))
  );
}
function present(row: Row, user: number) {
  const provider = row.servico.prestadorId === user;
  const acoes: RequestActionDto['acao'][] = [];
  if (row.status === 'PENDENTE') {
    if (provider) acoes.push('ACEITAR');
    if (!financialBlock(row)) acoes.push(provider ? 'RECUSAR' : 'CANCELAR');
  }
  if (row.status === 'EM_ANDAMENTO') {
    if (provider) acoes.push('CONCLUIR');
    if (!financialBlock(row)) acoes.push('CANCELAR');
  }
  return {
    idContratacao: row.idContratacao,
    dataContratacao: row.dataContratacao,
    status: row.status,
    valor: row.valor,
    formaPagamento: row.formaPagamento,
    contratante: row.contratante,
    servico: {
      idServico: row.servico.idServico,
      titulo: row.servico.titulo,
      descricao: row.servico.descricao,
    },
    prestador: {
      ...row.servico.prestador.usuario,
      areaAtuacao: row.servico.prestador.areaAtuacao,
    },
    papel: provider ? 'prestador' : 'cliente',
    acoes,
    cancelamentoBloqueado: financialBlock(row),
  };
}
@Injectable()
export class RequestsService {
  constructor(
    private readonly db: PrismaClient,
    private readonly notifications: NotificationsService,
  ) {}
  private async row(db: Prisma.TransactionClient, user: number, id: number) {
    const row = await db.contratacao.findFirst({
      where: { idContratacao: id, ...access(user) },
      select,
    });
    if (!row) throw new NotFoundException('Solicitação não encontrada.');
    return row;
  }
  async list(user: number, q: RequestQueryDto) {
    const where: Prisma.ContratacaoWhereInput = {
      ...(q.papel === 'prestador'
        ? { servico: { prestadorId: user } }
        : { contratanteId: user }),
      ...(q.status ? { status: q.status } : {}),
    };
    const [rows, total] = await this.db.$transaction(
      [
        this.db.contratacao.findMany({
          where,
          select,
          orderBy: [{ dataContratacao: 'desc' }, { idContratacao: 'desc' }],
          skip: (q.pagina - 1) * q.limite,
          take: q.limite,
        }),
        this.db.contratacao.count({ where }),
      ],
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
    return {
      itens: rows.map((row) => present(row, user)),
      total,
      pagina: q.pagina,
      limite: q.limite,
    };
  }
  async detail(user: number, id: number) {
    return present(await this.row(this.db, user, id), user);
  }
  async create(user: number, input: CreateRequestDto) {
    const where = {
      contratanteId_chave: { contratanteId: user, chave: input.chave },
    };
    const previous = await this.db.contratacao.findUnique({ where, select });
    const replay = (row: Row) => {
      if (
        row.servico.idServico !== input.servicoId ||
        row.formaPagamento !== input.formaPagamento
      )
        throw new ConflictException(
          'Chave de envio já usada para outro pedido.',
        );
      return present(row, user);
    };
    if (previous) return replay(previous);
    try {
      return await this.db.$transaction(async (tx) => {
        const account = await tx.usuario.findUniqueOrThrow({
          where: { idUsuario: user },
          select: { tipoUsuario: true },
        });
        if (account.tipoUsuario === 'PRESTADOR')
          throw new BadRequestException('Esta conta é somente de prestador.');
        const service = await tx.servico.findFirst({
          where: {
            idServico: input.servicoId,
            status: 'ATIVO',
            prestador: { usuario: { statusConta: 'ATIVO' } },
          },
        });
        if (!service || service.prestadorId === user)
          throw new BadRequestException(
            'Escolha um serviço ativo de outro profissional.',
          );
        if (!Number.isFinite(service.precoBase) || service.precoBase < 0)
          throw new BadRequestException('Preço do serviço indisponível.');
        const created = await tx.contratacao.create({
          data: {
            contratanteId: user,
            servicoId: service.idServico,
            valor: service.precoBase,
            formaPagamento: input.formaPagamento,
            chave: input.chave,
            status: 'PENDENTE',
          },
          select,
        });
        await this.notifications.emit(tx, {
          usuarioId: service.prestadorId,
          tipo: 'SOLICITACAO_CRIADA',
          chaveEvento: `pedido:${created.idContratacao}:CRIADA`,
          titulo: 'Nova solicitação de serviço',
          descricao:
            `${created.contratante.nome} solicitou ${service.titulo}.`.slice(
              0,
              500,
            ),
          contratacaoId: created.idContratacao,
        });
        return present(created, user);
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        const saved = await this.db.contratacao.findUnique({ where, select });
        if (saved) return replay(saved);
      }
      throw e;
    }
  }
  async act(user: number, id: number, acao: RequestActionDto['acao']) {
    try {
      return await this.db.$transaction(
        async (tx) => {
          const row = await this.row(tx, user, id);
          const isProvider = row.servico.prestadorId === user;
          if (['ACEITAR', 'RECUSAR', 'CONCLUIR'].includes(acao) && !isProvider)
            throw new ForbiddenException('Esta ação é exclusiva do prestador.');
          if (['CONCLUIDA', 'CANCELADA'].includes(row.status))
            throw new ConflictException('Esta solicitação já foi encerrada.');
          if (
            (['ACEITAR', 'RECUSAR'].includes(acao) &&
              row.status !== 'PENDENTE') ||
            (acao === 'CONCLUIR' && row.status !== 'EM_ANDAMENTO')
          )
            throw new ConflictException(
              'O estado da solicitação mudou. Atualize a página.',
            );
          if (
            (acao === 'CANCELAR' || acao === 'RECUSAR') &&
            financialBlock(row)
          )
            throw new ConflictException(
              'Existem registros financeiros. O cancelamento exige tratar o pagamento primeiro.',
            );
          const status =
            acao === 'ACEITAR'
              ? 'EM_ANDAMENTO'
              : acao === 'CONCLUIR'
                ? 'CONCLUIDA'
                : 'CANCELADA';
          const updated = await tx.contratacao.updateMany({
            where: { idContratacao: id, status: row.status },
            data: { status },
          });
          if (updated.count !== 1)
            throw new ConflictException(
              'Outra ação alterou esta solicitação. Atualize a página.',
            );
          if (status === 'CANCELADA')
            await tx.fatura.updateMany({
              where: { contratacaoId: id, statusPagamento: 'PENDENTE' },
              data: { statusPagamento: 'CANCELADO' },
            });
          const events = {
            ACEITAR: ['SOLICITACAO_ACEITA', 'Solicitação aceita'],
            RECUSAR: ['SOLICITACAO_RECUSADA', 'Solicitação recusada'],
            CONCLUIR: ['SOLICITACAO_CONCLUIDA', 'Serviço concluído'],
            CANCELAR: ['SOLICITACAO_CANCELADA', 'Solicitação cancelada'],
          } as const;
          const [tipo, titulo] = events[acao];
          await this.notifications.emit(tx, {
            usuarioId: isProvider ? row.contratanteId : row.servico.prestadorId,
            tipo,
            titulo,
            chaveEvento: `pedido:${id}:${acao}`,
            descricao:
              `${isProvider ? row.servico.prestador.usuario.nome : row.contratante.nome} atualizou o pedido de ${row.servico.titulo}.`.slice(
                0,
                500,
              ),
            contratacaoId: id,
          });
          return present(await this.row(tx, user, id), user);
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2034'
      )
        throw new ConflictException(
          'Outra ação alterou esta solicitação. Atualize a página.',
        );
      throw e;
    }
  }
  async conversation(user: number, id: number) {
    const row = await this.row(this.db, user, id);
    return this.db.conversa.upsert({
      where: {
        clienteId_prestadorId: {
          clienteId: row.contratanteId,
          prestadorId: row.servico.prestadorId,
        },
      },
      create: {
        clienteId: row.contratanteId,
        prestadorId: row.servico.prestadorId,
      },
      update: {},
      include: {
        cliente: { select: identity },
        prestador: { select: identity },
      },
    });
  }
}
