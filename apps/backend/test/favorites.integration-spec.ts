import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { scryptSync } from 'node:crypto';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { criarPrismaClient } from '../src/persistence/prisma-client.factory';
describe('Favoritos persistentes e isolados por conta', () => {
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
    if (
      !url ||
      !/^\/hive_favorites_[a-f0-9]+_test$/.test(new URL(url).pathname)
    )
      throw Error('Use npm run test:favoritos.');
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
  const list = (i: number) =>
    request(app.getHttpServer()).get('/favoritos').set('Cookie', cookies[i]);
  const put = (i: number, p = ids[2]) =>
    request(app.getHttpServer())
      .put('/favoritos/' + p)
      .set('Cookie', cookies[i])
      .set('X-Hive-Request', '1')
      .send({});
  const remove = (i: number, p = ids[2]) =>
    request(app.getHttpServer())
      .delete('/favoritos/' + p)
      .set('Cookie', cookies[i])
      .set('X-Hive-Request', '1')
      .send({});
  it('exige sessão, proteção de escrita e rejeita identidade no corpo', async () => {
    await request(app.getHttpServer()).get('/favoritos').expect(401);
    await request(app.getHttpServer())
      .put('/favoritos/' + ids[2])
      .set('Cookie', cookies[0])
      .send({})
      .expect(403);
    await request(app.getHttpServer())
      .put('/favoritos/' + ids[2])
      .set('Cookie', cookies[0])
      .set('X-Hive-Request', '1')
      .send({ usuarioId: ids[1] })
      .expect(400);
    await put(2).expect(400);
    await put(0, 2147483647).expect(404);
  });
  it('PUT concorrente é idempotente e não altera a data original', async () => {
    await Promise.all([put(0).expect(200), put(0).expect(200)]);
    const first = await db.favorito.findMany({ where: { usuarioId: ids[0] } });
    expect(first).toHaveLength(1);
    await put(0).expect(200);
    expect(
      (await db.favorito.findMany({ where: { usuarioId: ids[0] } }))[0]
        .criadoEm,
    ).toEqual(first[0].criadoEm);
  });
  it('isola contas, persiste após novo login e não expõe dados privados', async () => {
    expect((await list(1).expect(200)).body as unknown).toMatchObject({
      usuarioId: ids[1],
      itens: [],
    });
    cookies[0] = await login(0);
    const res = await list(0).expect(200);
    expect(res.body as unknown).toMatchObject({
      usuarioId: ids[0],
      itens: [
        {
          idPrestador: ids[2],
          disponivel: true,
          profissional: { nome: 'Pessoa 2' },
        },
      ],
    });
    expect(JSON.stringify(res.body)).not.toMatch(
      /senha|cpf|cnpj|telefone|endereco|email/,
    );
    await remove(1).expect(200);
    expect(await db.favorito.count({ where: { usuarioId: ids[0] } })).toBe(1);
  });
  it('indisponível continua removível, PUT repetido funciona e DELETE é idempotente', async () => {
    await db.usuario.update({
      where: { idUsuario: ids[2] },
      data: { statusConta: 'INATIVO' },
    });
    expect((await list(0).expect(200)).body as unknown).toMatchObject({
      itens: [{ disponivel: false, profissional: null }],
    });
    await put(0).expect(200);
    await put(1).expect(404);
    await remove(0).expect(200);
    await remove(0).expect(200);
    expect(await db.favorito.count()).toBe(0);
  });
  it('remove vínculos por cascata ao excluir usuário ou prestador', async () => {
    await put(0, ids[3]).expect(200);
    await put(1, ids[3]).expect(200);
    await db.usuario.delete({ where: { idUsuario: ids[1] } });
    expect(await db.favorito.count()).toBe(1);
    await db.prestador.delete({ where: { idPrestador: ids[3] } });
    expect(await db.favorito.count()).toBe(0);
  });
});
