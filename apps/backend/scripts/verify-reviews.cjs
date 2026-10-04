// Only creates/drops its own generated disposable database, never resets the configured DB.
const { randomUUID } = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { Client } = require('pg');
const { resolve } = require('node:path');
process.chdir(resolve(__dirname, '..'));
require('dotenv').config({
  path: process.env.DOTENV_CONFIG_PATH || '.env/.env.test.local',
  quiet: true,
});
async function main() {
  const url = new URL(process.env.TEST_DATABASE_URL || '');
  if (
    !['postgres:', 'postgresql:'].includes(url.protocol) ||
    !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
    !url.pathname.endsWith('_test') ||
    process.env.NODE_ENV === 'production'
  )
    throw new Error('Destino de teste inválido.');
  const admin = new Client({ connectionString: url.href });
  const name = 'hive_reviews_' + randomUUID().replaceAll('-', '') + '_test';
  let created = false;
  await admin.connect();
  try {
    await admin.query('CREATE DATABASE "' + name + '"');
    created = true;
    url.pathname = '/' + name;
    const env = {
      ...process.env,
      DATABASE_URL: url.href,
      TEST_DATABASE_URL: url.href,
    };
    for (const args of [
      ['node_modules/prisma/build/index.js', 'migrate', 'deploy'],
      [
        'node_modules/prisma/build/index.js',
        'migrate',
        'diff',
        '--from-config-datasource',
        '--to-schema',
        'prisma/schema.prisma',
        '--exit-code',
      ],
      [
        'node_modules/jest/bin/jest.js',
        '--config',
        'test/jest-reviews.json',
        '--runInBand',
      ],
    ]) {
      const result = spawnSync(process.execPath, args, {
        env,
        stdio: 'inherit',
        timeout: 120000,
      });
      if (result.status !== 0) throw new Error('Verificação falhou.');
    }
  } finally {
    if (created) await admin.query('DROP DATABASE "' + name + '"');
    await admin.end();
  }
}
main().catch(() => {
  console.error(
    'Teste não concluído. Confira PostgreSQL local, TEST_DATABASE_URL e permissão CREATEDB. O banco configurado não é apagado.',
  );
  process.exitCode = 1;
});
