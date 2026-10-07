import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { randomUUID, scryptSync } from 'node:crypto';
import request from 'supertest';
import { App } from 'supertest/types';
import { NotificationsService } from '../src/notifications/notifications.service';
import { AppModule } from '../src/app.module';
import { criarPrismaClient } from '../src/persistence/prisma-client.factory';
function payload(response: { body: unknown }) {
  return response.body as {
    id: number;
    idContratacao: number;
    lidaEm: string | null;
    itens: { id: number; lidaEm: string | null }[];
    ateId: number;
    proximoCursor: number | null;
    naoLidas: number;
  };
}
describe('Notificações: eventos, isolamento e leitura persistente', () => {
  let app: INestApplication<App>, db: PrismaClient;
  let client: number, provider: number, service: number;
  let clientCookie: string, providerCookie: string, thirdCookie: string;
  const password = 'TesteSolicitacoes!2026';
  beforeAll(async () => {
    const url = process.env.TEST_DATABASE_URL;
    if (
      !url ||
      !/^\/hive_notifications_[a-f0-9]+_test$/.test(new URL(url).pathname)
    )
      throw Error('Use npm run test:notificacoes com banco descartável.');
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
  it('notifica a contraparte em todas as transições, sem duplicar pedidos', async () => {
    const input = {
      servicoId: service,
      formaPagamento: 'PIX',
      chave: randomUUID(),
    };
    const [a, b] = await Promise.all([
      post(clientCookie, '/solicitacoes', input),
      post(clientCookie, '/solicitacoes', input),
    ]);
    expect(a.status).toBe(201);
    expect(b.status).toBe(201);
    expect(payload(a).idContratacao).toBe(payload(b).idContratacao);
    const id = payload(a).idContratacao;
    expect(await db.notificacao.count({ where: { contratacaoId: id } })).toBe(
      1,
    );
    expect(
      (await db.notificacao.findFirstOrThrow({ where: { contratacaoId: id } }))
        .usuarioId,
    ).toBe(provider);
    await post(providerCookie, `/solicitacoes/${id}/acao`, {
      acao: 'ACEITAR',
    }).expect(201);
    await post(providerCookie, `/solicitacoes/${id}/acao`, {
      acao: 'CONCLUIR',
    }).expect(201);
    const rows = await db.notificacao.findMany({
      where: { contratacaoId: id },
      orderBy: { id: 'asc' },
    });
    expect(rows.map((r) => r.tipo)).toEqual([
      'SOLICITACAO_CRIADA',
      'SOLICITACAO_ACEITA',
      'SOLICITACAO_CONCLUIDA',
    ]);
    expect(rows.slice(1).every((r) => r.usuarioId === client)).toBe(true);
    await post(providerCookie, `/solicitacoes/${id}/acao`, {
      acao: 'CONCLUIR',
    }).expect(409);
    expect(await db.notificacao.count({ where: { contratacaoId: id } })).toBe(
      3,
    );
    for (const [cookie, acao, recipient, tipo] of [
      [providerCookie, 'RECUSAR', client, 'SOLICITACAO_RECUSADA'],
      [clientCookie, 'CANCELAR', provider, 'SOLICITACAO_CANCELADA'],
    ] as const) {
      const r = await create().expect(201);
      await post(cookie, `/solicitacoes/${payload(r).idContratacao}/acao`, {
        acao,
      }).expect(201);
      expect(
        await db.notificacao.count({
          where: {
            contratacaoId: payload(r).idContratacao,
            tipo,
            usuarioId: recipient,
          },
        }),
      ).toBe(1);
    }
    const r = await create().expect(201);
    await post(
      providerCookie,
      `/solicitacoes/${payload(r).idContratacao}/acao`,
      {
        acao: 'ACEITAR',
      },
    ).expect(201);
    await post(
      providerCookie,
      `/solicitacoes/${payload(r).idContratacao}/acao`,
      {
        acao: 'CANCELAR',
      },
    ).expect(201);
    expect(
      await db.notificacao.count({
        where: {
          contratacaoId: payload(r).idContratacao,
          tipo: 'SOLICITACAO_CANCELADA',
          usuarioId: client,
        },
      }),
    ).toBe(1);
  });
  it('mensagens concorrentes notificam uma vez; replay não redefine leitura nem faz retrocarga', async () => {
    const before = await db.notificacao.count();
    const c = await post(clientCookie, '/conversas', {
      prestadorId: provider,
    }).expect(201);
    expect(await db.notificacao.count()).toBe(before);
    const path = `/conversas/${payload(c).id}/mensagens`,
      input = { conteudo: 'Olá, professor!', chave: randomUUID() };
    const responses = await Promise.all([
      post(clientCookie, path, input),
      post(clientCookie, path, input),
    ]);
    expect(responses.every((r) => r.status === 201)).toBe(true);
    const messageId = payload(responses[0]).id;
    const n = await db.notificacao.findFirstOrThrow({
      where: { mensagemId: messageId },
    });
    expect(n.usuarioId).toBe(provider);
    expect(n.descricao).not.toContain(input.conteudo);
    const read = await post(
      providerCookie,
      `/notificacoes/${n.id}/lida`,
      {},
    ).expect(201);
    await post(clientCookie, path, input).expect(201);
    const readAgain = await post(
      providerCookie,
      `/notificacoes/${n.id}/lida`,
      {},
    ).expect(201);
    expect(payload(readAgain).lidaEm).toBe(payload(read).lidaEm);
    expect(
      await db.notificacao.count({ where: { mensagemId: messageId } }),
    ).toBe(1);
    await db.notificacao.delete({ where: { id: n.id } });
    await post(clientCookie, path, input).expect(201);
    expect(
      await db.notificacao.count({ where: { mensagemId: messageId } }),
    ).toBe(0);
    const reply = await post(providerCookie, path, {
      conteudo: 'Olá!',
      chave: randomUUID(),
    }).expect(201);
    expect(
      (
        await db.notificacao.findFirstOrThrow({
          where: { mensagemId: payload(reply).id },
        })
      ).usuarioId,
    ).toBe(client);
  });
  it('isola contas, exige sessão e CSRF e valida filtros e limites', async () => {
    const n = await db.notificacao.findFirstOrThrow({
      where: { usuarioId: provider },
    });
    await request(app.getHttpServer()).get('/notificacoes').expect(401);
    await get(thirdCookie, `/notificacoes/${n.id}`).expect(404);
    await post(thirdCookie, `/notificacoes/${n.id}/lida`, {}).expect(404);
    await request(app.getHttpServer())
      .post(`/notificacoes/${n.id}/lida`)
      .set('Cookie', providerCookie)
      .send({})
      .expect(403);
    for (const q of [
      'limite=51',
      'antes=-1',
      'naoLidas=x',
      'categoria=promocoes',
      'usuarioId=1',
    ])
      await get(providerCookie, '/notificacoes?' + q).expect(400);
    await post(providerCookie, '/notificacoes/ler-todas', { ateId: -1 }).expect(
      400,
    );
    expect(
      payload(await get(thirdCookie, '/notificacoes').expect(200)).itens,
    ).toEqual([]);
  });
  it('pagina sem duplicar novos eventos e limita leitura em lote ao snapshot', async () => {
    const first = await get(providerCookie, '/notificacoes?limite=2').expect(
      200,
    );
    expect(payload(first).itens).toHaveLength(2);
    const top = payload(first).ateId;
    const fresh = await create().expect(201);
    const next = await get(
      providerCookie,
      `/notificacoes?limite=2&antes=${payload(first).proximoCursor}&ateId=${top}`,
    ).expect(200);
    expect(
      payload(next).itens.every(
        (n: { id: number }) => n.id < payload(first).itens[1].id,
      ),
    ).toBe(true);
    await post(providerCookie, '/notificacoes/ler-todas', {
      ateId: top,
    }).expect(201);
    expect(
      await db.notificacao.count({
        where: { usuarioId: provider, id: { lte: top }, lidaEm: null },
      }),
    ).toBe(0);
    expect(
      (
        await db.notificacao.findFirstOrThrow({
          where: { contratacaoId: payload(fresh).idContratacao },
        })
      ).lidaEm,
    ).toBeNull();
    const unread = await get(
      providerCookie,
      '/notificacoes?naoLidas=true&categoria=solicitacoes',
    ).expect(200);
    expect(
      payload(unread).itens.every(
        (n: { lidaEm: string | null }) => n.lidaEm === null,
      ),
    ).toBe(true);
    const summary = await get(providerCookie, '/notificacoes/resumo').expect(
      200,
    );
    expect(payload(summary).naoLidas).toBe(
      await db.notificacao.count({
        where: { usuarioId: provider, lidaEm: null },
      }),
    );
    await db.contratacao.delete({
      where: { idContratacao: payload(fresh).idContratacao },
    });
    expect(
      await db.notificacao.count({
        where: { contratacaoId: payload(fresh).idContratacao },
      }),
    ).toBe(0);
  });
  it('reverte pedido, mudança de estado e mensagem quando o aviso falha', async () => {
    const notifier = app.get(NotificationsService);
    const count = await db.contratacao.count();
    let spy = jest
      .spyOn(notifier, 'emit')
      .mockRejectedValueOnce(new Error('Falha simulada'));
    await create().expect(500);
    spy.mockRestore();
    expect(await db.contratacao.count()).toBe(count);
    const r = await create().expect(201);
    spy = jest
      .spyOn(notifier, 'emit')
      .mockRejectedValueOnce(new Error('Falha simulada'));
    await post(
      providerCookie,
      `/solicitacoes/${payload(r).idContratacao}/acao`,
      {
        acao: 'ACEITAR',
      },
    ).expect(500);
    spy.mockRestore();
    expect(
      (
        await db.contratacao.findUniqueOrThrow({
          where: { idContratacao: payload(r).idContratacao },
        })
      ).status,
    ).toBe('PENDENTE');
    const c = await post(clientCookie, '/conversas', {
      prestadorId: provider,
    }).expect(201);
    const messages = await db.mensagem.count();
    spy = jest
      .spyOn(notifier, 'emit')
      .mockRejectedValueOnce(new Error('Falha simulada'));
    await post(clientCookie, `/conversas/${payload(c).id}/mensagens`, {
      conteudo: 'Não deve persistir',
      chave: randomUUID(),
    }).expect(500);
    spy.mockRestore();
    expect(await db.mensagem.count()).toBe(messages);
  });
});
