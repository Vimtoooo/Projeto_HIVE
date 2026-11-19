import {
  ConflictException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { PerfilProfissionalDto } from './catalogo.dto';
import { apresentar, publico } from './servico.repository';

const existente = () =>
  new ConflictException({
    code: 'PERFIL_PROFISSIONAL_EXISTENTE',
    message: 'Esta conta já possui perfil profissional.',
  });

@Injectable()
export class AtivacaoPrestadorService {
  constructor(private readonly db: PrismaClient) {}

  async ativar(usuarioId: number, dados: PerfilProfissionalDto) {
    for (let tentativa = 0; tentativa < 3; tentativa++) {
      try {
        return await this.db.$transaction(
          async (tx) => {
            const usuario = await tx.usuario.findUnique({
              where: { idUsuario: usuarioId },
              select: {
                statusConta: true,
                prestadorPerfil: { select: { idPrestador: true } },
              },
            });
            if (!usuario || usuario.statusConta !== 'ATIVO')
              throw new UnauthorizedException(
                'Entre novamente para continuar.',
              );
            if (usuario.prestadorPerfil) throw existente();
            await tx.prestador.create({
              data: {
                idPrestador: usuarioId,
                cnpj: dados.cnpj,
                areaAtuacao: dados.areaAtuacao,
                experiencia: dados.experiencia,
                certificacoes: dados.certificacoes,
              },
            });
            const servico = await tx.servico.create({
              data: {
                ...dados.servico,
                prestadorId: usuarioId,
                status: 'ATIVO',
              },
              select: publico,
            });
            await tx.usuario.update({
              where: { idUsuario: usuarioId },
              data: { tipoUsuario: 'AMBOS' },
            });
            return apresentar(servico);
          },
          {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
            maxWait: 5000,
            timeout: 15000,
          },
        );
      } catch (error) {
        if (
          error instanceof ConflictException ||
          error instanceof UnauthorizedException
        )
          throw error;
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2034' && tentativa < 2) continue;
          if (error.code === 'P2002') {
            const perfil = await this.db.prestador.findUnique({
              where: { idPrestador: usuarioId },
              select: { idPrestador: true },
            });
            if (perfil) throw existente();
            throw new ConflictException({
              code: 'CNPJ_DUPLICADO',
              message: 'Este CNPJ já possui cadastro profissional.',
            });
          }
        }
        // Não expor SQL, documentos ou credenciais em falhas do banco.
        throw new ServiceUnavailableException(
          'Não foi possível confirmar a ativação. Consulte sua sessão e tente novamente.',
        );
      }
    }
    throw new ServiceUnavailableException('Tente novamente mais tarde.');
  }
}
