import { scryptSync } from 'node:crypto';
import { validarDestinoSeed, popularDemonstracao } from '../prisma/seed-local';
import { pessoas, SENHA_DEMONSTRACAO } from '../prisma/seed-data';
import { criarPrismaClient } from '../src/persistence/prisma-client.factory';
import { Usuario } from '../src/models/Usuario';

describe('proteção do seed local', () => {
  it.each(['hive', 'hive_pi_2026f0915_test'])(
    'aceita o banco solicitado %s',
    (banco) => {
      expect(
        validarDestinoSeed(
          'mysql://u:s@localhost/' + banco,
          banco,
          'development',
        ),
      ).toBe(banco);
    },
  );
  it.each(['localhost', '127.0.0.1', '[::1]'])(
    'aceita loopback %s com confirmação exata',
    (host) => {
      expect(
        validarDestinoSeed(
          'mysql://usuario:senha@' + host + '/hive_local',
          'hive_local',
          'development',
        ),
      ).toBe('hive_local');
    },
  );
  it.each([
    ['mysql://u:s@servidor/hive_local', 'hive_local', 'development'],
    ['mysql://u:s@localhost/outro', 'outro', 'development'],
    ['mysql://u:s@localhost/hive_test', 'outro_test', 'development'],
    ['mysql://u:s@localhost/hive_test', 'hive_test', 'production'],
    ['postgresql://u:s@localhost/hive_test', 'hive_test', 'development'],
    ['mysql://u:s@localhost/hive_test?x=1', 'hive_test', 'development'],
    ['inválida', 'hive_test', 'development'],
  ])('recusa destino ou confirmação inválidos (%s)', (url, nome, ambiente) => {
    expect(() => validarDestinoSeed(url, nome, ambiente)).toThrow();
  });
});

// Opt-in: SOMENTE banco descartável novo. Nunca usar o banco compartilhado do grupo.
const url = process.env.SEED_TEST_DATABASE_URL;
const suite = url ? describe : describe.skip;
suite('seed no MySQL descartável', () => {
  const prisma = url ? criarPrismaClient(url) : undefined;
  beforeAll(async () => {
    if (
      !url ||
      !new URL(url).pathname.match(/^\/hive_seed_verificacao_[a-z0-9]+_test$/)
    )
      throw new Error(
        'Use banco descartável hive_seed_verificacao_IDENTIFICADOR_test.',
      );
    validarDestinoSeed(url, new URL(url).pathname.slice(1), 'test');
    if (await prisma!.usuario.count())
      throw new Error('O teste exige banco inicialmente vazio.');
  });
  afterAll(async () => {
    await prisma?.$disconnect();
  });
  it('popula oito tabelas, permite senha do login e repete reset sem duplicar', async () => {
    const db = prisma!;
    await popularDemonstracao(db);
    const usuario = await db.usuario.findUniqueOrThrow({
      where: { email: pessoas[0].email },
    });
    const [algoritmo, salt, hash] = usuario.senha.split('$');
    expect(algoritmo).toBe('scrypt');
    expect(scryptSync(SENHA_DEMONSTRACAO, salt, 64).toString('hex')).toBe(hash);
    await expect(popularDemonstracao(db)).rejects.toThrow(
      'Banco não está vazio',
    );
    await popularDemonstracao(db, true);
    expect(
      await Promise.all([
        db.usuario.count(),
        db.prestador.count(),
        db.servico.count(),
        db.contratacao.count(),
        db.indicacao.count(),
        db.avaliacao.count(),
        db.fatura.count(),
        db.financeiro.count(),
      ]),
    ).toEqual([3, 2, 3, 2, 1, 1, 2, 1]);
    expect(await db.servico.count({ where: { status: 'ATIVO' } })).toBe(2);
    const contrato = await db.contratacao.findFirstOrThrow({
      where: { status: 'CONCLUIDA' },
      include: { fatura: true, avaliacao: true, financeiros: true },
    });
    expect(contrato.fatura?.valorTotal).toBe(contrato.valor);
    expect(contrato.fatura?.statusPagamento).toBe('PAGO');
    expect(contrato.avaliacao?.nota).toBe(5);
    expect(contrato.financeiros[0].faturaId).toBe(contrato.fatura?.idFatura);
  });
  it('restaura os registros anteriores se a carga falhar após a limpeza', async () => {
    const antes = await prisma!.usuario.findMany({
      orderBy: { idUsuario: 'asc' },
    });
    const hash = jest
      .spyOn(Usuario.prototype, 'gerarHashSenha')
      .mockRejectedValueOnce(new Error('Falha simulada'));
    try {
      await expect(popularDemonstracao(prisma!, true)).rejects.toThrow(
        'Falha simulada',
      );
    } finally {
      hash.mockRestore();
    }
    expect(
      await prisma!.usuario.findMany({ orderBy: { idUsuario: 'asc' } }),
    ).toEqual(antes);
    expect(await prisma!.financeiro.count()).toBe(1);
  });
});
