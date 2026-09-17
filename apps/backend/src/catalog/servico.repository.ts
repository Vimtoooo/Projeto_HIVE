import { Inject, Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { BuscarServicosDto } from './catalogo.dto';
import { Prestador } from '../models/Prestador';
import { Servico } from '../models/Servico';
import { PersistenciaService } from '../persistence/persistencia.service';

// A lista explícita também protege contra expor novos campos privados no futuro.
const publico = {
  idServico: true,
  titulo: true,
  descricao: true,
  precoBase: true,
  prestador: {
    select: {
      idPrestador: true,
      areaAtuacao: true,
      avaliacaoMedia: true,
      usuario: { select: { nome: true } },
    },
  },
} satisfies Prisma.ServicoSelect;

type RegistroPublico = Prisma.ServicoGetPayload<{ select: typeof publico }>;

function apresentar(registro: RegistroPublico) {
  const { usuario, ...prestador } = registro.prestador;
  return { ...registro, prestador: { ...prestador, nome: usuario.nome } };
}

@Injectable()
export class ServicoRepository {
  constructor(
    @Inject(PrismaClient) private readonly db: PrismaClient,
    private readonly persistencia: PersistenciaService,
  ) {}

  async cadastrar(prestador: Prestador, servico: Servico) {
    // Reutiliza as classes e a transação já verificadas pelos testes de domínio.
    return this.persistencia.executar(async (repositorio) => {
      const perfil = await repositorio.criarPrestador(prestador);
      const salvo = await repositorio.criarServico(servico);
      return apresentar({
        idServico: salvo.idServico,
        titulo: salvo.titulo,
        descricao: salvo.descricao,
        precoBase: salvo.precoBase,
        prestador: {
          idPrestador: perfil.idPrestador,
          areaAtuacao: perfil.areaAtuacao,
          avaliacaoMedia: perfil.avaliacaoMedia,
          usuario: { nome: prestador.getNome },
        },
      });
    });
  }

  async consultarServicos(filtro: BuscarServicosDto) {
    const where: Prisma.ServicoWhereInput = {
      status: 'ATIVO',
      prestador: {
        usuario: { statusConta: 'ATIVO' },
        ...(filtro.areaAtuacao
          ? { areaAtuacao: { contains: filtro.areaAtuacao } }
          : {}),
      },
      ...(filtro.prestadorId !== undefined
        ? { prestadorId: filtro.prestadorId }
        : {}),
      ...(filtro.texto
        ? {
            OR: [
              { titulo: { contains: filtro.texto } },
              { descricao: { contains: filtro.texto } },
            ],
          }
        : {}),
      precoBase: { gte: filtro.precoMin, lte: filtro.precoMax },
    };
    const [registros, total] = await this.db.$transaction(
      [
        this.db.servico.findMany({
          where,
          select: publico,
          orderBy: { idServico: 'asc' },
          skip: (filtro.pagina - 1) * filtro.limite,
          take: filtro.limite,
        }),
        this.db.servico.count({ where }),
      ],
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
    return {
      itens: registros.map(apresentar),
      total,
      pagina: filtro.pagina,
      limite: filtro.limite,
    };
  }
}
