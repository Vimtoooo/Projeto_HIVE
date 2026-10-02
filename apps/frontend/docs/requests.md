# Minhas solicitações

## Preparação

No terminal do backend (`apps/backend`), com o PostgreSQL configurado:

```powershell
npm run prisma:generate
npm run db:migrate:deploy
npm run start:dev
```

Em outro terminal, dentro de `apps/frontend`, execute `npm run dev`. Entre em `http://localhost:3001/login` e abra **Minhas solicitações**. A rota é `/solicitacoes`.

A migration `20261001000000_request_idempotency` adiciona uma chave UUID opcional e uma restrição única por contratante. Preserva registros existentes; não exige reset ou nova carga do seed. Os outros integrantes precisam aplicar a migration em seus próprios bancos.

## Regras do fluxo

| Estado | Cliente | Prestador responsável |
| --- | --- | --- |
| Pendente | Cancelar | Aceitar ou recusar |
| Em andamento | Cancelar | Concluir ou cancelar |
| Concluída / Cancelada | Consultar e conversar | Consultar e conversar |

- Cliente com perfil CONTRATANTE ou AMBOS solicita um serviço ativo de outro prestador com conta ativa. Conta somente PRESTADOR recebe pedidos, mas não cria pedidos como cliente.
- A criação registra o preço vigente no servidor e a forma de pagamento pretendida. O valor é exibido nos detalhes e não muda se o catálogo mudar depois. O preço visto antes do envio pode ter sido atualizado pelo prestador; confira o valor registrado.
- Aceitar muda PENDENTE para EM_ANDAMENTO. Concluir exige EM_ANDAMENTO. Recusar usa o estado CANCELADA já existente; não há um estado adicional de recusa.
- Cancelar ou recusar exige ausência de lançamentos financeiros e fatura ausente, PENDENTE ou CANCELADO. Fatura pendente é cancelada na mesma transação. Pagamento pago, parcial, estornado ou lançamento financeiro bloqueia essa ação; tratamento financeiro não faz parte desta tela.
- Apenas os participantes consultam detalhes e executam ações permitidas. Identidade e valor vêm do servidor, nunca de um ID de usuário ou preço enviado pelo navegador.
- Chave de envio evita duplicação ao repetir a mesma tentativa. Ela permanece em memória enquanto o formulário está aberto; recarregar a página inicia uma nova tentativa. Reutilizar a chave com serviço ou pagamento diferente retorna conflito.
- Transações serializáveis e comparação do estado impedem ações concorrentes de sobrescrever mudanças. Em conflito, atualize os detalhes e decida novamente.
- A conclusão alimenta o histórico **Contrate novamente** da Home. Conversar abre a mesma dupla cliente/prestador, inclusive quando o prestador inicia a conversa pelo pedido.

Não há processamento de pagamento, geração automática de fatura, agendamento estruturado, rastreamento de localização, avaliação nesta entrega. Notificações de pedidos foram adicionadas posteriormente; veja o [guia](notifications.md). Endereço e horário devem ser combinados na conversa. Os detalhes de título/descrição usam o serviço atual; o valor do pedido é o dado preservado na contratação.

## Interface e arquitetura

`RequestsWorkspace.tsx` organiza lista, filtros e detalhes; `NewRequestForm.tsx` apresenta catálogo paginado e formulário. `RequestsApi.ts` valida as respostas antes de renderizar. O shell da Home compartilha barra lateral e cabeçalho com `/mensagens` e `/solicitacoes`.

A lista usa 20 pedidos por página e filtros por estado e papel. `pedido`, `papel`, `status` e `pagina` na URL permitem recarregar e usar Voltar/Avançar. Os dados são atualizados a cada dez segundos; o botão Atualizar também permite recuperar falhas. No celular, lista e detalhes alternam com **Voltar à lista**. Confirmações ficam no painel, sem modal ou fundo borrado.

## Demonstração para o grupo

1. Com o seed já instalado, entre como `ana@hive.example.invalid` (senha fictícia `HiveDemo!2026`). Não precisa executar o seed novamente.
2. Abra **Minhas solicitações → Nova solicitação**, escolha um serviço do Carlos e confirme a forma de pagamento. Confira o valor e o estado Pendente nos detalhes.
3. Em outro perfil do navegador ou janela anônima, entre como `carlos@hive.example.invalid` com a mesma senha fictícia. Abas comuns compartilham sessão, portanto use perfis separados.
4. Abra **Pedidos recebidos**, escolha o pedido e confirme **Aceitar pedido**. Ana verá o estado Em andamento após atualização.
5. Use **Conversar** para alinhar os detalhes. Volte a solicitações e, como Carlos, confirme **Concluir serviço**. O pedido ficará Concluído e aparecerá no histórico da Ana.
6. Crie outros pedidos para demonstrar recusa e cancelamento. Pedidos encerrados não podem ser reabertos; crie um novo quando necessário.

Essas ações gravam dados reais no banco local. Para demonstração automática isolada, use os testes abaixo.

## Testes

```powershell
# Dentro de apps/backend
npm run test:solicitacoes

# Dentro de apps/frontend
$env:PLAYWRIGHT_CHANNEL = 'msedge'
npm run test:e2e -- RequestsSpec
```

O backend cria um banco temporário `hive_requests_<uuid>_test` a partir da conexão TEST_DATABASE_URL, aplica migrations e o remove ao terminar. Exige PostgreSQL local e permissão CREATEDB. O banco configurado e seus dados não são apagados.

A suíte HTTP/Prisma/PostgreSQL cobre autorização, validação, idempotência, preço preservado, aceite/conclusão, recusa/cancelamento, pagamentos, filtros, conversa e concorrência. Os testes de navegador simulam a API e cobrem a interface desktop/celular, falha recuperável, sessão expirada e confirmações. Capturas ficam em `test-results/requests-desktop.png` e `requests-mobile.png`.
