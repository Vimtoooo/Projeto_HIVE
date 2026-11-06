---
name: hive-validacao-interface
description: Validar um fluxo visual alterado no HIVE em desktop e celular, incluindo teclado, erros e sessao. Use na verificacao de telas implementadas; nao para mudancas apenas de documentacao ou backend.
---

# Validação da interface

Consulte `apps/frontend/AGENTS.md`, o guia da tela em `apps/frontend/docs` e os critérios da mudança. Use os scripts e cenários existentes em `apps/frontend/test/browser`; execute comandos a partir de `apps/frontend`.

Escolha os cenários que exercitam o comportamento alterado: caminho principal, dados vazios, carregamento, falha recuperável, sessão expirada e autorização quando aplicável. Confira teclado/foco, rótulos acessíveis e celular sem transbordamento. Não crie testes que apenas reproduzem detalhes internos da implementação.

`npm run test:e2e -- <Spec>` inicia Next.js na porta 3101. Use o navegador disponível (`PLAYWRIGHT_CHANNEL` local, ou Chromium instalado). Confira servidores existentes; não encerre processos alheios nem rode dois dev servers no mesmo `.next`. Worktrees não separam portas ou bancos.

Inspecione capturas ou a tela renderizada nos estados relevantes; teste passar não prova qualidade visual. Guarde evidências em `apps/frontend/test-results`, já ignorado. Não capture credenciais ou dados privados.

Informe comandos, resultados, viewport e limitações. Diga explicitamente quando a API foi simulada. Para testar o fluxo real com gravação, use dados fictícios em ambiente autorizado; nunca resete um banco para preparar a demonstração. Corrija defeitos do escopo, repita cenários afetados e devolva o resultado ao coordenador.
