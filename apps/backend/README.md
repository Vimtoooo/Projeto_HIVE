# Backend do HIVE

API REST NestJS com Prisma 7 e PostgreSQL, integrada ao frontend Next.js. Oferece cadastro de clientes e prestadores, catálogo, login por sessão HTTP-only, mensagens persistentes, solicitações de serviços com criação, aceite/recusa, conclusão e cancelamento, além de notificações por conta desses eventos.

## Preparar o ambiente

Execute os comandos desta página em `apps/backend`. O ambiente atual utiliza Node.js 24, npm 11 e PostgreSQL (MySQL pertence à implementação anterior); as versões de dependências
resolvidas estão em `package-lock.json`.

```powershell
npm ci
```

Você pode manter vários arquivos de ambiente dentro de uma pasta `.env/` para
evitar poluir a raiz do backend. Uma organização possível é:

```text
.env/
|- .env                 # aplicação local
|- .env.example         # modelo da aplicação
|- .env.test.local      # testes locais
`- .env.test.example    # modelo dos testes
```

Crie `.env/.env` manualmente, com suas credenciais locais:

```dotenv
DATABASE_URL="postgresql://SEU_USUARIO:SUA_SENHA@localhost:5432/hive"
PORT=3000
```

Não versione os arquivos locais. Os modelos `*.example` podem ser versionados
se não contiverem segredos. Caracteres especiais nas credenciais devem ser
codificados para URL.

Como o arquivo está dentro de `.env/`, carregue-o antes de iniciar a API. No
PowerShell, execute estes comandos na pasta `apps/backend`:

```powershell
$env:DOTENV_CONFIG_PATH = '.env/.env'
$env:PORT = '3000'
```

No Git Bash, use a sintaxe equivalente:

```bash
export DOTENV_CONFIG_PATH='.env/.env'
export PORT='3000'
```

Essas variáveis permanecem somente no terminal atual. Se abrir outro terminal,
repita os comandos.

Crie o banco da aplicação no PostgreSQL e gere o client:

```powershell
npm run prisma:generate
npm run prisma:validate
```

Para preparar um banco novo ou atualizar um banco com migrations já registradas, aplique as migrations e inicie a API:

```powershell
npm run db:migrate:deploy
npm run start:dev
```

Se o banco foi criado anteriormente com `db push`, confira o schema e faça o baseline conforme o guia do Prisma antes de aplicar migrations; não use reset para resolver a divergência. Para carga fictícia, use o seed local protegido abaixo. Veja o
[README do Prisma](prisma/README.md) para distinguir client, schema e inserções.

A conexão atual usa PostgreSQL via `@prisma/adapter-pg`, normalmente na porta 5432.
As opções `MYSQL_LOCAL_PUBLIC_KEY_RETRIEVAL` e `MYSQL_SERVER_PUBLIC_KEY` pertencem
à implementação anterior e não são usadas por este adaptador.

Para executar a versão compilada:

```powershell
$env:DOTENV_CONFIG_PATH = '.env/.env'
$env:PORT = '3000'
npm run build
npm run start:prod
```

### Ambiente de testes

Para os testes, coloque a URL do banco exclusivo em `.env/.env.test.local`:

```dotenv
TEST_DATABASE_URL="postgresql://SEU_USUARIO:SUA_SENHA@localhost:5432/hive_test"
```

No PowerShell, em `apps/backend`, selecione o ambiente de testes antes de executar os modos abaixo. O script carrega `.env/.env.test.local` por padrão e respeita `DOTENV_CONFIG_PATH`:

```powershell
$env:DOTENV_CONFIG_PATH = '.env/.env.test.local'
$env:PORT = '3000'
node -r dotenv/config scripts/test-database.cjs prepare
node -r dotenv/config scripts/test-database.cjs test
node -r dotenv/config scripts/test-database.cjs api
node -r dotenv/config scripts/test-database.cjs serve
```

No Git Bash, use `export DOTENV_CONFIG_PATH='.env/.env.test.local'` e
`export PORT='3000'`, seguidos dos mesmos comandos Node.

O modo `serve` mantém a API ligada ao banco de testes e executa
`src/main.ts` via ts-node, sem exigir build. Somente `start:prod` usa
`dist/src/main` e requer compilação prévia. Use um banco terminado em
`_test`, diferente do principal. Não é necessário copiar a senha para o terminal.

Os comandos npm de teste também funcionam com a pasta `.env/`. Para outro caminho, ajuste `DOTENV_CONFIG_PATH`. Se preferir chamar o script diretamente, use o prefixo `node -r dotenv/config scripts/test-database.cjs` e o modo correspondente:
`prepare`, `test`, `api`, `demo`, `api-demo`, `serve` ou `clean UUID`.

## Requisições manuais no VS Code

A pasta [http](http/README.md) contém exemplos para cadastro, busca e validação
com REST Client. Use a API iniciada por `npm run start:demo` para gravar apenas
no banco de testes. Os exemplos têm dados fictícios e instruções de limpeza.
Veja o [guia de requisições HTTP](http/README.md) para criar seus próprios
blocos `POST` e `GET`.

## Rotas disponíveis

| Método e rota | Comportamento |
| --- | --- |
| `POST /clientes` | Cria uma conta de contratante com senha protegida; retorna 201 |
| `POST /prestadores` | Cria Usuario, Prestador e o primeiro Servico juntos; retorna 201 |
| `GET /servicos` | Busca pública com filtros, paginação e retorno somente de campos públicos |
| `POST /login` | Confere email, senha scrypt e conta ativa; cria cookie de sessão e retorna 201 com dados públicos, ou 401 para credenciais rejeitadas |
| `GET /` | Verificação básica já existente; retorna Hello World! |

As rotas de sessão, logout, conversas e histórico estão em [Mensagens e histórico autenticados](#mensagens-e-histórico-autenticados); as de contratação em [Solicitações de serviços](#solicitações-de-serviços).

O POST de `/prestadores` exige dados pessoais, dados profissionais e o objeto `servico`.
O GET aceita `texto`, `areaAtuacao`, `precoMin`, `precoMax`, `prestadorId`,
`pagina` e `limite`. O [contrato da API](docs/CATALOGO-API.md) detalha os campos,
limites, exemplos JSON e respostas 400, 409, 503 e 500.

## Login integrado ao frontend

Crie a conta com `POST /clientes`, `POST /prestadores` ou pelo seed no mesmo banco usado pela API.
O [guia do frontend](../frontend/README.md#criar-a-conta-antes-do-login) contém
um POST fictício e o roteiro para abrir a tela e confirmar o redirecionamento.
O login recebe `{"email":"...","senha":"..."}` e retorna `idUsuario`,
`nome`, `email` e `tipoUsuario`, sem retornar o hash.

A verificação de senha usa scrypt com salt e comparação com timingSafeEqual.
O login usa DTO validado e cria sessão HTTP-only com duração de oito horas.
Inclua `X-Hive-Request: 1` no login e em operações autenticadas de escrita.
A Home permite exploração pública; conversas, histórico e solicitações são protegidos pelo backend.

## Arquitetura e motivos das mudanças

| Camada | Responsabilidade e motivo |
| --- | --- |
| `src/catalog/servico.controller.ts` | Recebe POST/GET e delega ao serviço, seguindo o diagrama de sequência |
| `src/catalog/catalogo.dto.ts` | Valida formatos, limites e campos extras antes de executar regras ou acessar o banco |
| `src/catalog/servico.service.ts` | Coordena o cadastro e a busca, verifica intervalo de preços e traduz erros para HTTP |
| `src/catalog/servico.repository.ts` | Define consultas e projeções públicas; evita expor senha, documentos e contato |
| `src/auth/` | Login, senha, sessões HTTP-only, logout e guard de autorização |
| `src/cliente/` | Cadastro validado de contratantes |
| `src/messaging/` | Mensagens, acesso por participante e histórico de serviços concluídos |
| `src/requests/` | Pedidos, preço registrado, transições, idempotência e proteção financeira |
| `src/models/` | Mantém as classes Prestador/Servico e demais regras de domínio já utilizadas nos testes |
| `src/persistence/` | Reutiliza transações, gravação das classes, conexão e adaptador do banco |

`AppModule` registra os módulos de persistência, catálogo, clientes, autenticação, mensagens, solicitações e notificações, além de um `ValidationPipe` global com transformação,
whitelist e rejeição de campos desconhecidos. `class-validator` e
`class-transformer` fornecem a validação em tempo de execução; tipos TypeScript
sozinhos não validam um JSON recebido pela rede.

O cadastro usa uma transação para impedir perfis ou serviços parciais. Os IDs
são gerados pelo banco, não pelos contadores das classes. Email, CPF e CNPJ
únicos evitam duplicidade; uma colisão retorna 409 sem sobrescrever dados.

A senha é transformada em hash scrypt com salt. A busca seleciona explicitamente
os campos públicos, retorna somente serviços e contas ativos e ordena por ID.
A lista e sua contagem são consultadas na mesma transação com RepeatableRead.

A fábrica do client agora concentra o driver PostgreSQL, sem espalhar
configuração de conexão pelos controllers. A troca do adaptador não
elimina a necessidade de migrar schema, SQL e dados; veja [Prisma](prisma/README.md).

## Correções do editor e qualidade

- Models, enums e demonstração manual foram formatados conforme Prettier, mantendo o ESLint habilitado.
- Foi retirado o cast desnecessário em Usuario; datas em mensagens são convertidas explicitamente para texto.
- `module` e `moduleResolution` usam `Node16`, mantendo CommonJS neste pacote e removendo a resolução legada `node`.
- `test/tsconfig.json` declara os tipos de Node/Jest para reconhecer describe, it, expect e hooks no editor.

```powershell
npm run lint:check
npx tsc --project test/tsconfig.json
npm test -- --runInBand
npm run test:e2e -- --runInBand
```

`lint:check` não altera arquivos. `npm run lint` aplica correções automáticas.
Se persistirem avisos antigos, selecione a versão TypeScript do workspace e
reinicie os servidores TypeScript e ESLint pela paleta de comandos do VS Code.

## Testes reais e demonstração

Configure um banco separado com nome terminado em `_test` e `.env.test.local`,
conforme o [README dos testes](test/README.md). Depois execute:

```powershell
npm run test:db:prepare
npm run test:persistencia
npm run test:catalogo
```

São cinco testes de persistência e dez testes HTTP de catálogo. As suítes
normais removem somente os registros da própria execução. Para apresentação:

```powershell
npm run test:catalogo:visualizar
npm run start:demo
```

O primeiro comando preserva um cadastro e imprime seu UUID. O segundo mantém a
API real ligada ao banco de testes, sem alterar `.env`. Abra
`http://localhost:3000/servicos?texto=UUID_DA_EXECUCAO` usando o UUID recebido.
Pare a API com Ctrl+C; limpe a execução usando o comando exibido pelo teste.
O [roteiro completo](docs/CATALOGO-API.md#apresentação-para-o-grupo-e-o-professor)
inclui consultas para conferir os dados; no PostgreSQL, use pgAdmin, psql ou SQLTools com conexão PostgreSQL.

## Limites atuais

O cadastro abre uma nova conta com seu serviço inicial; não adiciona serviços a
contas existentes. Novos cadastros ficam ativos nesta etapa acadêmica.
Autenticação por sessão e autorização por participante já existem. JWT/RBAC amplo, aprovação de cadastros e limitação de requisições continuam planejados; o estado atual é voltado à demonstração acadêmica.

CPF/CNPJ têm validação de tamanho, não verificação fiscal. Valores monetários
continuam como Float. Contratação já possui rotas e interface; pagamento e avaliação permanecem nas classes/persistência, sem fluxo HTTP próprio. O método Usuario.autenticar não
é o responsável pelo login da API; essa responsabilidade está em AuthService.

## Documentação complementar

- [Plano original de cadastro e busca](docs/PLANO-CADASTRO-BUSCA.md)
- [Solicitações: regras, interface e demonstração com duas contas](../frontend/docs/requests.md)
- [Entregas da barra lateral](../frontend/docs/sidebar-roadmap.md)
- [Persistência: transações, relações e limitações](docs/PERSISTENCIA.md)
- [Prisma: schema, migrations e troca de banco](prisma/README.md)
- [Segurança e sincronização após limpeza do histórico](docs/SEGURANCA-HISTORICO.md)

O HIVE segue a [licença do repositório](../../LICENSE); as licenças das dependências
continuam aplicáveis a seus respectivos códigos.

## Recriar dados fictícios para apresentação

O [guia do seed local](prisma/README.md#seed-local-para-apresentação) explica
`db:seed:local` e `db:reset:local`, com contas prontas para login e oito tabelas
populadas. O reset exige confirmação do nome do banco e substitui seus dados
em uma transação. Aceita o banco local `hive` e bancos terminados em `_local` ou `_test`.

## Histórico de migrations PostgreSQL

Para bancos novos, use `npm run db:migrate:deploy` e confira
`npm run db:migrate:status`. Bancos preparados anteriormente com `db push`
precisam da conferência de schema e do baseline descritos no
[guia do Prisma](prisma/README.md#preparação-para-postgresql), sem reset.
O SQL MySQL está arquivado; os dados fictícios podem ser recriados com o seed.

## Mensagens e histórico autenticados

Após `npm run prisma:generate`, aplique `npm run db:migrate:deploy` para criar Sessao, Conversa e Mensagem. O módulo `src/messaging` usa o Prisma e verifica os participantes em cada operação. O histórico reaproveita Contratacao e inclui apenas serviços CONCLUIDOS da conta autenticada.

| Endpoint | Finalidade |
| --- | --- |
| GET /sessao | Dados públicos da conta da sessão |
| POST /logout | Revoga a sessão e limpa o cookie |
| GET /conversas | Até 100 conversas recentes da conta |
| POST /conversas | Inicia/reutiliza conversa com prestador ativo |
| GET /conversas/:id/mensagens?antes=ID | Página de até 50 mensagens |
| POST /conversas/:id/mensagens | Envia texto com chave UUID de idempotência |
| GET /contratacoes/anteriores | Prestadores de serviços concluídos do contratante |

Consulte [autenticação](docs/AUTENTICACAO.md), [exemplos HTTP](http/messages.http) e [demonstração ponta a ponta](../frontend/docs/messages.md). Execute `npm run test:mensagens` para testar com banco descartável, sem reset do banco local.

## Solicitações de serviços

O módulo `src/requests` implementa o fluxo autenticado de contratação. Aplique a migration `20261001000000_request_idempotency` com `npm run db:migrate:deploy` e gere o cliente com `npm run prisma:generate`. A alteração é aditiva e preserva as contratações existentes.

| Endpoint | Finalidade |
| --- | --- |
| GET /solicitacoes | Lista paginada da sessão; filtros `papel=cliente/prestador`, `status`, `pagina`, `limite` (máximo 50) |
| GET /solicitacoes/:id | Detalhes e ações permitidas, somente para participantes |
| POST /solicitacoes | Cria pedido PENDENTE com `servicoId`, `formaPagamento`, `chave` UUID v4 |
| POST /solicitacoes/:id/acao | Executa `acao`: ACEITAR, RECUSAR, CONCLUIR ou CANCELAR |
| POST /solicitacoes/:id/conversa | Obtém/cria a conversa da dupla cliente/prestador |

Mutações exigem cookie de sessão e `X-Hive-Request: 1`. O servidor determina contratante e preço. Aceite/conclusão são exclusivos do prestador responsável; cancelamento é permitido aos participantes nos estados não finais, respeitando bloqueios financeiros. Não cria cobranças ou faturas automaticamente.

A chave única por contratante evita duplicações, e a transação serializável protege as mudanças concorrentes de estado. Listas usam seleção explícita de campos públicos entre participantes; CPF, senha, email e tokens não são retornados. Veja [regras e roteiro com duas contas](../frontend/docs/requests.md).

### Validar mensagens e solicitações

Em `apps/backend`, selecione o arquivo que contém TEST_DATABASE_URL:

```powershell
$env:DOTENV_CONFIG_PATH = '.env/.env.test.local'
npm run test:mensagens
npm run test:solicitacoes
```

Os executores criam bancos temporários próprios, aplicam migrations, verificam o schema e executam testes HTTP com Prisma/PostgreSQL reais. Exigem PostgreSQL local e permissão CREATEDB; removem apenas os bancos criados pelo teste, sem popular ou resetar o banco da aplicação.

A suíte de solicitações cobre autorização, validação, preço preservado, idempotência, transições, pagamentos, filtros, conversa e ações concorrentes. Para testar a interface, execute Playwright no frontend ou siga o roteiro com duas contas acima. Ao voltar à aplicação neste terminal, restaure `$env:DOTENV_CONFIG_PATH = '.env/.env'`.

## Notificações persistentes

`NotificationsModule` registra avisos de novas mensagens e de criação, aceite, recusa, conclusão e cancelamento de solicitações. O destinatário é sempre a contraparte. `RequestsService` e `MessagingService` chamam `NotificationsService.emit` com o cliente da mesma transação Prisma: uma falha no aviso reverte a operação de origem. A unicidade `(usuarioId, chaveEvento)` e a detecção de envios repetidos impedem duplicação e preservam a primeira leitura. Não existe retrocarga de eventos antigos.

| Endpoint autenticado | Contrato |
| --- | --- |
| `GET /notificacoes` | `categoria=mensagens/solicitacoes`, `naoLidas=true/false`, `limite` (20, máximo 50), `antes` e `ateId`; retorna `usuarioId`, `itens`, `ateId` e `proximoCursor` |
| `GET /notificacoes/resumo` | `usuarioId`, total `naoLidas` e maior `ateId`, sem restringir à página/filtro |
| `GET /notificacoes/:id` | Aviso do destinatário com destino interno para pedido ou conversa |
| `POST /notificacoes/:id/lida` | Primeira data de leitura persistente; repetir não a altera |
| `POST /notificacoes/ler-todas` | Corpo `{ "ateId": 123 }`; marca a conta até esse ID, em todas as categorias; retorna `atualizadas` |

A sessão determina o usuário; consultas de outra conta retornam 404. Escritas exigem `X-Hive-Request: 1`. Mensagens não são copiadas para o texto do aviso. As FKs removem avisos junto com usuário, mensagem ou contratação de origem. A paginação usa IDs decrescentes e conserva `ateId` nas páginas seguintes; ao voltar a **Mais recentes**, obtém um novo limite.

Antes de executar a API, aplique a migration aditiva `20261001010000_notifications` com `npm run db:migrate:deploy` e gere o client com `npm run prisma:generate`. Não é preciso resetar nem repor o seed.

```powershell
$env:DOTENV_CONFIG_PATH = '.env/.env.test.local'
npm run test:notificacoes
```

O comando cria e remove apenas seu próprio banco `hive_notifications_<uuid>_test`, aplica todas as migrations e confere a ausência de divergência com o schema. Exige PostgreSQL local, TEST_DATABASE_URL terminada em `_test` e permissão CREATEDB. Os logs **Falha simulada** são esperados nos casos que verificam rollback. Ao usar novamente a aplicação, restaure `$env:DOTENV_CONFIG_PATH = '.env/.env'`.

Veja o [roteiro de demonstração e limites](../frontend/docs/notifications.md). Não há push, e-mail ou recibo de leitura de conversa nesta etapa.
