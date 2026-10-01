import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { SendMessageDto } from './messaging.dto';
const identity = { idUsuario: true, nome: true } as const;
const participants = {
  cliente: { select: identity },
  prestador: { select: identity },
};
@Injectable()
export class MessagingService {
  constructor(private readonly db: PrismaClient) {}
  async start(user: number, prestadorId: number) {
    if (user === prestadorId)
      throw new BadRequestException(
        'Escolha outro profissional para conversar.',
      );
    const provider = await this.db.prestador.findFirst({
      where: {
        idPrestador: prestadorId,
        usuario: { statusConta: 'ATIVO' },
        servicos: { some: { status: 'ATIVO' } },
      },
    });
    if (!provider) throw new NotFoundException('Profissional indisponível.');
    return this.db.conversa.upsert({
      where: { clienteId_prestadorId: { clienteId: user, prestadorId } },
      create: { clienteId: user, prestadorId },
      update: {},
      include: participants,
    });
  }
  list(user: number) {
    return this.db.conversa.findMany({
      where: { OR: [{ clienteId: user }, { prestadorId: user }] },
      include: participants,
      orderBy: [{ atualizadaEm: 'desc' }, { id: 'desc' }],
      take: 100,
    });
  }
  private async access(user: number, id: number) {
    const row = await this.db.conversa.findFirst({
      where: { id, OR: [{ clienteId: user }, { prestadorId: user }] },
    });
    if (!row) throw new NotFoundException('Conversa não encontrada.');
    return row;
  }
  async messages(user: number, id: number, before?: number) {
    await this.access(user, id);
    const rows = await this.db.mensagem.findMany({
      where: { conversaId: id, ...(before ? { id: { lt: before } } : {}) },
      orderBy: { id: 'desc' },
      take: 51,
    });
    return { itens: rows.slice(0, 50).reverse(), temMais: rows.length > 50 };
  }
  async send(user: number, id: number, input: SendMessageDto) {
    const conversation = await this.access(user, id);
    const active = await this.db.usuario.count({
      where: {
        idUsuario: { in: [conversation.clienteId, conversation.prestadorId] },
        statusConta: 'ATIVO',
      },
    });
    if (active !== 2)
      throw new BadRequestException(
        'Participante indisponível para receber mensagens.',
      );
    return this.db.$transaction(async (tx) => {
      const message = await tx.mensagem.upsert({
        where: {
          conversaId_remetenteId_chave: {
            conversaId: id,
            remetenteId: user,
            chave: input.chave,
          },
        },
        create: { conversaId: id, remetenteId: user, ...input },
        update: {},
      });
      await tx.conversa.update({
        where: { id },
        data: { atualizadaEm: new Date() },
      });
      return message;
    });
  }
  async history(user: number) {
    // Return one card per provider from the last 100 distinct completed services.
    const rows = await this.db.contratacao.findMany({
      where: { contratanteId: user, status: 'CONCLUIDA' },
      distinct: ['servicoId'],
      orderBy: [{ dataContratacao: 'desc' }, { idContratacao: 'desc' }],
      take: 100,
      select: {
        dataContratacao: true,
        servico: {
          select: {
            titulo: true,
            prestador: {
              select: {
                idPrestador: true,
                areaAtuacao: true,
                usuario: { select: { nome: true, statusConta: true } },
                servicos: {
                  where: { status: 'ATIVO' },
                  select: { idServico: true },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });
    const seen = new Set<number>();
    return rows
      .filter((row) => {
        const id = row.servico.prestador.idPrestador;
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      })
      .map((row) => ({
        prestadorId: row.servico.prestador.idPrestador,
        nome: row.servico.prestador.usuario.nome,
        areaAtuacao: row.servico.prestador.areaAtuacao,
        ultimoServico: row.servico.titulo,
        dataContratacao: row.dataContratacao,
        disponivel:
          row.servico.prestador.usuario.statusConta === 'ATIVO' &&
          row.servico.prestador.servicos.length > 0,
      }));
  }
}
