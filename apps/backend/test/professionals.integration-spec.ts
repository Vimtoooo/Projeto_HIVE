import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { randomUUID, scryptSync } from 'node:crypto';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { criarPrismaClient } from '../src/persistence/prisma-client.factory';
type Page = {
  itens: {
    idPrestador: number;
    nome: string;
    quantidadeServicos: number;
    avaliacao: { quantidade: number; media: number | null };
  }[];
  total: number;
};
describe('Profissionais: catálogo público e ações com PostgreSQL', () => {
  let app: INestApplication<App>, db: PrismaClient, cookie: string;
  const providers: number[] = [],
    services: number[] = [];
  let client: number;
  beforeAll(async () => {
    const url = process.env.TEST_DATABASE_URL;
    if (
      !url ||
      !/^\/hive_professionals_[a-f0-9]+_test$/.test(new URL(url).pathname)
    )
      throw Error('Use npm run test:profissionais.');
    db = criarPrismaClient(url);
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaClient)
      .useValue(db)
      .compile();
    app = module.createNestApplication();
    await app.init();
    const password = 'Catalogo!2026',
      salt = 'catalog-test',
      senha =
        'scrypt$' + salt + '$' + scryptSync(password, salt, 64).toString('hex');
    for (let i = 0; i < 6; i++) {
      const u = await db.usuario.create({
        data: {
          nome: i === 5 ? 'Cliente' : i < 2 ? 'Alex Teste' : 'Pessoa ' + i,
          email: `p${i}@catalog.example.invalid`,
          senha,
          cpf: '2220000000' + i,
          telefone: '11900000000',
          endereco: 'Endereço privado',
          tipoUsuario: i === 5 ? 'CONTRATANTE' : 'PRESTADOR',
          statusConta: i === 2 ? 'BLOQUEADO' : 'ATIVO',
        },
      });
      if (i === 5) {
        client = u.idUsuario;
        const res = await request(app.getHttpServer())
          .post('/login')
          .set('X-Hive-Request', '1')
          .send({ email: u.email, senha: password })
          .expect(201);
        cookie = (res.headers['set-cookie'] as unknown as string[])[0].split(
          ';',
        )[0];
        continue;
      }
      providers.push(u.idUsuario);
      await db.prestador.create({
        data: {
          idPrestador: u.idUsuario,
          areaAtuacao: i === 0 ? 'Reparos' : 'Limpeza',
          experiencia: 'Cinco anos',
          certificacoes: ['Curso declarado'],
          cnpj: '2220000000000' + i,
          avaliacaoMedia: 4.9,
        },
      });
      if (i === 4) continue;
      const s = await db.servico.create({
        data: {
          prestadorId: u.idUsuario,
          titulo: 'Serviço ' + i,
          descricao: 'Atendimento cuidadoso',
          precoBase: 100 + i,
          status: i === 3 ? 'INATIVO' : 'ATIVO',
        },
      });
      services.push(s.idServico);
    }
    await db.servico.create({
      data: {
        prestadorId: providers[0],
        titulo: 'Instalação de tomada',
        descricao: 'Elétrica residencial',
        precoBase: 50,
      },
    });
    await db.servico.create({
      data: {
        prestadorId: providers[0],
        titulo: 'Oculto',
        descricao: 'Segredo de serviço inativo',
        precoBase: 1,
        status: 'INATIVO',
      },
    });
  });
  afterAll(async () => {
    await app?.close();
    await db?.$disconnect();
  });
  const get = (path: string) =>
    request(app.getHttpServer()).get('/profissionais' + path);
  const post = (path: string, body: object) =>
    request(app.getHttpServer())
      .post(path)
      .set('Cookie', cookie)
      .set('X-Hive-Request', '1')
      .send(body);
  it('pagina por prestador, desempata por ID e não duplica profissionais com vários serviços', async () => {
    const first = (await get('?limite=1').expect(200)).body as Page;
    const second = (await get('?limite=1&pagina=2').expect(200)).body as Page;
    expect(first.total).toBe(2);
    expect(second.total).toBe(2);
    expect(first.itens.map((p) => p.idPrestador)).toEqual([providers[0]]);
    expect(second.itens.map((p) => p.idPrestador)).toEqual([providers[1]]);
    expect(first.itens[0].quantidadeServicos).toBe(2);
    expect(
      (await get('?pagina=3&limite=1').expect(200)).body as unknown,
    ).toMatchObject({ itens: [] });
  });
  it('busca por nome, área e serviço ativo, combinando filtro sem distinção de caixa', async () => {
    expect(((await get('?texto=ALEX').expect(200)).body as Page).total).toBe(2);
    expect(((await get('?texto=REPAROS').expect(200)).body as Page).total).toBe(
      1,
    );
    expect(
      ((await get('?texto=TOMADA').expect(200)).body as Page).itens[0]
        .idPrestador,
    ).toBe(providers[0]);
    expect(
      (
        (await get('?texto=tomada&areaAtuacao=limpeza').expect(200))
          .body as Page
      ).total,
    ).toBe(0);
    expect(((await get('?texto=oculto').expect(200)).body as Page).total).toBe(
      0,
    );
  });
  it('devolve somente campos públicos e avaliações reais, ignorando média ilustrativa', async () => {
    const res = await get('/' + providers[0]).expect(200);
    const row = res.body as Record<string, unknown>;
    expect(Object.keys(row).sort()).toEqual(
      [
        'idPrestador',
        'nome',
        'areaAtuacao',
        'experiencia',
        'certificacoes',
        'servicos',
        'avaliacao',
      ].sort(),
    );
    expect(row.avaliacao).toEqual({ quantidade: 0, media: null });
    expect(JSON.stringify(row)).not.toMatch(
      /senha|cpf|cnpj|email|telefone|endereco|Oculto/,
    );
    const order = await db.contratacao.create({
      data: {
        contratanteId: client,
        servicoId: services[0],
        status: 'CONCLUIDA',
        valor: 100,
        formaPagamento: 'PIX',
        avaliacao: { create: { nota: 4, comentario: 'Teste' } },
      },
    });
    expect(
      (await get('/' + providers[0]).expect(200)).body as unknown,
    ).toMatchObject({ avaliacao: { quantidade: 1, media: 4 } });
    expect(
      ((await get('').expect(200)).body as Page).itens[0].avaliacao,
    ).toEqual({ quantidade: 1, media: 4 });
    await db.contratacao.delete({
      where: { idContratacao: order.idContratacao },
    });
  });
  it('rejeita filtros inválidos e não revela contas indisponíveis', async () => {
    for (const path of [
      '?pagina=0',
      '?limite=51',
      '?texto=',
      '?pagina=abc',
      '?extra=1',
      '?texto=a&texto=b',
      '/0',
      '/abc',
      '/2147483648',
    ])
      await get(path).expect(400);
    for (const id of [providers[2], providers[3], providers[4], 2147483647])
      await get('/' + id).expect(404);
  });
  it('catálogo público integra conversa e pedido autenticados e valida disponibilidade novamente', async () => {
    await request(app.getHttpServer())
      .post('/conversas')
      .set('X-Hive-Request', '1')
      .send({ prestadorId: providers[0] })
      .expect(401);
    await request(app.getHttpServer())
      .post('/solicitacoes')
      .set('X-Hive-Request', '1')
      .send({
        servicoId: services[0],
        formaPagamento: 'PIX',
        chave: randomUUID(),
      })
      .expect(401);
    await post('/conversas', { prestadorId: providers[0] }).expect(201);
    await post('/solicitacoes', {
      servicoId: services[0],
      formaPagamento: 'PIX',
      chave: randomUUID(),
    }).expect(201);
    await db.servico.update({
      where: { idServico: services[0] },
      data: { status: 'INATIVO' },
    });
    await post('/solicitacoes', {
      servicoId: services[0],
      formaPagamento: 'PIX',
      chave: randomUUID(),
    }).expect(400);
    await db.usuario.update({
      where: { idUsuario: providers[0] },
      data: { statusConta: 'INATIVO' },
    });
    await get('/' + providers[0]).expect(404);
    await post('/conversas', { prestadorId: providers[0] }).expect(404);
  });
});
