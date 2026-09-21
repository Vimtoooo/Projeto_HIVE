import { config } from 'dotenv';
import { defineConfig } from '@prisma/config';

config({
  path: process.env.DOTENV_CONFIG_PATH || '.env/.env',
  override: false,
  quiet: true,
});

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations', seed: 'ts-node prisma/seed.ts' },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
