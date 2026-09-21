import { config } from 'dotenv';
import { defineConfig } from '@prisma/config';

config({
  path: process.env.DOTENV_CONFIG_PATH || '.env/.env',
  override: true,
  quiet: true,
});

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
