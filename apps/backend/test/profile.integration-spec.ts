import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { scryptSync } from 'node:crypto';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { criarPrismaClient } from '../src/persistence/prisma-client.factory';
describe('Perfil: sessão, edição e PostgreSQL', () => {
  let app: INestApplication<App>, db: PrismaClient;
  let client: number, provider: number;
  let clientCookie: string, providerCookie: string, thirdCookie: string;
  const password = 'TesteSolicitacoes!2026';
  beforeAll(async () => {
    const url = process.env.TEST_DATABASE_URL;
    if (!url || !/^\/hive_profile_[a-f0-9]+_test$/.test(new URL(url).pathname))
      throw Error('Use npm run test:perfil com banco descartável.');
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
  });
  afterAll(async () => {
    await app?.close();
    await db?.$disconnect();
  });
  const get = (cookie: string) =>
    request(app.getHttpServer()).get('/perfil').set('Cookie', cookie);
  const patch = (cookie: string, body: object) =>
    request(app.getHttpServer())
      .patch('/perfil')
      .set('Cookie', cookie)
      .set('X-Hive-Request', '1')
      .send(body);
  it('exige sessão ativa e header nas escritas', async () => {
    await request(app.getHttpServer()).get('/perfil').expect(401);
    await request(app.getHttpServer())
      .patch('/perfil')
      .set('Cookie', clientCookie)
      .send({ nome: 'Nome Teste' })
      .expect(403);
    await db.sessao.updateMany({
      where: { usuarioId: client },
      data: { expiraEm: new Date(0) },
    });
    await get(clientCookie).expect(401);
    await patch(clientCookie, { nome: 'Nome Teste' }).expect(401);
    await db.sessao.updateMany({
      where: { usuarioId: client },
      data: { expiraEm: new Date(Date.now() + 3600000) },
    });
  });
  it('devolve apenas dados da própria conta, CPF mascarado e nenhum segredo', async () => {
    const res = await get(clientCookie).expect(200);
    const data = res.body as Record<string, unknown>;
    expect(data.idUsuario).toBe(client);
    expect(data.cpfMascarado).toMatch(/^\*{3}\.\*{3}\.\d{3}-\*{2}$/);
    expect(Object.keys(data).sort()).toEqual(
      [
        'idUsuario',
        'nome',
        'email',
        'cpfMascarado',
        'telefone',
        'endereco',
        'tipoUsuario',
        'dataCadastro',
      ].sort(),
    );
    expect(
      (await get(providerCookie).expect(200)).body as unknown,
    ).toMatchObject({ idUsuario: provider });
  });
  it('edita campos permitidos, preserva outros dados e persiste na sessão', async () => {
    const before = await db.usuario.findUniqueOrThrow({
      where: { idUsuario: client },
    });
    await patch(clientCookie, {
      nome: '  Ana Perfil  ',
      telefone: '1133334444',
      endereco: '  Rua de Teste, 42  ',
    }).expect(200);
    expect((await get(clientCookie).expect(200)).body as unknown).toMatchObject(
      {
        nome: 'Ana Perfil',
        telefone: '1133334444',
        endereco: 'Rua de Teste, 42',
      },
    );
    expect(
      (
        await request(app.getHttpServer())
          .get('/sessao')
          .set('Cookie', clientCookie)
          .expect(200)
      ).body as unknown,
    ).toMatchObject({ nome: 'Ana Perfil' });
    const after = await db.usuario.findUniqueOrThrow({
      where: { idUsuario: client },
    });
    expect(after.email).toBe(before.email);
    expect(after.cpf).toBe(before.cpf);
    expect(after.senha).toBe(before.senha);
    expect(after.tipoUsuario).toBe(before.tipoUsuario);
    await patch(clientCookie, { telefone: '11988887777' }).expect(200);
    expect((await get(clientCookie)).body as unknown).toMatchObject({
      nome: 'Ana Perfil',
      telefone: '11988887777',
    });
    await patch(providerCookie, { nome: 'Prestador Atualizado' }).expect(200);
    expect((await get(clientCookie)).body as unknown).toMatchObject({
      nome: 'Ana Perfil',
    });
  });
  it('rejeita campos extras, dados inválidos, null e tentativas de editar outra conta', async () => {
    for (const body of [
      {},
      { nome: '' },
      { nome: 'ab' },
      { nome: 'x'.repeat(192) },
      { nome: null },
      { telefone: '123' },
      { telefone: 11999999999 },
      { endereco: 'ab' },
      { endereco: null },
      { idUsuario: provider, nome: 'Invadido' },
      { email: 'outro@example.invalid' },
      { cpf: '11111111111' },
      { senha: 'Trocar!123' },
      { tipoUsuario: 'AMBOS' },
      { statusConta: 'INATIVO' },
    ])
      await patch(clientCookie, body).expect(400);
    expect((await get(providerCookie)).body as unknown).toMatchObject({
      nome: 'Prestador Atualizado',
    });
    expect((await get(thirdCookie)).body as unknown).toMatchObject({
      nome: 'terceiro',
    });
  });
});
