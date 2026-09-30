import { ConflictException, Injectable, InternalServerErrorException, ServiceUnavailableException } from '@nestjs/common';
import { Prisma, StatusConta, TipoUsuario } from '@prisma/client';
import { CadastroClienteDto } from './cliente.dto';
import { PersistenciaService } from '../persistence/persistencia.service';
import { Usuario } from '../models/Usuario';

@Injectable()
export class ClienteService {
  constructor(private readonly persistencia: PersistenciaService) {}

  async cadastrar(dados: CadastroClienteDto) {
    const usuario = new Usuario(
      dados.nome,
      dados.email,
      dados.senha,
      dados.telefone,
      dados.cpf,
      dados.endereco,
      TipoUsuario.CONTRATANTE,
      StatusConta.ATIVO,
    );

    try {
      const registro = await this.persistencia.executar((repositorio) =>
        repositorio.criarUsuario(usuario),
      );
      return {
        idUsuario: registro.idUsuario,
        nome: registro.nome,
        email: registro.email,
        tipoUsuario: registro.tipoUsuario,
      };
    } catch (error) {
      this.falhaPersistencia(error);
    }
  }

  private falhaPersistencia(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('E-mail ou CPF já cadastrados.');
    }
    if (
      error instanceof Error &&
      (error.name === 'DriverAdapterError' ||
        error instanceof Prisma.PrismaClientInitializationError)
    ) {
      throw new ServiceUnavailableException('Banco de dados indisponível. Tente novamente mais tarde.');
    }
    throw new InternalServerErrorException('Não foi possível concluir o cadastro.');
  }
}