import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { randomUUID, scryptSync } from 'node:crypto';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { criarPrismaClient } from '../src/persistence/prisma-client.factory';

describe('Mensagens e histórico: HTTP → Prisma → PostgreSQL', () => {
  let app: INestApplication<App>;
  let db: PrismaClient;
  let client: number,
    provider: number,
    third: number,
    service: number,
    conversation: number;
  let clientCookie: string, providerCookie: string, thirdCookie: string;
  const password = 'TesteMensagens!2026';
  const email = (role: string) => role + '@messaging.example.invalid';
  beforeAll(async () => {
    const url = process.env.TEST_DATABASE_URL;
    if (!url || !/^\/hive_messages_[a-f0-9]+_test$/.test(new URL(url).pathname))
      throw new Error(
        'Execute npm run test:mensagens: exige banco descartável exclusivo.',
      );
    db = criarPrismaClient(url);
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaClient)
      .useValue(db)
      .compile();
    app = module.createNestApplication();
    await app.init();
    const salt = 'integration-fixture';
    const hash =
      'scrypt$' + salt + '$' + scryptSync(password, salt, 64).toString('hex');
    const create = async (role: string, cpf: string) =>
      db.usuario.create({
        data: {
          nome: role,
          email: email(role),
          senha: hash,
          cpf,
          telefone: '11900000000',
          endereco: 'Rua Fictícia, 1',
          tipoUsuario: role === 'prestador' ? 'PRESTADOR' : 'CONTRATANTE',
          statusConta: 'ATIVO',
        },
      });
    client = (await create('cliente', '11100000001')).idUsuario;
    provider = (await create('prestador', '11100000002')).idUsuario;
    third = (await create('terceiro', '11100000003')).idUsuario;
    await db.prestador.create({
      data: {
        idPrestador: provider,
        areaAtuacao: 'Reparos',
        experiencia: 'Demonstração',
        certificacoes: [],
        cnpj: '11100000000001',
      },
    });
    service = (
      await db.servico.create({
        data: {
          titulo: 'Montagem de estante',
          descricao: 'Serviço fictício',
          precoBase: 100,
          prestadorId: provider,
          status: 'ATIVO',
        },
      })
    ).idServico;
    clientCookie = await login('cliente');
    providerCookie = await login('prestador');
    thirdCookie = await login('terceiro');
  });
  afterAll(async () => {
    await app?.close();
    await db?.$disconnect();
  });
  async function login(role: string) {
    const res = await request(app.getHttpServer())
      .post('/login')
      .set('X-Hive-Request', '1')
      .send({ email: email(role), senha: password })
      .expect(201);
    const cookies = res.headers['set-cookie'] as unknown as string[];
    expect(cookies[0]).toContain('HttpOnly');
    expect(cookies[0]).toContain('SameSite=Lax');
    return cookies[0].split(';')[0];
  }
  it('exige sessão válida e header contra CSRF', async () => {
    await request(app.getHttpServer()).get('/conversas').expect(401);
    await request(app.getHttpServer())
      .get('/conversas')
      .set('Cookie', 'hive_session=forjado')
      .expect(401);
    await request(app.getHttpServer())
      .post('/conversas')
      .set('Cookie', clientCookie)
      .send({ prestadorId: provider })
      .expect(403);
    await request(app.getHttpServer())
      .post('/login')
      .set('X-Hive-Request', '1')
      .send({ email: email('cliente'), senha: 'errada' })
      .expect(401);
    await request(app.getHttpServer())
      .post('/login')
      .set('X-Hive-Request', '1')
      .send({ email: email('cliente') })
      .expect(400);
    const session = await db.sessao.findFirstOrThrow({
      where: { usuarioId: client },
    });
    expect(session.tokenHash).not.toBe(clientCookie.split('=')[1]);
  });
  it('reutiliza conversa por dupla, permite apenas prestador ativo e não expõe dados privados', async () => {
    const post = () =>
      request(app.getHttpServer())
        .post('/conversas')
        .set('Cookie', clientCookie)
        .set('X-Hive-Request', '1')
        .send({ prestadorId: provider });
    const a = await post().expect(201);
    const b = await post().expect(201);
    conversation = (a.body as { id: number }).id;
    expect((b.body as { id: number }).id).toBe(conversation);
    expect(JSON.stringify(a.body)).not.toMatch(/senha|cpf|email|telefone/);
    await request(app.getHttpServer())
      .post('/conversas')
      .set('Cookie', providerCookie)
      .set('X-Hive-Request', '1')
      .send({ prestadorId: provider })
      .expect(400);
    await request(app.getHttpServer())
      .post('/conversas')
      .set('Cookie', clientCookie)
      .set('X-Hive-Request', '1')
      .send({ prestadorId: third })
      .expect(404);
  });
  it('persiste mensagens nos dois sentidos e evita duplicação após tentativa repetida', async () => {
    const payload = {
      conteudo: 'Olá, pode montar minha estante?',
      chave: randomUUID(),
    };
    for (let i = 0; i < 2; i++)
      await request(app.getHttpServer())
        .post(`/conversas/${conversation}/mensagens`)
        .set('Cookie', clientCookie)
        .set('X-Hive-Request', '1')
        .send(payload)
        .expect(201);
    await request(app.getHttpServer())
      .post(`/conversas/${conversation}/mensagens`)
      .set('Cookie', providerCookie)
      .set('X-Hive-Request', '1')
      .send({ conteudo: 'Sim! Vamos combinar o horário.', chave: randomUUID() })
      .expect(201);
    expect(
      await db.mensagem.count({ where: { conversaId: conversation } }),
    ).toBe(2);
    const read = await request(app.getHttpServer())
      .get(`/conversas/${conversation}/mensagens`)
      .set('Cookie', clientCookie)
      .expect(200);
    expect((read.body as { itens: unknown[] }).itens).toHaveLength(2);
    const list = await request(app.getHttpServer())
      .get('/conversas')
      .set('Cookie', providerCookie)
      .expect(200);
    expect(list.body).toHaveLength(1);
  });
  it('bloqueia acesso de terceiro, remetente forjado e mensagem vazia/excessiva', async () => {
    await request(app.getHttpServer())
      .get(`/conversas/${conversation}/mensagens`)
      .set('Cookie', thirdCookie)
      .expect(404);
    await request(app.getHttpServer())
      .post(`/conversas/${conversation}/mensagens`)
      .set('Cookie', thirdCookie)
      .set('X-Hive-Request', '1')
      .send({ conteudo: 'Invasão', chave: randomUUID() })
      .expect(404);
    for (const conteudo of ['   ', 'x'.repeat(2001)])
      await request(app.getHttpServer())
        .post(`/conversas/${conversation}/mensagens`)
        .set('Cookie', clientCookie)
        .set('X-Hive-Request', '1')
        .send({ conteudo, chave: randomUUID() })
        .expect(400);
    await request(app.getHttpServer())
      .post(`/conversas/${conversation}/mensagens`)
      .set('Cookie', clientCookie)
      .set('X-Hive-Request', '1')
      .send({ conteudo: 'Teste', chave: randomUUID(), remetenteId: provider })
      .expect(400);
  });
  it('pagina mensagens sem perder ou repetir o histórico', async () => {
    await db.mensagem.createMany({
      data: Array.from({ length: 55 }, (_, i) => ({
        conversaId: conversation,
        remetenteId: client,
        conteudo: 'Mensagem ' + i,
        chave: randomUUID(),
      })),
    });
    const res = await request(app.getHttpServer())
      .get(`/conversas/${conversation}/mensagens`)
      .set('Cookie', clientCookie)
      .expect(200);
    const body = res.body as { itens: { id: number }[]; temMais: boolean };
    expect(body.itens).toHaveLength(50);
    expect(body.temMais).toBe(true);
    const older = await request(app.getHttpServer())
      .get(`/conversas/${conversation}/mensagens?antes=${body.itens[0].id}`)
      .set('Cookie', clientCookie)
      .expect(200);
    expect((older.body as { itens: unknown[] }).itens).toHaveLength(7);
  });
  it('histórico mostra apenas contratações concluídas da própria conta, sem duplicar prestador', async () => {
    for (const status of [
      'CONCLUIDA',
      'CONCLUIDA',
      'CANCELADA',
      'PENDENTE',
    ] as const)
      await db.contratacao.create({
        data: {
          contratanteId: client,
          servicoId: service,
          status,
          valor: 100,
          formaPagamento: 'PIX',
        },
      });
    const mine = await request(app.getHttpServer())
      .get('/contratacoes/anteriores')
      .set('Cookie', clientCookie)
      .expect(200);
    expect(mine.body).toHaveLength(1);
    const other = await request(app.getHttpServer())
      .get('/contratacoes/anteriores')
      .set('Cookie', thirdCookie)
      .expect(200);
    expect(other.body).toEqual([]);
    await db.servico.update({
      where: { idServico: service },
      data: { status: 'INATIVO' },
    });
    const inactive = await request(app.getHttpServer())
      .get('/contratacoes/anteriores')
      .set('Cookie', clientCookie)
      .expect(200);
    expect((inactive.body as { disponivel: boolean }[])[0].disponivel).toBe(
      false,
    );
  });
  it('logout revoga sessão e expiração/conta bloqueada impedem o acesso', async () => {
    await request(app.getHttpServer())
      .post('/logout')
      .set('Cookie', clientCookie)
      .set('X-Hive-Request', '1')
      .expect(204);
    await request(app.getHttpServer())
      .get('/conversas')
      .set('Cookie', clientCookie)
      .expect(401);
    await db.sessao.updateMany({
      where: { usuarioId: third },
      data: { expiraEm: new Date(0) },
    });
    await request(app.getHttpServer())
      .get('/conversas')
      .set('Cookie', thirdCookie)
      .expect(401);
    await db.usuario.update({
      where: { idUsuario: provider },
      data: { statusConta: 'BLOQUEADO' },
    });
    await request(app.getHttpServer())
      .get('/conversas')
      .set('Cookie', providerCookie)
      .expect(401);
  });
});
