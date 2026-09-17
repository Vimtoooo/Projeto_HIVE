import { criarPrismaClient } from '../src/persistence/prisma-client.factory';
import { limparDados } from '../test/support/limpar-dados';

async function main() {
  const id = process.argv[2];
  if (
    !id ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(
      id,
    )
  ) {
    throw new Error('Informe o UUID exibido pela demonstração.');
  }
  const url = process.env.TEST_DATABASE_URL;
  if (!url || !new URL(url).pathname.endsWith('_test')) {
    throw new Error(
      'Use npm run test:persistencia:limpar -- UUID com o banco de testes configurado.',
    );
  }
  const prisma = criarPrismaClient(url);
  try {
    const emails = [
      'cliente',
      'prestador',
      'identidade',
      'sentinela',
      'rollback-a',
      'rollback-b',
      'relacao',
      'repetido',
      'api',
      'api-invalido',
      'api-duplicado',
      'api-rollback',
      'api-filtros',
      // Lote de exemplos REST Client: emails exatos, sem apagar outros cadastros.
      ...Array.from(
        { length: 10 },
        (_, i) => `api-http${String(i + 1).padStart(2, '0')}`,
      ),
      'api-http-invalid',
    ].map((rotulo) => `${rotulo}.${id}@example.invalid`);
    const antes = await prisma.usuario.count({
      where: { email: { in: emails } },
    });
    await limparDados(prisma, emails);
    console.log(
      `Execução ${id}: ${antes} usuários fictícios e seus registros relacionados removidos.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch(() => {
  console.error(
    'Limpeza não concluída. Confira o UUID, a conexão e se os registros possuem vínculos adicionais.',
  );
  process.exitCode = 1;
});
