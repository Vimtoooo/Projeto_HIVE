import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Prisma, StatusConta, TipoUsuario } from '@prisma/client';
import { BuscarServicosDto, CadastroPrestadorDto } from './catalogo.dto';
import { ServicoRepository } from './servico.repository';
import { Prestador } from '../models/Prestador';

@Injectable()
export class ServicoService {
  constructor(private readonly repositorio: ServicoRepository) {}

  async cadastrarPrestador(dados: CadastroPrestadorDto) {
    const prestador = new Prestador(
      dados.nome,
      dados.email,
      dados.senha,
      dados.telefone,
      dados.cpf,
      dados.endereco,
      TipoUsuario.PRESTADOR,
      StatusConta.ATIVO,
      dados.areaAtuacao,
      dados.experiencia,
      dados.certificacoes,
      dados.cnpj,
    );
    const servico = prestador.cadastrarServico(
      dados.servico.titulo,
      dados.servico.descricao,
      dados.servico.precoBase,
    );
    try {
      return await this.repositorio.cadastrar(prestador, servico);
    } catch (error) {
      this.falhaPersistencia(error);
    }
  }

  async buscarServicos(filtro: BuscarServicosDto) {
    if (
      filtro.precoMin !== undefined &&
      filtro.precoMax !== undefined &&
      filtro.precoMin > filtro.precoMax
    )
      throw new BadRequestException(
        'precoMin não pode ser maior que precoMax.',
      );
    try {
      return await this.repositorio.consultarServicos(filtro);
    } catch (error) {
      this.falhaPersistencia(error);
    }
  }

  private falhaPersistencia(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    )
      throw new ConflictException(
        'Já existe cadastro com os dados únicos informados.',
      );
    // O adapter MariaDB também pode lançar DriverAdapterError fora dos erros Prisma.
    if (
      error instanceof Error &&
      (error.name === 'DriverAdapterError' ||
        error instanceof Prisma.PrismaClientInitializationError ||
        (error instanceof Prisma.PrismaClientKnownRequestError &&
          ['P1001', 'P1002', 'P1008', 'P1017', 'P2024', 'P2028'].includes(
            error.code,
          )))
    )
      throw new ServiceUnavailableException(
        'Banco de dados indisponível. Tente novamente mais tarde.',
      );
    // Não devolver mensagens do driver, SQL, connection strings ou dados recebidos.
    throw new InternalServerErrorException(
      'Não foi possível concluir a operação.',
    );
  }
}
