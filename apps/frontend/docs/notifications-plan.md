# Plano da seção de notificações

**Estado: planejamento, sem implementação.** Branch: `feat/funcoes-barra-lateral`.

## Objetivo e base existente

Criar `/notificacoes` com a mesma navegação lateral e cabeçalho de Home, Mensagens e Minhas solicitações. O conteúdo principal será uma lista de avisos com painel de detalhes, seguindo o protótipo do grupo; não será uma janela sobreposta com fundo borrado.

O backend já possui `SessionGuard`, mensagens com chave de idempotência e solicitações com transições transacionais. O schema atual não possui notificações nem estado de leitura. Os pontos de integração serão `RequestsService.create`, `RequestsService.act` e `MessagingService.send`. O plano reaproveita esses fluxos; não introduz um serviço externo de entrega.

## Eventos e destinatários

| Evento confirmado no banco | Quem recebe | Destino da ação |
| --- | --- | --- |
| Nova solicitação | Prestador responsável | Detalhes do pedido recebido |
| Pedido aceito | Contratante | Detalhes do pedido feito |
| Pedido recusado | Contratante | Detalhes do pedido encerrado |
| Serviço concluído | Contratante | Detalhes do pedido concluído |
| Cancelamento pelo cliente | Prestador | Detalhes do pedido recebido |
| Cancelamento pelo prestador | Contratante | Detalhes do pedido feito |
| Nova mensagem | Outro participante da conversa | Conversa correspondente |

Não enviar aviso ao autor da própria ação. Recusa e cancelamento serão textos distintos, embora ambos usem CANCELADA na contratação: o tipo será registrado a partir da ação efetivamente executada, e não inferido posteriormente do estado final.

Tentativas rejeitadas, transações revertidas, abertura de conversa sem mensagem e simples consultas não geram notificações. Repetir um envio ou a criação de um pedido com a mesma chave não cria outro aviso e não redefine sua leitura.

## Experiência de uso

- Entrada **Notificações** na barra lateral e sino do cabeçalho levam à mesma página, com seção ativa e contador de avisos não lidos da conta.
- Filtros **Todas**, **Não lidas**, **Solicitações** e **Mensagens**, combinando categoria e leitura. Categorias sem eventos implementados, como promoções, não aparecerão como funções disponíveis.
- Lista paginada, mais recentes primeiro, com ícone, título, descrição breve, data/hora e indicação visual e textual de não lida. Paginação não pode repetir ou pular registros devido a novos avisos.
- Selecionar um item abre seus detalhes no painel à direita e solicita sua marcação como lido. Se a gravação falhar, o estado permanece não lido e a tela oferece nova tentativa.
- Botões contextuais **Ver solicitação** ou **Abrir conversa** levam às páginas existentes, com o registro selecionado e o papel correto. Não haverá links arbitrários fornecidos por clientes.
- **Marcar todas como lidas** atua sobre os avisos da conta até o limite da lista consultada, independentemente do filtro de categoria. O botão explicará esse alcance; notificações de IDs posteriores ao limite permanecem não lidas.
- Estado vazio, carregamento, erro recuperável, sessão expirada e recurso de origem removido terão mensagens claras. Falhar ao carregar não será exibido como “nenhuma notificação”.
- No celular, a lista e os detalhes alternam com **Voltar às notificações**; sem rolagem horizontal. Teclado, foco visível, nomes acessíveis e contraste serão revisados.
- Atualização proposta a cada dez segundos enquanto a aba estiver visível, com atualização ao recuperar foco. A lista, o sino e o contador lateral compartilharão a mesma fonte de estado para evitar consultas duplicadas e números divergentes. Logout/troca de conta limpa o estado anterior.

Ler um aviso não altera o pedido nem equivale a um recibo de leitura de mensagem. Abrir a conversa diretamente não marcará automaticamente todos os seus avisos como lidos nesta primeira entrega.

## Persistência e API propostas

Adicionar um modelo Prisma `Notificacao` por destinatário, contendo ID, usuário destinatário, tipo do evento, chave do evento, título/descrição curta, criação, leitura opcional e referência à contratação ou mensagem/conversa. Relacionamentos devem preservar integridade: remover uma origem elimina os avisos vinculados por cascata; a interface também tratará remoções concorrentes com 404. Exclusão do usuário remove seus avisos.

Usar unicidade em `(usuarioId, chaveEvento)` e índices para consultas da conta por leitura e ordenação. A chave virá de entidades/ações persistidas: ID de mensagem ou ID de contratação + evento, nunca de texto livre enviado pelo navegador. Títulos e descrições serão produzidos pelo servidor; a notificação de mensagem identificará o contato sem duplicar o corpo da conversa.

A inserção do aviso deve participar da **mesma transação** do evento. O serviço de notificações receberá o cliente transacional do Prisma; não abrirá uma transação independente dentro dela. Uma repetição idempotente reutiliza o aviso sem mudar `lidaEm`. Não será necessário fila/outbox enquanto tudo for persistência interna no mesmo banco.

| Contrato proposto | Comportamento |
| --- | --- |
| `GET /notificacoes` | Lista da sessão com categoria, leitura e paginação por cursor; retorna limite de leitura em lote |
| `GET /notificacoes/resumo` | Contagem de não lidas da conta, independente do filtro |
| `GET /notificacoes/:id` | Detalhes exclusivos do destinatário |
| `POST /notificacoes/:id/lida` | Marca como lida de forma idempotente |
| `POST /notificacoes/ler-todas` | Marca avisos da conta até `ateId`, obtido no snapshot consultado |

Rotas fixas devem ser declaradas sem conflito com `:id`. DTOs validarão enums, cursores e limites de página (proposta: 20 por página, máximo 50). O servidor determinará o destinatário pela sessão: não aceitará `usuarioId` para leitura ou alteração. Escritas exigirão o header `X-Hive-Request: 1` e os guards existentes. Respostas de outra conta retornarão 404, sem confirmar a existência do aviso.

## Organização proposta

- Backend: módulo `src/notifications/` com controller, DTOs e serviço; registro no `AppModule` e integração transacional com os módulos existentes, evitando dependências circulares.
- Prisma: migration aditiva, sem reset e sem mudar registros antigos de contratação ou mensagem.
- Frontend: rota `src/app/notificacoes/page.tsx`, componentes em `src/components/notifications/`, cliente `NotificationsApi.ts` com validação em runtime, estado compartilhado de avisos e CSS Module próprio.
- Navegação: substituir o aviso “Em breve” e a caixa atual por acesso à página, mantendo Mensagens e Solicitações funcionais.

Não reconstruir notificações de eventos anteriores à migration: estados atuais não informam com precisão todas as ações, autores e datas passadas. A conta começa sem avisos e recebe os novos eventos realizados após a implementação. Repetições de envios antigos sem aviso não farão retrocarga. A demonstração usará duas contas fictícias e ações reais; fixtures automatizadas ficarão em banco descartável.

## Sequência de execução

1. Escrever os testes de integração dos eventos, destinatários, leitura e duplicação para orientar o comportamento esperado.
2. Criar modelo/migration e módulo de notificações; integrar a gravação aos eventos nas mesmas transações e validar rollback, concorrência e idempotência.
3. Implementar a página, lista, filtros, detalhes e estados acessíveis, seguindo as referências já fornecidas.
4. Conectar sino/contador, polling compartilhado, marcação de leitura e atalhos para pedidos/conversas.
5. Testar o fluxo completo com contas separadas, revisar capturas desktop/celular e executar as regressões.
6. Atualizar os README essenciais e criar um guia de notificações com preparação, limites e roteiro para o professor.
7. Criar um commit da seção concluída e **parar antes de implementar Perfil, Ajuda ou outra seção**.

## Critérios de aceite e testes

- Cliente cria pedido: somente o prestador recebe um aviso. Prestador aceita, recusa ou conclui: somente o cliente recebe. Cancelamento notifica a contraparte correta.
- Mensagem nos dois sentidos gera aviso apenas ao destinatário. Repetição da mensagem/pedido não duplica notificações, incluindo tentativas concorrentes.
- Falha de gravação do aviso reverte também a operação de origem; nenhuma notificação persiste para uma operação que falhou.
- Sessão ausente/expirada, CSRF, IDs forjados e alteração de avisos de outra conta são bloqueados. Não expor CPF, senha, tokens ou conteúdo privado adicional.
- Leitura individual e em lote persistem ao recarregar; marcações repetidas não alteram a primeira data de leitura. Avisos posteriores ao limite enviado para leitura em lote permanecem não lidos.
- Filtros, cursor, contagem e ordenação funcionam com múltiplas páginas, novos eventos e exclusão de origem. Contador nunca é obtido apenas do tamanho da página atual.
- Interface recupera erro de rede sem apagar a lista indevidamente, limpa dados na troca de conta e mantém consistência entre lista e contadores.
- Testes de navegador com API simulada cobrem navegação sem modal, leitura, filtros, estados vazios/erro, atalhos, teclado e larguras desktop/celular. Integração HTTP/Prisma/PostgreSQL usa banco descartável.
- Executar também as suítes existentes de mensagens e solicitações, lint, TypeScript e builds. Não aplicar a migration no banco da aplicação antes de validá-la no banco de testes.

## Limites desta etapa

A entrega será de notificações **dentro do HIVE**, persistidas no PostgreSQL. Push do navegador, email, SMS, WebSocket, promoções, rastreamento do prestador, preferências de canais, recibos de leitura e avisos de recursos não implementados ficam para outras etapas. O intervalo de atualização será explicado no guia técnico, sem prometer entrega instantânea.

Este documento é o planejamento para a próxima implementação. Nenhum endpoint, tabela, evento, teste ou componente de notificações foi criado nesta etapa de planejamento.
