# Frontend — HIVE

Aplicam-se também as orientações de `../../AGENTS.md`, incluindo encerramento da branch e prompt de continuidade.

- Consulte `README.md` para execução e o guia da funcionalidade em `docs/` para requisitos. `docs/sidebar-roadmap.md` registra o escopo da barra lateral, não uma autorização para novas funcionalidades.
- Preserve o shell compartilhado, o padrão de painéis e os CSS Modules existentes. Confira desktop, celular, teclado e estados de carregamento, erro e ausência de dados nas telas alteradas.
- Mantenha interatividade nos Client Components e use os clientes HTTP de `src/services`, com validação das respostas e tratamento de sessão. A API é a autoridade sobre identidade, permissões e valores.
- Não apresente dados demonstrativos como reais. Não invente dados para contornar campos obrigatórios de contratos do backend.
- Execute comandos a partir de `apps/frontend`: `npm run dev` inicia na porta 3001. Confira processos existentes antes de iniciar outro servidor; não encerre processos de terceiros para liberar uma porta.
- Verificações usuais para código: `npm run lint`, `npm run typecheck`, `npm test` e `npm run build`. Se houver mudança de fluxo visual, execute os cenários Playwright relacionados com `npm run test:e2e -- <Spec>` e inspecione a interface. Os testes de navegador existentes podem simular a API; informe essa limitação.
- Para mudanças apenas em documentação, confira conteúdo, caminhos e diff; não rode toda a aplicação sem necessidade.
- Preserve o bloco gerado pelo Next.js abaixo. Acrescente orientações do projeto fora dele.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
