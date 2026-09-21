import { config } from 'dotenv';
import { existsSync } from 'node:fs';
import { criarPrismaClient } from '../src/persistence/prisma-client.factory';
import {
  popularDemonstracao,
  validarDestinoSeed,
  SeedConfiguracaoError,
} from './seed-local';
import { pessoas, SENHA_DEMONSTRACAO } from './seed-data';

const teste = process.argv[2] === '--test';
const arquivo = teste ? '.env.test.local' : '.env';
config({
  path:
    process.env.DOTENV_CONFIG_PATH ||
    (existsSync('.env/' + arquivo) ? '.env/' + arquivo : arquivo),
  quiet: true,
});

async function main() {
  const args = process.argv.slice(teste ? 3 : 2);
  const reset = args[0] === '--reset';
  const restantes = reset ? args.slice(1) : args;
  if (restantes.length !== 2 || restantes[0] !== '--confirm')
    throw new SeedConfiguracaoError(
      'Uso: npm run db:seed:local -- --confirm BANCO ou npm run db:reset:local -- --confirm BANCO',
    );
  const url = teste ? process.env.TEST_DATABASE_URL : process.env.DATABASE_URL;
  const banco = validarDestinoSeed(url, restantes[1]);
  if (teste && !banco.endsWith('_test'))
    throw new SeedConfiguracaoError('O modo de testes exige banco _test.');
  console.log(
    (reset ? 'Substituindo todos os dados de ' : 'Populando banco vazio ') +
      banco,
  );
  const prisma = criarPrismaClient(url);
  try {
    console.table(await popularDemonstracao(prisma, reset));
    console.table(pessoas.map(({ nome, email }) => ({ nome, email })));
    console.log('Senha fictícia das contas: ' + SENHA_DEMONSTRACAO);
  } finally {
    await prisma.$disconnect();
  }
}
void main().catch((erro: unknown) => {
  if (erro instanceof SeedConfiguracaoError) {
    console.error(erro.message);
    process.exitCode = 1;
    return;
  }
  console.error(
    'Seed não concluído. Confira conexão PostgreSQL, schema e --confirm NOME_EXATO de um banco local hive, _local ou _test. Carga simples exige banco vazio; reset exige NODE_ENV diferente de production.',
  );
  process.exitCode = 1;
});
