import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

config({
  path: process.env.DOTENV_CONFIG_PATH || '.env/.env',
  quiet: true,
});
if (!process.env.DATABASE_URL) {
  config({ path: '.env/.env', quiet: true });
}

/** Único ponto dependente do driver PostgreSQL. Não contém regras de negócio. */
export function criarPrismaClient(
  url = process.env.DATABASE_URL,
): PrismaClient {
  if (!url) throw new Error('DATABASE_URL não foi configurada.');
  let conexao: URL;
  try {
    conexao = new URL(url);
  } catch {
    throw new Error('DATABASE_URL deve ser uma URL PostgreSQL válida.');
  }
  if (
    !['postgres:', 'postgresql:'].includes(conexao.protocol) ||
    conexao.pathname.length < 2
  ) {
    throw new Error('Configure uma URL postgresql:// com o nome do banco.');
  }
  const adapter = new PrismaPg(url);
  return new PrismaClient({ adapter });
}
