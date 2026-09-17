import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { randomInt, randomUUID, scryptSync } from 'node:crypto';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { criarPrismaClient } from '../src/persistence/prisma-client.factory';
import { limparDados } from './support/limpar-dados';

/** HTTP real com o AppModule real e banco exclusivo: sem mocks da persistência. */
describe('Catálogo HTTP → classes → Prisma → banco', () => {
  let app: INestApplication<App>;
  let db: PrismaClient;
  const execucao = randomUUID();
  const emails: string[] = [];
  let pronto = false;

  function cadastro(rotulo: string) {
    const email = `${rotulo}.${execucao}@example.invalid`;
    emails.push(email);
    return {
      nome: 'Prestador Fictício API',
      email,
      senha: 'SenhaFicticia!123',
      telefone: '11999990000',
      cpf: String(randomInt(10_000_000_000, 99_999_999_999)),
      endereco: 'Rua de Testes, 100',
      areaAtuacao: `Montagem ${execucao}`,
      experiencia: 'Montagem de móveis',
      certificacoes: ['Montagem'],
      cnpj: String(randomInt(10_000_000_000_000, 99_999_999_999_999)),
      servico: {
        titulo: `Montagem ${execucao}`,
        descricao: 'Montagem de mesa e cadeira',
        precoBase: 200,
      },
    };
  }

  beforeAll(async () => {
    const url = process.env.TEST_DATABASE_URL;
    if (
      !url ||
      !new URL(url).pathname.endsWith('_test') ||
      url === process.env.DATABASE_URL
    )
      throw new Error(
        'Configure um banco exclusivo em TEST_DATABASE_URL terminado em _test.',
      );
    db = criarPrismaClient(url);
    // SELECT verifica de fato a conexão; $connect pode somente inicializar o pool.
    await db.usuario.count();
    pronto = true;
    const fixture = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaClient)
      .useValue(db)
      .compile();
    app = fixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    try {
      if (pronto && process.env.HIVE_PRESERVAR_TESTE === '1') {
        console.log(`Dados da API preservados. ID da execução: ${execucao}`);
        console.log(
          `Para limpar: npm run test:persistencia:limpar -- ${execucao}`,
        );
      } else if (pronto) await limparDados(db, emails);
    } finally {
      await app?.close();
      await db?.$disconnect();
    }
  });

  it('demonstra cadastro e busca pelo fluxo completo do diagrama', async () => {
    const dados = cadastro('api');
    const criado = await request(app.getHttpServer())
      .post('/prestadores')
      .send(dados)
      .expect(201);
    const registro = await db.usuario.findUniqueOrThrow({
      where: { email: dados.email },
      include: { prestadorPerfil: { include: { servicos: true } } },
    });
    const servico = registro.prestadorPerfil!.servicos[0];
    expect(servico.prestadorId).toBe(registro.idUsuario);
    expect(criado.body).toMatchObject({
      idServico: servico.idServico,
      precoBase: 200,
      prestador: { idPrestador: registro.idUsuario },
    });
    const [, salt, hash] = registro.senha.split('$');
    expect(scryptSync(dados.senha, salt, 64).toString('hex')).toBe(hash);

    const resultado = await request(app.getHttpServer())
      .get('/servicos')
      .query({
        texto: execucao,
        areaAtuacao: dados.areaAtuacao,
        precoMin: 190,
        precoMax: 210,
        prestadorId: registro.idUsuario,
      })
      .expect(200);
    expect(resultado.body).toMatchObject({
      pagina: 1,
      limite: 20,
      total: 1,
      itens: [criado.body],
    });
    for (const campo of [
      'senha',
      'cpf',
      'cnpj',
      'email',
      'telefone',
      'endereco',
    ]) {
      expect(resultado.text).not.toContain(`"${campo}"`);
      expect(criado.text).not.toContain(`"${campo}"`);
    }
    console.log(
      `Serviço gravado: ${servico.idServico}; prestador: ${registro.idUsuario}`,
    );
  });

  it('rejeita entradas inválidas e campos internos sem gravar dados', async () => {
    const dados = cadastro('api-invalido');
    await request(app.getHttpServer())
      .post('/prestadores')
      .send({ ...dados, servico: { ...dados.servico, precoBase: -1 } })
      .expect(400);
    await request(app.getHttpServer())
      .post('/prestadores')
      .send({ ...dados, statusConta: 'ATIVO' })
      .expect(400);
    await request(app.getHttpServer())
      .post('/prestadores')
      .send({ ...dados, certificacoes: [], cpf: '123' })
      .expect(400);
    await request(app.getHttpServer())
      .post('/prestadores')
      .send({ ...dados, servico: null })
      .expect(400);
    await request(app.getHttpServer())
      .post('/prestadores')
      .send({ ...dados, servico: [dados.servico] })
      .expect(400);
    expect(await db.usuario.count({ where: { email: dados.email } })).toBe(0);
  });

  it('responde 409 em duplicidade sem deixar usuário ou serviço parcial', async () => {
    const primeiro = cadastro('api-duplicado');
    await request(app.getHttpServer())
      .post('/prestadores')
      .send(primeiro)
      .expect(201);
    await request(app.getHttpServer())
      .post('/prestadores')
      .send(primeiro)
      .expect(409);
    const segundo = cadastro('api-rollback');
    await request(app.getHttpServer())
      .post('/prestadores')
      .send({ ...segundo, cnpj: primeiro.cnpj })
      .expect(409);
    expect(await db.usuario.count({ where: { email: segundo.email } })).toBe(0);
    expect(
      await db.servico.count({
        where: { prestador: { usuario: { email: primeiro.email } } },
      }),
    ).toBe(1);
  });

  it('filtra, pagina e oculta serviços inativos e contas bloqueadas', async () => {
    const dados = cadastro('api-filtros');
    await request(app.getHttpServer())
      .post('/prestadores')
      .send(dados)
      .expect(201);
    const usuario = await db.usuario.findUniqueOrThrow({
      where: { email: dados.email },
    });
    await db.servico.createMany({
      data: [
        {
          prestadorId: usuario.idUsuario,
          titulo: 'Segundo serviço',
          descricao: 'Outra montagem',
          precoBase: 300,
        },
        {
          prestadorId: usuario.idUsuario,
          titulo: 'Oculto',
          descricao: 'Inativo',
          precoBase: 100,
          status: 'INATIVO',
        },
      ],
    });
    const primeira = await request(app.getHttpServer())
      .get('/servicos')
      .query({ prestadorId: usuario.idUsuario, limite: 1 })
      .expect(200);
    const segunda = await request(app.getHttpServer())
      .get('/servicos')
      .query({ prestadorId: usuario.idUsuario, limite: 1, pagina: 2 })
      .expect(200);
    expect(primeira.body).toMatchObject({
      total: 2,
      itens: [{ precoBase: 200 }],
    });
    expect(segunda.body).toMatchObject({
      total: 2,
      itens: [{ precoBase: 300 }],
    });
    const vazio = await request(app.getHttpServer())
      .get('/servicos')
      .query({ prestadorId: usuario.idUsuario, precoMax: 150 })
      .expect(200);
    expect(vazio.body).toMatchObject({ total: 0, itens: [] });
    await db.usuario.update({
      where: { idUsuario: usuario.idUsuario },
      data: { statusConta: 'BLOQUEADO' },
    });
    const bloqueado = await request(app.getHttpServer())
      .get('/servicos')
      .query({ prestadorId: usuario.idUsuario })
      .expect(200);
    expect(bloqueado.body).toMatchObject({ total: 0, itens: [] });
  });

  it.each([
    { pagina: 0 },
    { limite: 101 },
    { precoMin: 'abc' },
    { precoMin: 20, precoMax: 10 },
    { status: 'INATIVO' },
    { texto: ['a', 'b'] },
  ])('responde 400 para filtro inválido %j', async (filtro) => {
    await request(app.getHttpServer())
      .get('/servicos')
      .query(filtro)
      .expect(400);
  });
});
