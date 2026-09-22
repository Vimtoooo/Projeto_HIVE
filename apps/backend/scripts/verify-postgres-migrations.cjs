// Cria e remove SOMENTE um banco descartável. Exige CREATEDB no PostgreSQL local.
const { randomUUID } = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { Client } = require('pg');
const assert = require('node:assert/strict');
require('dotenv').config({
  path: process.env.DOTENV_CONFIG_PATH || '.env/.env.test.local',
  quiet: true,
});
process.chdir(resolve(__dirname, '..'));

async function main() {
  const url = new URL(process.env.TEST_DATABASE_URL || '');
  assert.ok(['postgres:', 'postgresql:'].includes(url.protocol));
  assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(url.hostname));
  assert.ok(url.pathname.endsWith('_test'));
  assert.notEqual(process.env.NODE_ENV, 'production');
  const referencia = url.href;
  const admin = new Client({ connectionString: referencia });
  const name =
    'hive_seed_verificacao_' + randomUUID().replaceAll('-', '') + '_test';
  assert.match(name, /^hive_seed_verificacao_[a-f0-9]+_test$/);
  let created = false;
  let db;
  await admin.connect();
  try {
    await admin.query('CREATE DATABASE "' + name + '"');
    created = true;
    url.pathname = '/' + name;
    const env = {
      ...process.env,
      DATABASE_URL: url.href,
      TEST_DATABASE_URL: url.href,
      SEED_TEST_DATABASE_URL: url.href,
    };
    const run = (args) => {
      const result = spawnSync(process.execPath, args, {
        env: args[0].includes('jest')
          ? { ...env, DATABASE_URL: referencia }
          : env,
        stdio: 'inherit',
        timeout: 120000,
      });
      assert.equal(result.status, 0, 'Comando de verificação falhou');
    };
    const prisma = 'node_modules/prisma/build/index.js';
    run([prisma, 'migrate', 'deploy']);
    run([prisma, 'migrate', 'deploy']);
    run([
      prisma,
      'migrate',
      'diff',
      '--from-config-datasource',
      '--to-schema',
      'prisma/schema.prisma',
      '--exit-code',
    ]);
    run([
      'node_modules/jest/bin/jest.js',
      '--config',
      'test/jest-seed.json',
      '--runInBand',
    ]);
    run([
      'node_modules/jest/bin/jest.js',
      '--config',
      'test/jest-persistencia.json',
      '--runInBand',
    ]);
    run([
      'node_modules/jest/bin/jest.js',
      '--config',
      'test/jest-catalogo.json',
      '--runInBand',
    ]);
    db = new Client({ connectionString: url.href });
    await db.connect();
    await db.query(readFileSync('test/consultar-persistencia.sql', 'utf8'));
    const before = await db.query(
      'SELECT "idUsuario", email FROM "Usuario" ORDER BY "idUsuario"',
    );
    assert.equal(before.rowCount, 3);
    // Simula, APENAS neste banco descartável, a ausência de histórico após db push.
    await db.query('DROP TABLE "_prisma_migrations"');
    run([
      prisma,
      'migrate',
      'resolve',
      '--applied',
      '20260921000000_init_postgresql',
    ]);
    run([prisma, 'migrate', 'deploy']);
    run([
      prisma,
      'migrate',
      'diff',
      '--from-config-datasource',
      '--to-schema',
      'prisma/schema.prisma',
      '--exit-code',
    ]);
    const after = await db.query(
      'SELECT "idUsuario", email FROM "Usuario" ORDER BY "idUsuario"',
    );
    assert.deepEqual(after.rows, before.rows);
    console.log(
      'OK: deploy repetido, schema sem drift, seed, integração, SQL e baseline preservando dados.',
    );
  } finally {
    if (db) await db.end();
    if (created) await admin.query('DROP DATABASE "' + name + '"');
    await admin.end();
  }
}
main().catch(() => {
  console.error(
    'Verificação não concluída. Confira PostgreSQL local, TEST_DATABASE_URL e permissão CREATEDB; nenhum reset do banco original é executado.',
  );
  process.exitCode = 1;
});
