import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { randomUUID, scryptSync } from 'node:crypto';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { criarPrismaClient } from '../src/persistence/prisma-client.factory';
import { converterContas, diagnosticarContas } from '../scripts/conta-unica';

describe('Conta única em PostgreSQL descartável', () => {
  let app: INestApplication<App>,
    db: PrismaClient,
    next = 100;
  const password = 'ContaUnica!2026';
  const senha =
    'scrypt$account$' + scryptSync(password, 'account', 64).toString('hex');
  const profissional = (cnpj: string) => ({
    cnpj,
    areaAtuacao: 'Elétrica',
    experiencia: 'Instalações residenciais',
    servico: {
      titulo: 'Instalação elétrica',
      descricao: 'Instalar tomada',
      precoBase: 150,
    },
  });
  beforeAll(async () => {
    const url = process.env.TEST_DATABASE_URL;
    if (!url || !/^\/hive_account_[a-f0-9]+_test$/.test(new URL(url).pathname))
      throw Error('Use npm run test:conta-unica.');
    db = criarPrismaClient(url);
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaClient)
      .useValue(db)
      .compile();
    app = module.createNestApplication();
    await app.init();
  });
  afterAll(async () => {
    await app?.close();
    await db?.$disconnect();
  });
  const post = (path: string, body: object, cookie = '') =>
    request(app.getHttpServer())
      .post(path)
      .set('X-Hive-Request', '1')
      .set('Cookie', cookie)
      .send(body);
  async function conta(
    tipoUsuario: 'CONTRATANTE' | 'PRESTADOR' | 'AMBOS' = 'CONTRATANTE',
  ) {
    const n = ++next;
    const usuario = await db.usuario.create({
      data: {
        nome: 'Pessoa Teste',
        email: `conta${n}@example.invalid`,
        senha,
        cpf: String(n).padStart(11, '0'),
        telefone: '11999998888',
        endereco: 'Rua de Teste',
        tipoUsuario,
        statusConta: 'ATIVO',
      },
    });
    const login = await post('/login', {
      email: usuario.email,
      senha: password,
    }).expect(201);
    const cookie = (
      login.headers['set-cookie'] as unknown as string[]
    )[0].split(';')[0];
    return { usuario, cookie };
  }
  const sessao = (cookie: string) =>
    request(app.getHttpServer()).get('/sessao').set('Cookie', cookie);

  it('cadastro direto continua atômico, cria AMBOS e permite omissão de certificações', async () => {
    const dados = {
      ...profissional('10000000000001'),
      nome: 'Ana Teste',
      email: 'direto@example.invalid',
      senha: password,
      cpf: '10000000001',
      telefone: '11999998888',
      endereco: 'Rua Direta',
    };
    const res = await post('/prestadores', dados).expect(201);
    const id = (res.body as { prestador: { idPrestador: number } }).prestador
      .idPrestador;
    expect(
      await db.usuario.findUnique({ where: { idUsuario: id } }),
    ).toMatchObject({ tipoUsuario: 'AMBOS' });
    expect(
      await db.prestador.findUnique({ where: { idPrestador: id } }),
    ).toMatchObject({ certificacoes: [] });
    expect(
      (
        await post('/login', { email: dados.email, senha: password }).expect(
          201,
        )
      ).body as unknown,
    ).toMatchObject({ possuiPerfilProfissional: true });
    await post('/prestadores', {
      ...dados,
      email: 'outro@example.invalid',
      cpf: '10000000002',
    }).expect(409);
    expect(
      await db.usuario.count({ where: { email: 'outro@example.invalid' } }),
    ).toBe(0);
  });

  it('ativação preserva identidade, senha, sessão e relações; duas chamadas criam um único perfil/serviço', async () => {
    const a = await conta(),
      b = await conta();
    const servicoB = await post(
      '/perfil/prestador',
      profissional('10000000000002'),
      b.cookie,
    ).expect(201);
    const servicoId = (servicoB.body as { idServico: number }).idServico;
    const pedido = await db.contratacao.create({
      data: {
        contratanteId: a.usuario.idUsuario,
        servicoId,
        valor: 150,
        formaPagamento: 'PIX',
        status: 'CONCLUIDA',
        avaliacao: { create: { nota: 5 } },
      },
    });
    await db.favorito.create({
      data: {
        usuarioId: a.usuario.idUsuario,
        prestadorId: b.usuario.idUsuario,
      },
    });
    const conversa = await db.conversa.create({
      data: {
        clienteId: a.usuario.idUsuario,
        prestadorId: b.usuario.idUsuario,
        mensagens: {
          create: {
            remetenteId: a.usuario.idUsuario,
            conteudo: 'Olá',
            chave: randomUUID(),
          },
        },
      },
    });
    await db.notificacao.create({
      data: {
        usuarioId: a.usuario.idUsuario,
        tipo: 'SOLICITACAO_CONCLUIDA',
        chaveEvento: 'historico',
        titulo: 'Histórico',
        descricao: 'Pedido concluído',
        contratacaoId: pedido.idContratacao,
      },
    });
    const before = await db.usuario.findUniqueOrThrow({
      where: { idUsuario: a.usuario.idUsuario },
      include: {
        sessoes: true,
        favoritos: true,
        notificacoes: true,
        contratacoes: { include: { avaliacao: true } },
        conversasCliente: { include: { mensagens: true } },
      },
    });
    const results = await Promise.all([
      post('/perfil/prestador', profissional('10000000000003'), a.cookie),
      post('/perfil/prestador', profissional('10000000000003'), a.cookie),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
    expect(
      results.find((r) => r.status === 409)?.body as unknown,
    ).toMatchObject({ code: 'PERFIL_PROFISSIONAL_EXISTENTE' });
    await post(
      '/perfil/prestador',
      profissional('10000000000004'),
      a.cookie,
    ).expect(409);
    expect(
      await db.servico.count({ where: { prestadorId: a.usuario.idUsuario } }),
    ).toBe(1);
    const after = await db.usuario.findUniqueOrThrow({
      where: { idUsuario: a.usuario.idUsuario },
      include: {
        sessoes: true,
        favoritos: true,
        notificacoes: true,
        contratacoes: { include: { avaliacao: true } },
        conversasCliente: { include: { mensagens: true } },
      },
    });
    expect(after).toEqual({ ...before, tipoUsuario: 'AMBOS' });
    expect(after.conversasCliente[0].id).toBe(conversa.id);
    expect((await sessao(a.cookie).expect(200)).body as unknown).toMatchObject({
      idUsuario: a.usuario.idUsuario,
      tipoUsuario: 'AMBOS',
      possuiPerfilProfissional: true,
    });
    expect(
      (
        await request(app.getHttpServer())
          .get('/perfil')
          .set('Cookie', a.cookie)
          .expect(200)
      ).body as unknown,
    ).toMatchObject({ possuiPerfilProfissional: true });
  });

  it('valida contrato, documentos, campos privados, sessão e CNPJ duplicado sem estado parcial', async () => {
    const a = await conta();
    const input = profissional('10000000000001');
    await post('/perfil/prestador', input, a.cookie)
      .expect(409)
      .expect((r) =>
        expect(r.body as unknown).toMatchObject({ code: 'CNPJ_DUPLICADO' }),
      );
    for (const patch of [
      { cnpj: undefined },
      { certificacoes: null },
      { certificacoes: '' },
      { certificacoes: [''] },
      { certificacoes: [' '] },
      { certificacoes: Array(21).fill('Curso') },
      { certificacoes: ['x'.repeat(192)] },
      { idUsuario: 1 },
      { senha: 'OutraSenha' },
      { tipoUsuario: 'AMBOS' },
      { possuiPerfilProfissional: true },
      { servico: { titulo: 'x' } },
    ]) {
      await post('/perfil/prestador', { ...input, ...patch }, a.cookie).expect(
        400,
      );
    }
    await post('/perfil/prestador', input).expect(401);
    await request(app.getHttpServer())
      .post('/perfil/prestador')
      .set('Cookie', a.cookie)
      .send(input)
      .expect(403);
    expect(
      await db.prestador.count({ where: { idPrestador: a.usuario.idUsuario } }),
    ).toBe(0);
    expect(
      await db.usuario.findUnique({
        where: { idUsuario: a.usuario.idUsuario },
      }),
    ).toMatchObject({ tipoUsuario: 'CONTRATANTE' });
    await db.usuario.update({
      where: { idUsuario: a.usuario.idUsuario },
      data: { statusConta: 'INATIVO' },
    });
    await post('/perfil/prestador', input, a.cookie).expect(401);
  });

  it('falha no primeiro serviço desfaz perfil e mudança de tipo', async () => {
    const a = await conta();
    // Fail inside PostgreSQL after creating the profile, not before validation.
    await db.$executeRawUnsafe(
      `CREATE FUNCTION account_test_fail() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.titulo = 'Falha controlada' THEN RAISE EXCEPTION 'teste'; END IF; RETURN NEW; END $$`,
    );
    await db.$executeRawUnsafe(
      'CREATE TRIGGER account_test_fail BEFORE INSERT ON "Servico" FOR EACH ROW EXECUTE FUNCTION account_test_fail()',
    );
    try {
      const input = profissional('10000000000005');
      input.servico.titulo = 'Falha controlada';
      await post('/perfil/prestador', input, a.cookie).expect(503);
      expect(
        await db.prestador.count({
          where: { idPrestador: a.usuario.idUsuario },
        }),
      ).toBe(0);
      expect(
        await db.usuario.findUnique({
          where: { idUsuario: a.usuario.idUsuario },
        }),
      ).toMatchObject({ tipoUsuario: 'CONTRATANTE' });
    } finally {
      await db.$executeRawUnsafe('DROP TRIGGER account_test_fail ON "Servico"');
      await db.$executeRawUnsafe('DROP FUNCTION account_test_fail()');
    }
  });

  it('profissionais contratam reciprocamente, com autorização por participante e conversas direcionais', async () => {
    const a = await conta(),
      b = await conta(),
      terceiro = await conta();
    const sa = (
      await post(
        '/perfil/prestador',
        profissional('10000000000006'),
        a.cookie,
      ).expect(201)
    ).body as { idServico: number };
    const sb = (
      await post(
        '/perfil/prestador',
        { ...profissional('10000000000007'), certificacoes: [] },
        b.cookie,
      ).expect(201)
    ).body as { idServico: number };
    await db.usuario.update({
      where: { idUsuario: a.usuario.idUsuario },
      data: { tipoUsuario: 'PRESTADOR' },
    });
    const criar = (servicoId: number) => ({
      servicoId,
      formaPagamento: 'PIX',
      chave: randomUUID(),
    });
    await post('/solicitacoes', criar(sa.idServico), a.cookie).expect(400);
    const ab = (
      await post('/solicitacoes', criar(sb.idServico), a.cookie).expect(201)
    ).body as { idContratacao: number };
    const ba = (
      await post('/solicitacoes', criar(sa.idServico), b.cookie).expect(201)
    ).body as { idContratacao: number };
    await post(
      `/solicitacoes/${ab.idContratacao}/acao`,
      { acao: 'ACEITAR' },
      a.cookie,
    ).expect(403);
    await request(app.getHttpServer())
      .get(`/solicitacoes/${ab.idContratacao}`)
      .set('Cookie', terceiro.cookie)
      .expect(404);
    for (const acao of ['ACEITAR', 'CONCLUIR'])
      await post(
        `/solicitacoes/${ab.idContratacao}/acao`,
        { acao },
        b.cookie,
      ).expect(201);
    await post(
      `/solicitacoes/${ab.idContratacao}/avaliacao`,
      { nota: 5 },
      b.cookie,
    ).expect(403);
    await post(
      `/solicitacoes/${ab.idContratacao}/avaliacao`,
      { nota: 5 },
      a.cookie,
    ).expect(201);
    await post(
      `/solicitacoes/${ab.idContratacao}/conversa`,
      {},
      a.cookie,
    ).expect(201);
    await post(
      `/solicitacoes/${ba.idContratacao}/conversa`,
      {},
      b.cookie,
    ).expect(201);
    expect(
      await db.conversa.count({
        where: {
          OR: [
            {
              clienteId: a.usuario.idUsuario,
              prestadorId: b.usuario.idUsuario,
            },
            {
              clienteId: b.usuario.idUsuario,
              prestadorId: a.usuario.idUsuario,
            },
          ],
        },
      }),
    ).toBe(2);
  });

  it('diagnóstico é somente leitura e conversão é seletiva/idempotente, preservando sessão', async () => {
    const valido = await conta(),
      semPerfil = await conta('AMBOS'),
      semServico = await conta('PRESTADOR');
    await post(
      '/perfil/prestador',
      profissional('10000000000008'),
      valido.cookie,
    ).expect(201);
    await db.usuario.update({
      where: { idUsuario: valido.usuario.idUsuario },
      data: { tipoUsuario: 'PRESTADOR' },
    });
    await db.prestador.create({
      data: {
        idPrestador: semServico.usuario.idUsuario,
        cnpj: '10000000000009',
        areaAtuacao: 'Pintura',
        experiencia: 'Experiência',
        certificacoes: [],
      },
    });
    const antes = await diagnosticarContas(db);
    expect(antes.elegiveis).toContain(valido.usuario.idUsuario);
    expect(antes.inconsistencias.map((i) => i.idUsuario)).toEqual(
      expect.arrayContaining([
        semPerfil.usuario.idUsuario,
        semServico.usuario.idUsuario,
      ]),
    );
    expect(
      await db.usuario.findUnique({
        where: { idUsuario: valido.usuario.idUsuario },
      }),
    ).toMatchObject({ tipoUsuario: 'PRESTADOR' });
    expect((await converterContas(db)).idsConvertidos).toContain(
      valido.usuario.idUsuario,
    );
    expect((await converterContas(db)).convertidas).toBe(0);
    expect(
      (await sessao(valido.cookie).expect(200)).body as unknown,
    ).toMatchObject({ tipoUsuario: 'AMBOS', possuiPerfilProfissional: true });
    expect(
      (await sessao(semPerfil.cookie).expect(200)).body as unknown,
    ).toMatchObject({ possuiPerfilProfissional: false });
    expect(
      await db.usuario.findUnique({
        where: { idUsuario: semServico.usuario.idUsuario },
      }),
    ).toMatchObject({ tipoUsuario: 'PRESTADOR' });
  });
});
