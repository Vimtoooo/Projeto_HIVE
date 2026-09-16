// Não executa seeds, resets ou exclusões de banco.
const { spawnSync } = require('node:child_process');
const { resolve } = require('node:path');
const dotenv = require('dotenv');
process.chdir(resolve(__dirname, '..'));
dotenv.config({ path: '.env.test.local', quiet: true });
dotenv.config({ quiet: true });

function destino(value) {
  const url = new URL(value);
  const host = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
    ? 'local'
    : url.hostname;
  return `${host}:${url.port || '3306'}${decodeURIComponent(url.pathname)}`;
}

function main() {
  const url = process.env.TEST_DATABASE_URL;
  if (!url || !/^\/[a-zA-Z0-9_]+_test$/.test(new URL(url).pathname)) {
    throw new Error(
      'Defina TEST_DATABASE_URL em .env.test.local com um banco exclusivo terminado em _test.',
    );
  }
  if (
    process.env.DATABASE_URL &&
    destino(url) === destino(process.env.DATABASE_URL)
  ) {
    throw new Error(
      'O destino de testes deve ser diferente do banco da aplicação.',
    );
  }
  const modo = process.argv[2];
  let comando;
  if (modo === 'prepare') {
    // Sincroniza o schema no banco de testes; recusa perda de dados por padrão.
    comando = ['node_modules/prisma/build/index.js', 'db', 'push'];
  } else if (modo === 'test' || modo === 'demo') {
    comando = [
      'node_modules/jest/bin/jest.js',
      '--config',
      'test/jest-persistencia.json',
      '--runInBand',
    ];
    if (modo === 'demo')
      comando.push('--testNamePattern=grava as oito entidades');
  } else if (modo === 'clean') {
    if (!process.argv[3] || !/^[0-9a-f-]{36}$/.test(process.argv[3])) {
      throw new Error('Informe o UUID exibido pela demonstração após --.');
    }
    comando = [
      'node_modules/ts-node/dist/bin.js',
      'scripts/limpar-teste.ts',
      process.argv[3],
    ];
  } else {
    throw new Error('Modo esperado: prepare, test, demo ou clean.');
  }
  const child = spawnSync(process.execPath, comando, {
    stdio: 'inherit',
    env: {
      ...process.env,
      HIVE_PRESERVAR_TESTE: modo === 'demo' ? '1' : '0',
      ...(modo === 'prepare' ? { DATABASE_URL: url } : {}),
    },
  });
  if (child.error)
    throw new Error('Não foi possível iniciar o processo de testes.');
  process.exitCode = child.status ?? 1;
}

try {
  main();
} catch (error) {
  // Não imprimir connection strings nem objetos de erro do driver.
  console.error(
    error instanceof TypeError ? 'URL de banco inválida.' : error.message,
  );
  process.exitCode = 1;
}
