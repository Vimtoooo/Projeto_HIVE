import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { scryptSync } from 'node:crypto';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { NotificationsService } from '../src/notifications/notifications.service';
import { criarPrismaClient } from '../src/persistence/prisma-client.factory';
describe('Avaliações definitivas de serviços concluídos', () => {
  let app: INestApplication<App>, db: PrismaClient;
  const ids: number[] = [],
    cookies: string[] = [];
  const login = async (i: number) => {
    const res = await request(app.getHttpServer())
      .post('/login')
      .set('X-Hive-Request', '1')
      .send({ email: `fav${i}@example.invalid`, senha: 'Favoritos!2026' })
      .expect(201);
    return (res.headers['set-cookie'] as unknown as string[])[0].split(';')[0];
  };
  beforeAll(async () => {
    const url = process.env.TEST_DATABASE_URL;
    if (!url || !/^\/hive_reviews_[a-f0-9]+_test$/.test(new URL(url).pathname))
      throw Error('Use npm run test:avaliacoes.');
    db = criarPrismaClient(url);
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaClient)
      .useValue(db)
      .compile();
    app = module.createNestApplication();
    await app.init();
    for (let i = 0; i < 4; i++) {
      const u = await db.usuario.create({
        data: {
          nome: 'Pessoa ' + i,
          email: `fav${i}@example.invalid`,
          senha:
            'scrypt$fav$' +
            scryptSync('Favoritos!2026', 'fav', 64).toString('hex'),
          cpf: '3330000000' + i,
          telefone: '11900000000',
          endereco: 'Endereço privado',
          tipoUsuario: i < 2 ? 'CONTRATANTE' : 'PRESTADOR',
          statusConta: 'ATIVO',
        },
      });
      ids.push(u.idUsuario);
      cookies.push(await login(i));
      if (i >= 2)
        await db.prestador.create({
          data: {
            idPrestador: u.idUsuario,
            areaAtuacao: 'Reparos',
            experiencia: 'Experiência',
            certificacoes: [],
            cnpj: '3330000000000' + i,
            servicos: {
              create: {
                titulo: 'Reparo',
                descricao: 'Serviço de teste',
                precoBase: 50,
              },
            },
          },
        });
    }
  });
  afterAll(async () => {
    await app?.close();
    await db?.$disconnect();
  });

  async function order(
    status:
      | 'PENDENTE'
      | 'EM_ANDAMENTO'
      | 'CONCLUIDA'
      | 'CANCELADA' = 'CONCLUIDA',
  ) {
    const service = await db.servico.findFirstOrThrow({
      where: { prestadorId: ids[2] },
    });
    return db.contratacao.create({
      data: {
        contratanteId: ids[0],
        servicoId: service.idServico,
        status,
        valor: 50,
        formaPagamento: 'PIX',
      },
    });
  }
  const review = (id: number, body: object = { nota: 5 }, actor = 0) =>
    request(app.getHttpServer())
      .post(`/solicitacoes/${id}/avaliacao`)
      .set('Cookie', cookies[actor])
      .set('X-Hive-Request', '1')
      .send(body);
  it('exige sessão, proteção de escrita e campos válidos, sem aceitar identidade externa', async () => {
    const row = await order();
    await request(app.getHttpServer())
      .post(`/solicitacoes/${row.idContratacao}/avaliacao`)
      .send({ nota: 5 })
      .expect(403);
    await request(app.getHttpServer())
      .post(`/solicitacoes/${row.idContratacao}/avaliacao`)
      .set('X-Hive-Request', '1')
      .send({ nota: 5 })
      .expect(401);
    await request(app.getHttpServer())
      .post(`/solicitacoes/${row.idContratacao}/avaliacao`)
      .set('Cookie', cookies[0])
      .send({ nota: 5 })
      .expect(403);
    for (const body of [
      { nota: 0 },
      { nota: 6 },
      { nota: 4.5 },
      { nota: '5' },
      { nota: 5, comentario: 42 },
      { nota: 5, comentario: 'a'.repeat(1001) },
      { nota: 5, usuarioId: ids[1] },
      {},
    ])
      await review(row.idContratacao, body).expect(400);
    expect(await db.avaliacao.count()).toBe(0);
  });
  it('somente o contratante pode avaliar seu pedido concluído', async () => {
    const row = await order();
    await review(row.idContratacao, { nota: 5 }, 1).expect(404);
    await review(row.idContratacao, { nota: 5 }, 2).expect(403);
    for (const status of ['PENDENTE', 'EM_ANDAMENTO', 'CANCELADA'] as const)
      await review((await order(status)).idContratacao).expect(409);
  });
  it('envios concorrentes iguais são idempotentes, avaliação final e notificação única', async () => {
    const row = await order();
    const body = { nota: 5, comentario: '  Serviço excelente!  ' };
    await Promise.all([
      review(row.idContratacao, body).expect(201),
      review(row.idContratacao, body).expect(201),
    ]);
    const first = await db.avaliacao.findUniqueOrThrow({
      where: { contratacaoId: row.idContratacao },
    });
    expect(first.comentario).toBe('Serviço excelente!');
    await review(row.idContratacao, { nota: 4, comentario: 'Alterado' }).expect(
      409,
    );
    expect(
      await db.avaliacao.findUnique({
        where: { contratacaoId: row.idContratacao },
      }),
    ).toEqual(first);
    expect(
      await db.notificacao.count({
        where: { contratacaoId: row.idContratacao },
      }),
    ).toBe(1);
    cookies[0] = await login(0);
    const res = await request(app.getHttpServer())
      .get(`/solicitacoes/${row.idContratacao}`)
      .set('Cookie', cookies[0])
      .expect(200);
    expect(res.body as unknown).toMatchObject({
      avaliacao: { nota: 5, comentario: 'Serviço excelente!' },
      podeAvaliar: false,
    });
    const notifications = await request(app.getHttpServer())
      .get('/notificacoes?categoria=solicitacoes')
      .set('Cookie', cookies[2])
      .expect(200);
    const notificationPage = notifications.body as { itens: unknown[] };
    expect(notificationPage.itens).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tipo: 'AVALIACAO_RECEBIDA',
          destino: `/solicitacoes?pedido=${row.idContratacao}&papel=prestador`,
        }),
      ]),
    );
  });
  it('falha da notificação desfaz também a avaliação', async () => {
    const service = app.get(NotificationsService);
    const spy = jest
      .spyOn(service, 'emit')
      .mockRejectedValueOnce(new Error('Falha simulada'));
    const row = await order();
    try {
      await review(row.idContratacao).expect(500);
      expect(
        await db.avaliacao.count({
          where: { contratacaoId: row.idContratacao },
        }),
      ).toBe(0);
    } finally {
      spy.mockRestore();
    }
  });
  it('expõe comentários paginados e média real sem dados privados', async () => {
    await review((await order()).idContratacao, {
      nota: 3,
      comentario: '   ',
    }).expect(201);
    const detail = await request(app.getHttpServer())
      .get(`/profissionais/${ids[2]}`)
      .expect(200);
    expect(detail.body as unknown).toMatchObject({
      avaliacao: { quantidade: 2, media: 4 },
    });
    const first = await request(app.getHttpServer())
      .get(`/profissionais/${ids[2]}/avaliacoes?limite=1`)
      .expect(200);
    const second = await request(app.getHttpServer())
      .get(`/profissionais/${ids[2]}/avaliacoes?limite=1&pagina=2`)
      .expect(200);
    expect(first.body as unknown).toMatchObject({
      total: 2,
      itens: [{ nota: 3, comentario: null, autor: 'Pessoa' }],
    });
    expect(second.body as unknown).toMatchObject({
      total: 2,
      itens: [{ nota: 5, comentario: 'Serviço excelente!' }],
    });
    expect(JSON.stringify(first.body)).not.toMatch(
      /senha|cpf|cnpj|telefone|endereco|email|contratacaoId|contratanteId/,
    );
    await request(app.getHttpServer())
      .get(`/profissionais/${ids[2]}/avaliacoes?pagina=0`)
      .expect(400);
    await db.usuario.update({
      where: { idUsuario: ids[2] },
      data: { statusConta: 'INATIVO' },
    });
    await request(app.getHttpServer())
      .get(`/profissionais/${ids[2]}/avaliacoes`)
      .expect(404);
  });
});
