# Mensagens e “Contrate novamente”

## Preparar a aplicação

No backend, configure `.env/.env` com seu PostgreSQL local. Pare a API antes de gerar o cliente e aplicar a migration:

```powershell
cd apps/backend
npm ci
npm run prisma:generate
npm run db:migrate:status
npm run db:migrate:deploy
npm run start:dev
```

A migration `20260930000000_sessions_messages` cria Sessao, Conversa e Mensagem, sem apagar dados existentes. Em bancos originalmente criados por `db push`, consulte o baseline em `apps/backend/prisma/README.md`; não faça reset para resolver divergências.

Em outro terminal:

```powershell
cd apps/frontend
npm ci
npm run dev
```

Abra http://localhost:3001/login e faça login novamente: uma identificação antiga em sessionStorage não é sessão válida. O proxy `/api` encaminha também o cookie de sessão; mantenha frontend na porta 3001 e backend na 3000, salvo configuração de `API_URL`.

## Demonstração com duas contas

1. Use uma conta de cliente e outra de prestador ativo, com pelo menos um serviço ativo. Caso o seed já esteja instalado, use `ana@hive.example.invalid` e `carlos@hive.example.invalid`, com a senha fictícia `HiveDemo!2026`. Não é necessário executar seed novamente.
2. No navegador habitual, entre como Ana. Em “Profissionais cadastrados”, clique em Enviar mensagem no card de Carlos; escreva um texto e confirme o envio.
3. Abra uma janela de convidado, anônima ou outro perfil de navegador e entre como Carlos. Use perfis separados: abas do mesmo perfil compartilham o cookie de login.
4. Abra Mensagens na barra lateral, selecione Ana e responda. A resposta aparece no cliente em até aproximadamente cinco segundos com ambas as janelas ativas.
5. Recarregue e reabra a conversa para conferir a persistência no PostgreSQL. O histórico não depende de sessionStorage.
6. Na conta de Ana, confira “Contrate novamente”. Só aparecem prestadores de contratações CONCLUIDAS da própria conta. O seed inclui um serviço concluído com Carlos; contas sem histórico recebem uma explicação, sem registros inventados.
7. Clique em Conversar novamente para retomar a mesma conversa. Essa ação não cria pedido, orçamento, pagamento ou contratação.
8. Clique em Sair da conta. Mensagens e histórico exigirão novo login.

Para instalar dados em um banco vazio, siga o guia de seed do backend. Nenhum comando desta página reseta ou popula automaticamente o banco da aplicação.

## Comportamento e limites

- Os cards com fotos sintéticas e distâncias ilustrativas continuam sendo uma demonstração. Os cards do banco têm iniciais até existir uma funcionalidade de foto de perfil.
- Consultas de catálogo são públicas; leitura/envio de mensagens e histórico são privados. O servidor verifica participação em cada conversa, conta ativa e validade da sessão.
- Cada mensagem admite até 2.000 caracteres. Enter quebra a linha; o botão Enviar mensagem confirma o envio. Texto vazio é recusado.
- Em falha de envio, o rascunho permanece; repetir o mesmo envio reutiliza uma chave UUID. Não há resposta automática fictícia.
- As conversas são atualizadas por polling de cinco segundos. Não há WebSocket, anexos, recibo de leitura, notificações push ou indicador “online”.
- A lista exibe até 100 conversas recentes. Cada consulta de mensagens traz 50 itens, com botão para carregar os anteriores. O histórico considera até 100 serviços distintos concluídos, deduplicados por prestador.
- Sessão expira após oito horas. No ambiente de produção, cookies exigem HTTPS. Autenticação JWT/RBAC ampla permanece no planejamento; nesta entrega a autorização é por sessão e participação.

## Testes

No frontend: `npm test`, `npm run lint`, `npm run typecheck`, `npm run build` e `npm run test:e2e`. Instale Chromium ou defina `$env:PLAYWRIGHT_CHANNEL = 'msedge'`. Encerre outros Next.js da mesma pasta antes dos testes de navegador.

No backend: `npm run test:mensagens`. O comando usa TEST_DATABASE_URL em `.env/.env.test.local` apenas para conectar ao PostgreSQL local e criar um banco descartável `hive_messages_<uuid>_test`; exige permissão CREATEDB. Aplica migrations, executa testes reais e remove somente o banco criado pelo próprio teste. Não reseta o banco configurado.

A suíte do navegador simula HTTP; a suíte do backend valida autenticação, isolamento entre contas, envio nos dois sentidos, idempotência, paginação, histórico e logout com Prisma e PostgreSQL reais.
