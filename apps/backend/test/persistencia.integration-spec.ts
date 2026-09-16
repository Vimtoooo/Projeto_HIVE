/**
 * Integração real: classes de models -> persistência -> Prisma -> MySQL.
 * Criado antes da implementação. Não usa mocks de banco nem o seed destrutivo.
 * Requer TEST_DATABASE_URL em um banco exclusivo cujo nome termine em _test.
 * Confirma o commit por uma segunda conexão e remove somente os dados desta execução.
 */
import 'dotenv/config';
import { randomInt, randomUUID, scryptSync } from 'node:crypto';
import {
  FormaPagamento,
  MeioIndicado,
  StatusConta,
  StatusIndicado,
  StatusPagamento,
  TipoRegistro,
  TipoUsuario,
  PrismaClient,
} from '@prisma/client';
import { Usuario } from '../src/models/Usuario';
import { Prestador } from '../src/models/Prestador';
import { Indicacao } from '../src/models/Indicacao';
import { Avaliacao } from '../src/models/Avaliacao';
import { criarPrismaClient } from '../src/persistence/prisma-client.factory';
import { PersistenciaService } from '../src/persistence/persistencia.service';
import { limparDados } from './support/limpar-dados';

describe('Persistência das classes de domínio (banco real)', () => {
  let prisma: PrismaClient;
  let leitura: PrismaClient;
  let persistencia: PersistenciaService;
  const sufixo = randomUUID();
  const emails: string[] = [];

  function usuario(
    rotulo: string,
    cpf = String(randomInt(10_000_000_000, 99_999_999_999)),
  ) {
    const email = `${rotulo}.${sufixo}@example.invalid`;
    emails.push(email);
    return new Usuario(
      'Cliente Fictício',
      email,
      'SenhaFicticia!123',
      '11999990000',
      cpf,
      'Rua de Testes, 100',
      TipoUsuario.CONTRATANTE,
      StatusConta.ATIVO,
    );
  }

  beforeAll(async () => {
    const url = process.env.TEST_DATABASE_URL;
    if (!url || !new URL(url).pathname.endsWith('_test')) {
      throw new Error(
        'Defina TEST_DATABASE_URL para um banco exclusivo com nome terminado em _test.',
      );
    }
    if (url === process.env.DATABASE_URL) {
      throw new Error(
        'O banco de testes não pode ser o DATABASE_URL da aplicação.',
      );
    }
    prisma = criarPrismaClient(url);
    leitura = criarPrismaClient(url);
    persistencia = new PersistenciaService(prisma);
    await prisma.$connect();
    await leitura.$connect();
  });

  afterAll(async () => {
    try {
      if (prisma) {
        if (process.env.HIVE_PRESERVAR_TESTE === '1') {
          console.log(`Dados preservados. ID da execução: ${sufixo}`);
          console.log(
            `Para limpar: npm run test:persistencia:limpar -- ${sufixo}`,
          );
        } else {
          await limparDados(prisma, emails);
        }
      }
    } finally {
      await prisma?.$disconnect();
      await leitura?.$disconnect();
    }
  });

  it('grava as oito entidades e preserva valores, datas e FKs após o commit', async () => {
    const cliente = usuario('cliente');
    const email = `prestador.${sufixo}@example.invalid`;
    emails.push(email);
    const prestador = new Prestador(
      'Prestador Fictício',
      email,
      'SenhaFicticia!123',
      '11988880000',
      String(randomInt(10_000_000_000, 99_999_999_999)),
      'Rua de Testes, 200',
      TipoUsuario.PRESTADOR,
      StatusConta.ATIVO,
      'Marcenaria',
      'Experiência fictícia',
      ['Curso fictício'],
      String(randomInt(10_000_000_000_000, 99_999_999_999_999)),
    );
    const servico = prestador.cadastrarServico(
      'Montagem de mesa',
      'Serviço fictício para integração',
      200,
    );
    const indicacao = new Indicacao(
      cliente,
      prestador,
      MeioIndicado.WHATSAPP,
      'Indicação fictícia',
      StatusIndicado.ACEITA,
    );
    const contrato = cliente.solicitarContratacao(
      servico,
      200,
      FormaPagamento.PIX,
    );
    contrato.setIndicacao = indicacao;
    contrato.concluir();
    const fatura = contrato.gerarFatura();
    const dataPagamento = new Date('2026-09-15T12:00:00.000Z');
    fatura.registrarPagamento(dataPagamento, FormaPagamento.PIX);
    const avaliacao = new Avaliacao(contrato, 4.5, 'Avaliação fictícia');
    const receita = prestador.registrarFinanceiro(
      contrato,
      TipoRegistro.RECEITA,
      190,
      'Receita fictícia',
      fatura,
    );
    const despesa = prestador.registrarFinanceiro(
      contrato,
      TipoRegistro.DESPESA,
      30,
      'Material fictício',
    );

    const ids = await persistencia.executar(async (repositorio) => {
      const u = await repositorio.criarUsuario(cliente);
      const p = await repositorio.criarPrestador(prestador);
      const s = await repositorio.criarServico(servico);
      const i = await repositorio.criarIndicacao(indicacao);
      const c = await repositorio.criarContratacao(contrato);
      const f = await repositorio.criarFatura(fatura);
      const a = await repositorio.criarAvaliacao(avaliacao);
      const r = await repositorio.criarFinanceiro(receita);
      const d = await repositorio.criarFinanceiro(despesa);
      return { u, p, s, i, c, f, a, r, d };
    });

    const salvo = await leitura.contratacao.findUniqueOrThrow({
      where: { idContratacao: ids.c.idContratacao },
      include: {
        contratante: true,
        servico: { include: { prestador: { include: { usuario: true } } } },
        indicacao: true,
        fatura: true,
        avaliacao: true,
        financeiros: true,
      },
    });
    expect(salvo.contratante.email).toBe(cliente.getEmail);
    expect(salvo.contratante.senha).not.toBe('SenhaFicticia!123');
    expect(salvo.contratante.senha).toMatch(/^scrypt\$/);
    const [, salt, hash] = salvo.contratante.senha.split('$');
    expect(scryptSync('SenhaFicticia!123', salt, 64).toString('hex')).toBe(
      hash,
    );
    expect(salvo.servico.prestador.idPrestador).toBe(
      salvo.servico.prestador.usuario.idUsuario,
    );
    expect(salvo.servico.prestador.certificacoes).toEqual(['Curso fictício']);
    expect(salvo.servicoId).toBe(ids.s.idServico);
    expect(salvo.contratanteId).toBe(ids.u.idUsuario);
    expect(salvo.indicacao?.indicadoId).toBe(ids.p.idPrestador);
    expect(salvo.indicacao?.indicadorId).toBe(ids.u.idUsuario);
    expect(salvo.indicacaoId).toBe(ids.i.idIndicacao);
    expect(salvo.indicacao?.meioIndicado).toBe(MeioIndicado.WHATSAPP);
    expect(salvo.indicacao?.dataIndicado).toEqual(indicacao.getDataIndicado);
    expect(salvo.dataContratacao).toEqual(contrato.getDataContratacao);
    expect(salvo.status).toBe('CONCLUIDA');
    expect(salvo.valor).toBe(200);
    expect(salvo.fatura?.valorTotal).toBe(190);
    expect(salvo.fatura?.usuarioId).toBe(ids.u.idUsuario);
    expect(salvo.fatura?.dataPagamento).toEqual(dataPagamento);
    expect(salvo.fatura?.statusPagamento).toBe(StatusPagamento.PAGO);
    expect(salvo.avaliacao?.nota).toBe(4.5);
    expect(salvo.financeiros).toHaveLength(2);
    expect(
      salvo.financeiros.find((r) => r.tipoRegistro === TipoRegistro.RECEITA)
        ?.faturaId,
    ).toBe(ids.f.idFatura);
    expect(
      salvo.financeiros.find((r) => r.tipoRegistro === TipoRegistro.DESPESA)
        ?.faturaId,
    ).toBeNull();
    expect(salvo.contratante.dataCadastro).toEqual(cliente.getDataCadastro);
  });

  it('não usa contadores de IDs em memória como PK do banco', async () => {
    const cliente = usuario('identidade');
    // Ocupa o ID local de propósito. Um mapper que copie esse ID para o banco falha.
    const existente = await leitura.usuario.findUnique({
      where: { idUsuario: cliente.getIdUsuario },
    });
    if (!existente) {
      const sentinela = usuario('sentinela');
      await prisma.usuario.create({
        data: {
          idUsuario: cliente.getIdUsuario,
          nome: sentinela.getNome,
          email: sentinela.getEmail,
          senha: await sentinela.gerarHashSenha(),
          telefone: sentinela.getTelefone,
          cpf: sentinela.getCpf,
          endereco: sentinela.getEndereco,
          tipoUsuario: sentinela.getTipoUsuario,
          statusConta: sentinela.getStatusConta,
        },
      });
    }
    const salvo = await persistencia.executar((r) => r.criarUsuario(cliente));
    expect(salvo.idUsuario).not.toBe(cliente.getIdUsuario);
    expect(
      await leitura.usuario.findUnique({
        where: { idUsuario: salvo.idUsuario },
      }),
    ).toMatchObject({ email: cliente.getEmail });
    // Criar uma segunda instância com o mesmo email deve falhar, nunca sobrescrever.
    const duplicado = usuario('identidade');
    await expect(
      persistencia.executar((r) => r.criarUsuario(duplicado)),
    ).rejects.toMatchObject({ code: 'P2002' });
    expect(
      await leitura.usuario.count({ where: { email: cliente.getEmail } }),
    ).toBe(1);
  });

  it('desfaz todos os inserts se uma etapa falhar por duplicidade', async () => {
    const primeiro = usuario('rollback-a');
    const segundo = usuario('rollback-b', primeiro.getCpf);
    await expect(
      persistencia.executar(async (r) => {
        await r.criarUsuario(primeiro);
        await r.criarUsuario(segundo);
      }),
    ).rejects.toMatchObject({ code: 'P2002' });
    expect(
      await leitura.usuario.count({
        where: { email: { in: [primeiro.getEmail, segundo.getEmail] } },
      }),
    ).toBe(0);
  });

  it('recusa relações não persistidas e desfaz a transação', async () => {
    const cliente = usuario('relacao');
    const email = `ausente.${sufixo}@example.invalid`;
    const prestador = new Prestador(
      'Prestador Ausente',
      email,
      'SenhaFicticia!123',
      '11977770000',
      '12345678901',
      'Rua Fictícia, 1',
      TipoUsuario.PRESTADOR,
      StatusConta.ATIVO,
      'Marcenaria',
      'Experiência fictícia',
      ['Habilidade'],
      '12345678000199',
    );
    const servico = prestador.cadastrarServico(
      'Serviço sem pai',
      'Relação ainda não salva',
      100,
    );
    await expect(
      persistencia.executar(async (r) => {
        await r.criarUsuario(cliente);
        await r.criarServico(servico);
      }),
    ).rejects.toThrow('Prestador ainda não foi persistido nesta transação');
    expect(
      await leitura.usuario.count({ where: { email: cliente.getEmail } }),
    ).toBe(0);
  });

  it('não insere duas vezes o mesmo objeto na mesma transação', async () => {
    const cliente = usuario('repetido');
    await expect(
      persistencia.executar(async (r) => {
        await r.criarUsuario(cliente);
        await r.criarUsuario(cliente);
      }),
    ).rejects.toThrow('Objeto já persistido');
    expect(
      await leitura.usuario.count({ where: { email: cliente.getEmail } }),
    ).toBe(0);
  });
});
