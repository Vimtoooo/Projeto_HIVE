# Notificações do HIVE

## Preparar e executar

Na pasta `apps/backend`, com o PostgreSQL local e DATABASE_URL configurada:

```powershell
$env:DOTENV_CONFIG_PATH = '.env/.env'
npm run prisma:generate
npm run db:migrate:deploy
npm run start:dev
```

Em outro terminal, em `apps/frontend`:

```powershell
npm run dev
```

Abra http://localhost:3001/notificacoes após entrar na conta. A migration cria `Notificacao` e seus índices/FKs, sem apagar usuários, pedidos ou mensagens. Se aparecer P2021 para essa tabela, pare a API, confira o banco selecionado, execute os comandos acima e reinicie. Gerar o client sozinho não cria tabelas.

## Demonstrar com duas contas

1. Use uma conta contratante e uma prestadora ATIVAS do mesmo banco, em perfis separados do navegador ou uma janela normal e outra anônima. Abas comuns compartilham o cookie; não servem para manter duas identidades independentes.
2. Como cliente, crie um pedido real em **Minhas solicitações**, usando um serviço ativo do prestador. O prestador recebe **Nova solicitação de serviço**; o cliente não recebe aviso de sua própria ação.
3. Como prestador, aceite o pedido. O cliente recebe **Solicitação aceita**. Conclua para gerar **Serviço concluído**; use outros pedidos para demonstrar recusa ou cancelamento. Cada ação notifica somente a contraparte.
4. Abra uma conversa entre as duas contas e envie uma mensagem. A outra conta recebe **Nova mensagem**, identificando o contato, sem duplicar o corpo da conversa.
5. Abra **Notificações** pelo sino ou pela barra lateral. Selecione um item: os detalhes aparecem no painel e a leitura é gravada. Recarregue para confirmar sua persistência.
6. Combine **Mensagens** ou **Solicitações** com **Não lidas**. Use **Abrir conversa** ou **Ver solicitação** para navegar à origem. O pedido abre com o papel de cliente/prestador correto.
7. **Marcar todas como lidas** inclui todas as categorias até o limite da consulta atual, inclusive outras páginas. Avisos que chegarem com IDs maiores continuam não lidos. O contador representa toda a conta, não apenas o filtro exibido.

A lista começa vazia para eventos anteriores à entrega. Seed e inserções diretas no banco não percorrem os serviços de mensagens/solicitações e, portanto, não geram avisos. Crie os eventos pela aplicação para demonstrar.

## Interface e atualização

A página mantém os painéis laterais e cabeçalho do HIVE. Desktop mostra lista e detalhe; no celular, selecione um aviso e use **Voltar às notificações**. Não há sobreposição com fundo borrado.

Filtros: Todas, Solicitações, Mensagens e checkbox Não lidas. A lista mostra até 20 itens; **Mais antigas** conserva o limite da primeira consulta e usa cursor por ID, evitando duplicação quando chegam avisos novos. **Mais recentes** retoma o início. A API permite até 50 por página.

O resumo é consultado a cada 10 segundos em aba visível e ao recuperar foco. Sino, navegação e página compartilham o estado. A lista acompanha esse ciclo; o intervalo não representa entrega instantânea. Erros de rede preservam os dados já carregados e oferecem nova tentativa. A leitura só é exibida como concluída após confirmação do servidor. Sessão expirada pede login; mudanças de conta descartam os dados anteriores.

## Decisões técnicas

- Notificações pertencem ao destinatário da sessão, com tipo, chave do evento, título, descrição breve, criação e leitura opcionais. Não são recebidas pelo autor da operação.
- A criação participa da transação de mensagem/pedido. Falhar a notificação reverte o evento; falhar o evento não deixa aviso solto. Uma chave única por usuário/evento reforça a idempotência.
- Repetir mensagem/pedido com a mesma chave não cria novos avisos, não redefine leitura e não reconstrói eventos históricos que não tinham notificação.
- Recusa e cancelamento têm eventos distintos, embora o pedido use CANCELADA nos dois casos. A ação efetiva define o tipo.
- Origem e usuário usam FKs com cascata. Excluir a origem remove o aviso; uma exclusão concorrente é tratada como recurso indisponível.
- Ler aviso não confirma leitura de mensagem nem muda pedido. Abrir uma conversa diretamente também não marca todos os avisos dela.
- Não há e-mail, SMS, push, WebSocket, promoção ou rastreamento. Perfil e Ajuda seguem para entregas separadas.

Contratos completos no [backend](../../backend/README.md#notificações-persistentes). O [plano original](notifications-plan.md) preserva as decisões que orientaram a entrega.

## Testes

No backend (PostgreSQL local com CREATEDB):

```powershell
$env:DOTENV_CONFIG_PATH = '.env/.env.test.local'
npm run test:notificacoes
npm run test:mensagens
npm run test:solicitacoes
```

O teste cria seu banco descartável; não reseta o banco configurado. Cobre destinatários, transições, concorrência, ausência de duplicação, isolamento, CSRF, leitura, filtros, cursor, cascata e rollback. Logs de falha simulada são intencionais.

No frontend:

```powershell
npm run lint
npm run typecheck
npm test
npm run test:e2e -- NotificationsSpec
npm run build
```

Playwright usa API simulada, gera capturas desktop/celular em `test-results/` e cobre navegação, filtros, leitura/lote, retry, sessão expirada e mudança de conta. Para usar Edge instalado, defina `$env:PLAYWRIGHT_CHANNEL = 'msedge'`. Encerre o dev da mesma pasta antes do build.
