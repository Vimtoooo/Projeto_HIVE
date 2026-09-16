import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

/** Único ponto dependente do driver MySQL. Não contém regras de negócio. */
export function criarPrismaClient(
  url = process.env.DATABASE_URL,
): PrismaClient {
  if (!url) throw new Error('DATABASE_URL não foi configurada.');
  let conexao: URL;
  try {
    conexao = new URL(url);
  } catch {
    throw new Error('DATABASE_URL deve ser uma URL MySQL válida.');
  }
  if (conexao.protocol !== 'mysql:' || conexao.pathname.length < 2) {
    throw new Error('Configure uma URL mysql:// com o nome do banco.');
  }
  // Parâmetros de URL Prisma não são automaticamente opções do driver MariaDB.
  // Recusar evita ignorar silenciosamente opções de TLS ou timeouts.
  if (conexao.search) {
    throw new Error(
      'Configure opções adicionais (como TLS) na fábrica do adaptador; parâmetros de URL não são suportados aqui.',
    );
  }
  const adapter = new PrismaMariaDb({
    host: conexao.hostname,
    port: Number(conexao.port || 3306),
    user: decodeURIComponent(conexao.username),
    password: decodeURIComponent(conexao.password),
    database: decodeURIComponent(conexao.pathname.slice(1)),
    connectionLimit: 5,
    connectTimeout: 5000,
    acquireTimeout: 10000,
  });
  return new PrismaClient({ adapter });
}
