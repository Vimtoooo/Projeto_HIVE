# Verificação contínua

`.github/workflows/ci.yml` roda em PRs, pushes para main e acionamento manual. Os jobs têm permissões de leitura, timeout e cancelamento de execuções substituídas. Nenhum job publica ou altera o banco de desenvolvimento.

- Backend: Node 24, instalação pelo lockfile, Prisma, lint, tipos de testes, unitários, E2E básico e build. O PostgreSQL 17 do job é descartável; as suítes criam seus próprios bancos e verificam migrations, mensagens, pedidos, notificações, perfil, catálogo, favoritos e avaliações. A senha no YAML é exclusiva desse serviço temporário e não é credencial de ambiente externo.
- Frontend: Node 24, lint, tipos, unitários, build e Playwright/Chromium. O Playwright inicia Next.js na porta 3101. Os cenários usam API simulada; não representam uma sessão integrada ao PostgreSQL. Em falha, os artefatos de teste são guardados por sete dias.
- Configuração de IA: Python, sintaxe e referências de AGENTS/CLAUDE, perfis, skills e testes do validador. Consulte `ai-config.md` para reproduzir sem dependências de IA ou credenciais.

Para reproduzir, use os comandos listados no workflow a partir da pasta de cada aplicação. Localmente, selecione seu `TEST_DATABASE_URL` e um navegador instalado conforme os READMEs. Nunca copie uma URL de produção para testes. Não rode dois Next.js dev simultâneos no mesmo diretório `.next`.

Uma execução local não comprova que o runner Linux ou o GitHub Actions passou. Registre os dois resultados separadamente. Branch protection e obrigatoriedade dos checks são configurações externas e não são alteradas por este workflow.
