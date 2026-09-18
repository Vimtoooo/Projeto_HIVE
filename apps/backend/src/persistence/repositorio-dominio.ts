import { Prisma } from '@prisma/client';

import { Usuario } from '../models/Usuario';
import { Prestador } from '../models/Prestador';
import { Servico } from '../models/Servico';
import { Indicacao } from '../models/Indicacao';
import { Contratacao } from '../models/Contratacao';
import { Fatura } from '../models/Fatura';
import { Avaliacao } from '../models/Avaliacao';
import { Financeiro } from '../models/Financeiro';

/**
 * Insere objetos novos, em ordem de dependência, dentro de uma transação.
 * IDs das classes são locais à demonstração: nunca são usados como PK/FK.
 * O mapa pertence somente a esta transação e guarda os IDs gerados pelo banco.
 * Este repositório não faz upsert, atualização nem reidratação de objetos.
 */
export class RepositorioDominio {
  private readonly ids = new WeakMap<object, number>();
  private readonly prestadores = new WeakSet<Prestador>();

  constructor(private readonly db: Prisma.TransactionClient) {}

  private id(entidade: object, nome: string): number {
    const id = this.ids.get(entidade);

    if (id === undefined)
      throw new Error(`${nome} ainda não foi persistido nesta transação.`);

    return id;
  }

  private novo(entidade: object): void {
    if (this.ids.has(entidade))
      throw new Error(
        'Objeto já persistido nesta transação. Métodos criar não atualizam registros.',
      );
  }

  private async dadosUsuario(usuario: Usuario) {
    return {
      nome: usuario.getNome,
      email: usuario.getEmail,
      senha: await usuario.gerarHashSenha(),
      telefone: usuario.getTelefone,
      cpf: usuario.getCpf,
      endereco: usuario.getEndereco,
      tipoUsuario: usuario.getTipoUsuario,
      statusConta: usuario.getStatusConta,
      dataCadastro: usuario.getDataCadastro,
    };
  }

  async criarUsuario(usuario: Usuario) {
    this.novo(usuario);

    if (usuario instanceof Prestador)
      throw new Error(
        'Use criarPrestador para salvar o usuário e seu perfil juntos.',
      );

    const registro = await this.db.usuario.create({
      data: await this.dadosUsuario(usuario),
    });

    this.ids.set(usuario, registro.idUsuario);

    return registro;
  }

  async criarPrestador(prestador: Prestador) {
    this.novo(prestador);

    // Nested write mantém o vínculo 1:1 com a PK gerada para Usuario.
    const usuario = await this.db.usuario.create({
      data: {
        ...(await this.dadosUsuario(prestador)),
        prestadorPerfil: {
          create: {
            areaAtuacao: prestador.getAreaAtuacao,
            experiencia: prestador.getExperiencia,
            certificacoes: prestador.getCertificacoes,
            avaliacaoMedia: prestador.getAvaliacaoMedia,
            cnpj: prestador.getCnpj,
          },
        },
      },
      include: { prestadorPerfil: true },
    });

    this.ids.set(prestador, usuario.idUsuario);
    this.prestadores.add(prestador);

    return usuario.prestadorPerfil!;
  }

  async criarServico(servico: Servico) {
    this.novo(servico);

    const prestadorId = this.id(servico.getPrestador, 'Prestador');

    if (!this.prestadores.has(servico.getPrestador))
      throw new Error('Perfil de prestador não persistido.');

    const registro = await this.db.servico.create({
      data: {
        titulo: servico.getTitulo,
        descricao: servico.getDescricao,
        precoBase: servico.getPrecoBase,
        status: servico.getStatus,
        dataCadastro: servico.getDataCadastro,
        prestador: { connect: { idPrestador: prestadorId } },
      },
    });

    this.ids.set(servico, registro.idServico);

    return registro;
  }

  async criarIndicacao(indicacao: Indicacao) {
    this.novo(indicacao);

    const registro = await this.db.indicacao.create({
      data: {
        meioIndicado: indicacao.getMeioIndicado,
        dataIndicado: indicacao.getDataIndicado,
        statusIndicacao: indicacao.getStatusIndicacao,
        observacao: indicacao.getObservacao,
        indicador: {
          connect: {
            idUsuario: this.id(indicacao.getIndicador, 'Indicador'),
          },
        },
        indicado: {
          connect: {
            idPrestador: this.id(
              indicacao.getIndicado,
              'Prestador indicado',
            ),
          },
        },
      },
    });

    this.ids.set(indicacao, registro.idIndicacao);

    return registro;
  }

  async criarContratacao(contratacao: Contratacao) {
    this.novo(contratacao);

    const indicacao = contratacao.getIndicacao;

    if (
      indicacao &&
      indicacao.getIndicado !== contratacao.getServico.getPrestador
    ) {
      throw new Error(
        'A indicação deve apontar para o prestador do serviço contratado.',
      );
    }

    const registro = await this.db.contratacao.create({
      data: {
        dataContratacao: contratacao.getDataContratacao,
        status: contratacao.getStatus,
        valor: contratacao.getValor,
        formaPagamento: contratacao.getFormaPagamento,
        dataVencimento: contratacao.getDataVencimento ?? null,
        servico: {
          connect: {
            idServico: this.id(contratacao.getServico, 'Serviço'),
          },
        },
        contratante: {
          connect: {
            idUsuario: this.id(
              contratacao.getContratante,
              'Contratante',
            ),
          },
        },
        ...(indicacao
          ? {
              indicacao: {
                connect: {
                  idIndicacao: this.id(indicacao, 'Indicação'),
                },
              },
            }
          : {}),
      },
    });

    this.ids.set(contratacao, registro.idContratacao);

    return registro;
  }

  async criarFatura(fatura: Fatura) {
    this.novo(fatura);

    if (fatura.getUsuario !== fatura.getContratacao.getContratante) {
      throw new Error('O usuário da fatura deve ser o contratante.');
    }

    const registro = await this.db.fatura.create({
      data: {
        dataEmissao: fatura.getDataEmissao,
        valorTotal: fatura.getValorTotal,
        statusPagamento: fatura.getStatusPagamento,
        dataPagamento: fatura.getDataPagamento,
        usuario: {
          connect: {
            idUsuario: this.id(fatura.getUsuario, 'Usuário'),
          },
        },
        contratacao: {
          connect: {
            idContratacao: this.id(
              fatura.getContratacao,
              'Contratação',
            ),
          },
        },
      },
    });

    this.ids.set(fatura, registro.idFatura);

    return registro;
  }

  async criarAvaliacao(avaliacao: Avaliacao) {
    this.novo(avaliacao);

    const registro = await this.db.avaliacao.create({
      data: {
        nota: avaliacao.getNota,
        comentario: avaliacao.getComentario ?? null,
        dataAvaliacao: avaliacao.getDataAvaliacao,
        contratacao: {
          connect: {
            idContratacao: this.id(
              avaliacao.getContratacao,
              'Contratação',
            ),
          },
        },
      },
    });

    this.ids.set(avaliacao, registro.idAvaliacao);

    return registro;
  }

  async criarFinanceiro(financeiro: Financeiro) {
    this.novo(financeiro);

    const fatura = financeiro.getFatura;

    if (
      fatura &&
      fatura.getContratacao !== financeiro.getContratacao
    ) {
      throw new Error(
        'A fatura e o lançamento financeiro devem pertencer à mesma contratação.',
      );
    }

    const registro = await this.db.financeiro.create({
      data: {
        tipoRegistro: financeiro.getTipoRegistro,
        valor: financeiro.getValor,
        descricao: financeiro.getDescricao ?? null,
        dataRegistro: financeiro.getDataRegistro,
        contratacao: {
          connect: {
            idContratacao: this.id(
              financeiro.getContratacao,
              'Contratação',
            ),
          },
        },
        ...(fatura
          ? {
              fatura: {
                connect: {
                  idFatura: this.id(fatura, 'Fatura'),
                },
              },
            }
          : {}),
      },
    });

    this.ids.set(financeiro, registro.idFinanceiro);

    return registro;
  }

  async buscarUsuarioPorEmail(email: string) {
    return this.db.usuario.findUnique({
      where: {
        email: email.toLowerCase().trim(),
      },
    });
  }
}