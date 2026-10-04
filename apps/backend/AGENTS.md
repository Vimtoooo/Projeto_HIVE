# Backend — HIVE

Aplicam-se também as orientações de `../../AGENTS.md`, incluindo encerramento da branch e prompt de continuidade.

- Consulte `README.md` para ambiente e execução, `docs/CATALOGO-API.md` para cadastro/catálogo, `docs/AUTENTICACAO.md` para sessão e `prisma/README.md` para schema, migrations e seed, conforme a tarefa.
- Preserve a organização existente dos módulos NestJS. Valide entradas nos DTOs e autorização no servidor; não aceite identidade da conta ou valores confiáveis apenas porque vieram do frontend.
- Use seleções explícitas para respostas públicas e mantenha dados privados fora do contrato.
- Alterações que precisam ser atômicas, como gravação do evento e sua notificação, devem compartilhar a mesma transação. Considere duplicidade e concorrência em operações de escrita.
- Para mudanças no schema, crie migrations compatíveis com os dados existentes e gere o Prisma Client. Não use reset ou `db push` como substituto das migrations documentadas.
- Execute comandos a partir de `apps/backend`. Verificações usuais: `npm run lint:check`, `npm run build` e `npm test -- --runInBand`; se alterar testes, confira `npx tsc --project test/tsconfig.json`.
- Escolha a suíte de integração relacionada no `package.json`, como `test:solicitacoes`, `test:notificacoes` ou `test:avaliacoes`. Confira o script e o ambiente de teste; os scripts documentados criam e removem seus próprios bancos descartáveis.
- Falha de ambiente deve ser diferenciada de falha de código. Não altere regras da aplicação para contornar credenciais, permissões ou indisponibilidade do PostgreSQL.
- Atualize os contratos/guias afetados. Concluídos os critérios e verificações, siga o fechamento da raiz sem ampliar o escopo.
