import { PrismaClient, StatusConta, TipoUsuario } from '@prisma/client';
import { Usuario } from '../src/models/Usuario';
import {
  DATA_DEMONSTRACAO,
  pessoas,
  SENHA_DEMONSTRACAO,
  servicos,
} from './seed-data';

export class SeedConfiguracaoError extends Error {}

export function validarDestinoSeed(
  url: string | undefined,
  confirmacao: string | undefined,
  ambiente = process.env.NODE_ENV,
): string {
  if (ambiente === 'production')
    throw new SeedConfiguracaoError('Seed local bloqueado em produção.');
  if (!url)
    throw new SeedConfiguracaoError(
      'Configure DATABASE_URL para o banco local.',
    );
  let destino: URL;
  try {
    destino = new URL(url);
  } catch {
    throw new SeedConfiguracaoError('DATABASE_URL inválida.');
  }
  const banco = destino.pathname.slice(1);
  if (
    destino.protocol !== 'mysql:' ||
    !['localhost', '127.0.0.1', '[::1]'].includes(destino.hostname) ||
    destino.search ||
    destino.hash ||
    !(banco === 'hive' || /^[a-zA-Z0-9_]+_(local|test)$/.test(banco))
  ) {
    throw new SeedConfiguracaoError(
      'Use MySQL em loopback, sem parâmetros, com banco hive ou nome terminado em _local ou _test.',
    );
  }
  if (confirmacao !== banco)
    throw new SeedConfiguracaoError(
      'Informe --confirm seguido do nome exato do banco local.',
    );
  return banco;
}

/** Reset de DADOS, sem DROP, TRUNCATE ou desativação de FKs. Pare a API antes. */
export async function popularDemonstracao(prisma: PrismaClient, reset = false) {
  return prisma.$transaction(
    async (db) => {
      if (reset) {
        await db.financeiro.deleteMany();
        await db.avaliacao.deleteMany();
        await db.fatura.deleteMany();
        await db.contratacao.deleteMany();
        await db.indicacao.deleteMany();
        await db.servico.deleteMany();
        await db.prestador.deleteMany();
        await db.usuario.deleteMany();
      } else if (await db.usuario.count()) {
        throw new SeedConfiguracaoError(
          'Banco não está vazio. Use db:reset:local para substituir os dados explicitamente.',
        );
      }
      const ids = new Map<string, number>();
      for (const pessoa of pessoas) {
        const tipo = pessoa.perfil
          ? TipoUsuario.PRESTADOR
          : TipoUsuario.CONTRATANTE;
        const usuario = new Usuario(
          pessoa.nome,
          pessoa.email,
          SENHA_DEMONSTRACAO,
          pessoa.telefone,
          pessoa.cpf,
          pessoa.endereco,
          tipo,
          StatusConta.ATIVO,
        );
        const salvo = await db.usuario.create({
          data: {
            nome: usuario.getNome,
            email: usuario.getEmail,
            senha: await usuario.gerarHashSenha(),
            telefone: usuario.getTelefone,
            cpf: usuario.getCpf,
            endereco: usuario.getEndereco,
            tipoUsuario: tipo,
            statusConta: StatusConta.ATIVO,
            dataCadastro: DATA_DEMONSTRACAO,
            ...(pessoa.perfil
              ? { prestadorPerfil: { create: pessoa.perfil } }
              : {}),
          },
        });
        ids.set(pessoa.email, salvo.idUsuario);
      }
      const id = (email: string) => {
        const valor = ids.get(email);
        if (valor === undefined)
          throw new SeedConfiguracaoError('Pessoa fictícia não encontrada.');
        return valor;
      };
      const ofertas: { idServico: number; precoBase: number }[] = [];
      for (const oferta of servicos) {
        ofertas.push(
          await db.servico.create({
            data: {
              titulo: oferta.titulo,
              descricao: oferta.descricao,
              precoBase: oferta.precoBase,
              prestadorId: id(oferta.prestador),
              status: oferta.ativo ? 'ATIVO' : 'INATIVO',
              dataCadastro: DATA_DEMONSTRACAO,
            },
          }),
        );
      }
      const indicacao = await db.indicacao.create({
        data: {
          indicadorId: id('ana@hive.example.invalid'),
          indicadoId: id('carlos@hive.example.invalid'),
          meioIndicado: 'WHATSAPP',
          statusIndicacao: 'ACEITA',
          observacao: 'Ana indicou Carlos ao grupo do bairro (demonstração).',
          dataIndicado: DATA_DEMONSTRACAO,
        },
      });
      for (const [indice, oferta] of ofertas.slice(0, 2).entries()) {
        const concluida = indice === 0;
        const contrato = await db.contratacao.create({
          data: {
            contratanteId: id('ana@hive.example.invalid'),
            servicoId: oferta.idServico,
            indicacaoId: concluida ? indicacao.idIndicacao : null,
            valor: oferta.precoBase,
            status: concluida ? 'CONCLUIDA' : 'PENDENTE',
            formaPagamento: 'PIX',
            dataContratacao: DATA_DEMONSTRACAO,
            dataVencimento: new Date('2026-09-10T12:00:00.000Z'),
          },
        });
        const fatura = await db.fatura.create({
          data: {
            usuarioId: id('ana@hive.example.invalid'),
            contratacaoId: contrato.idContratacao,
            valorTotal: oferta.precoBase,
            statusPagamento: concluida ? 'PAGO' : 'PENDENTE',
            dataEmissao: DATA_DEMONSTRACAO,
            dataPagamento: concluida ? DATA_DEMONSTRACAO : null,
          },
        });
        if (concluida) {
          await db.avaliacao.create({
            data: {
              contratacaoId: contrato.idContratacao,
              nota: 5,
              comentario: 'Estante montada com cuidado (avaliação fictícia).',
              dataAvaliacao: DATA_DEMONSTRACAO,
            },
          });
          await db.financeiro.create({
            data: {
              contratacaoId: contrato.idContratacao,
              faturaId: fatura.idFatura,
              tipoRegistro: 'RECEITA',
              valor: oferta.precoBase,
              descricao: 'Recebimento da montagem de estante',
              dataRegistro: DATA_DEMONSTRACAO,
            },
          });
        }
      }
      return {
        usuarios: 3,
        prestadores: 2,
        servicos: 3,
        contratacoes: 2,
        indicacoes: 1,
        avaliacoes: 1,
        faturas: 2,
        financeiros: 1,
      };
    },
    { timeout: 30000 },
  );
}
