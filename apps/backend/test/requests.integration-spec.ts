import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { randomUUID, scryptSync } from 'node:crypto';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { criarPrismaClient } from '../src/persistence/prisma-client.factory';
describe('Solicitações: sessão → fluxo completo → PostgreSQL', () => {
  let app: INestApplication<App>, db: PrismaClient;
  let client: number, provider: number, service: number;
  let clientCookie: string, providerCookie: string, thirdCookie: string;
  const password = 'TesteSolicitacoes!2026';
  beforeAll(async () => {
    const url = process.env.TEST_DATABASE_URL;
    if (!url || !/^\/hive_requests_[a-f0-9]+_test$/.test(new URL(url).pathname))
      throw Error('Use npm run test:solicitacoes com banco descartável.');
    db = criarPrismaClient(url);
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaClient)
      .useValue(db)
      .compile();
    app = module.createNestApplication();
    await app.init();
    const salt = 'requests-test';
    const senha =
      'scrypt$' + salt + '$' + scryptSync(password, salt, 64).toString('hex');
    for (const [index, name] of [
      'cliente',
      'prestador',
      'terceiro',
    ].entries()) {
      const user = await db.usuario.create({
        data: {
          nome: name,
          email: name + '@requests.example.invalid',
          senha,
          cpf: '2220000000' + index,
          telefone: '11900000000',
          endereco: 'Rua Fictícia, 1',
          tipoUsuario: name === 'prestador' ? 'PRESTADOR' : 'CONTRATANTE',
          statusConta: 'ATIVO',
        },
      });
      const res = await request(app.getHttpServer())
        .post('/login')
        .set('X-Hive-Request', '1')
        .send({ email: user.email, senha: password })
        .expect(201);
      const cookie = (
        res.headers['set-cookie'] as unknown as string[]
      )[0].split(';')[0];
      if (name === 'cliente') {
        client = user.idUsuario;
        clientCookie = cookie;
      } else if (name === 'prestador') {
        provider = user.idUsuario;
        providerCookie = cookie;
      } else thirdCookie = cookie;
    }
    await db.prestador.create({
      data: {
        idPrestador: provider,
        areaAtuacao: 'Reparos',
        experiencia: 'Demonstração',
        certificacoes: [],
        cnpj: '22200000000001',
      },
    });
    service = (
      await db.servico.create({
        data: {
          titulo: 'Montar estante',
          descricao: 'Serviço fictício',
          precoBase: 125,
          prestadorId: provider,
        },
      })
    ).idServico;
  });
  afterAll(async () => {
    await app?.close();
    await db?.$disconnect();
  });
  const post = (cookie: string, path: string, body: unknown) =>
    request(app.getHttpServer())
      .post(path)
      .set('Cookie', cookie)
      .set('X-Hive-Request', '1')
      .send(body as object);
  const get = (cookie: string, path: string) =>
    request(app.getHttpServer()).get(path).set('Cookie', cookie);
  const create = () =>
    post(clientCookie, '/solicitacoes', {
      servicoId: service,
      formaPagamento: 'PIX',
      chave: randomUUID(),
    });
  it('exige sessão, valida dados e bloqueia identidade/preço forjados', async () => {
    await request(app.getHttpServer()).get('/solicitacoes').expect(401);
    await request(app.getHttpServer())
      .post('/solicitacoes')
      .set('Cookie', clientCookie)
      .send({})
      .expect(403);
    await post(clientCookie, '/solicitacoes', {
      servicoId: service,
      formaPagamento: 'PIX',
      chave: randomUUID(),
      valor: 1,
      contratanteId: provider,
    }).expect(400);
    await get(clientCookie, '/solicitacoes?status=INVALIDO').expect(400);
    await get(clientCookie, '/solicitacoes?pagina=0').expect(400);
    await post(providerCookie, '/solicitacoes', {
      servicoId: service,
      formaPagamento: 'PIX',
      chave: randomUUID(),
    }).expect(400);
  });
  it('cria uma única solicitação por chave, fixa preço e isola contas', async () => {
    const body = {
      servicoId: service,
      formaPagamento: 'PIX',
      chave: randomUUID(),
    };
    const results = await Promise.all([
      post(clientCookie, '/solicitacoes', body),
      post(clientCookie, '/solicitacoes', body),
    ]);
    expect(results.map((r) => r.status)).toEqual([201, 201]);
    const row = results[0].body as { idContratacao: number; valor: number };
    expect(results[1].body).toMatchObject({
      idContratacao: row.idContratacao,
      status: 'PENDENTE',
      valor: 125,
    });
    expect(await db.contratacao.count({ where: { chave: body.chave } })).toBe(
      1,
    );
    await db.servico.update({
      where: { idServico: service },
      data: { precoBase: 160 },
    });
    const details = await get(
      clientCookie,
      '/solicitacoes/' + row.idContratacao,
    ).expect(200);
    expect(details.body).toMatchObject({ valor: 125 });
    expect(JSON.stringify(details.body)).not.toMatch(
      /senha|cpf|email|tokenHash/,
    );
    await get(thirdCookie, '/solicitacoes/' + row.idContratacao).expect(404);
    expect(
      (await get(thirdCookie, '/solicitacoes').expect(200)).body,
    ).toMatchObject({ itens: [], total: 0 });
    await post(clientCookie, '/solicitacoes', {
      ...body,
      formaPagamento: 'BOLETO',
    }).expect(409);
  });
  it('cliente solicita, prestador aceita e conclui; histórico é atualizado', async () => {
    const row = (await create().expect(201)).body as { idContratacao: number };
    const base = '/solicitacoes/' + row.idContratacao;
    await post(clientCookie, base + '/acao', { acao: 'ACEITAR' }).expect(403);
    await post(thirdCookie, base + '/acao', { acao: 'CANCELAR' }).expect(404);
    await post(providerCookie, base + '/acao', { acao: 'CONCLUIR' }).expect(
      409,
    );
    await post(providerCookie, base + '/acao', { acao: 'ACEITAR' }).expect(201);
    await post(clientCookie, base + '/acao', { acao: 'CONCLUIR' }).expect(403);
    await post(providerCookie, base + '/acao', { acao: 'CONCLUIR' }).expect(
      201,
    );
    expect((await get(clientCookie, base).expect(200)).body).toMatchObject({
      status: 'CONCLUIDA',
      acoes: [],
    });
    await post(clientCookie, base + '/acao', { acao: 'CANCELAR' }).expect(409);
    expect(
      (await get(clientCookie, '/contratacoes/anteriores').expect(200)).body,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ prestadorId: provider }),
      ]),
    );
  });
  it('recusa e cancelamento respeitam estado e protegem pagamentos', async () => {
    const refused = (await create()).body as { idContratacao: number };
    await post(providerCookie, `/solicitacoes/${refused.idContratacao}/acao`, {
      acao: 'RECUSAR',
    }).expect(201);
    const canceled = (await create()).body as { idContratacao: number };
    await post(clientCookie, `/solicitacoes/${canceled.idContratacao}/acao`, {
      acao: 'CANCELAR',
    }).expect(201);
    const paid = (await create()).body as { idContratacao: number };
    await db.fatura.create({
      data: {
        usuarioId: client,
        contratacaoId: paid.idContratacao,
        valorTotal: 160,
        statusPagamento: 'PAGO',
      },
    });
    await post(clientCookie, `/solicitacoes/${paid.idContratacao}/acao`, {
      acao: 'CANCELAR',
    }).expect(409);
    await post(providerCookie, `/solicitacoes/${paid.idContratacao}/acao`, {
      acao: 'RECUSAR',
    }).expect(409);
    const pending = (await create()).body as { idContratacao: number };
    await db.fatura.create({
      data: {
        usuarioId: client,
        contratacaoId: pending.idContratacao,
        valorTotal: 160,
        statusPagamento: 'PENDENTE',
      },
    });
    await post(providerCookie, `/solicitacoes/${pending.idContratacao}/acao`, {
      acao: 'ACEITAR',
    }).expect(201);
    await post(clientCookie, `/solicitacoes/${pending.idContratacao}/acao`, {
      acao: 'CANCELAR',
    }).expect(201);
    expect(
      (
        await db.fatura.findUniqueOrThrow({
          where: { contratacaoId: pending.idContratacao },
        })
      ).statusPagamento,
    ).toBe('CANCELADO');
  });
  it('filtra pedidos recebidos, pagina e abre a mesma conversa nos dois sentidos', async () => {
    const res = await get(
      providerCookie,
      '/solicitacoes?papel=prestador&status=PENDENTE&limite=1',
    ).expect(200);
    const page = res.body as {
      itens: { idContratacao: number }[];
      total: number;
    };
    expect(page.itens).toHaveLength(1);
    expect(page.total).toBeGreaterThan(0);
    const id = page.itens[0].idContratacao;
    const a = await post(
      providerCookie,
      `/solicitacoes/${id}/conversa`,
      {},
    ).expect(201);
    const b = await post(
      clientCookie,
      `/solicitacoes/${id}/conversa`,
      {},
    ).expect(201);
    expect(a.body).toEqual(b.body);
    await post(thirdCookie, `/solicitacoes/${id}/conversa`, {}).expect(404);
  });
  it('duas ações concorrentes não sobrescrevem um estado final', async () => {
    const row = (await create()).body as { idContratacao: number };
    const res = await Promise.all([
      post(providerCookie, `/solicitacoes/${row.idContratacao}/acao`, {
        acao: 'ACEITAR',
      }),
      post(providerCookie, `/solicitacoes/${row.idContratacao}/acao`, {
        acao: 'RECUSAR',
      }),
    ]);
    expect(res.filter((r) => r.status === 201)).toHaveLength(1);
    expect(res.filter((r) => r.status === 409)).toHaveLength(1);
  });
});
