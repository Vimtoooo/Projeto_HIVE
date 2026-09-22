# Backend do HIVE

API NestJS com Prisma 7 e PostgreSQL. Esta etapa conecta as classes de domínio à
aplicação HTTP: cadastro de prestador com serviço inicial e busca de serviços.
O frontend estático ainda não está conectado a essas rotas.

## Preparar o ambiente

Execute os comandos desta página em `apps/backend`. O ambiente usado na
validação inicial foi Node.js 24.13, npm 11 e MySQL 8.0. Nesta branch, o banco é PostgreSQL; as versões de dependências
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

Para um banco local novo, sincronize as tabelas e inicie a API:

```powershell
npx prisma db push
npm run start:dev
```

Em um banco com dados, revise a mudança antes de aplicar. Não aceite perda de
dados. Para carga fictícia, use o seed local protegido abaixo. Veja o
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

No PowerShell, em `apps/backend`, carregue o arquivo **antes** de iniciar
`test-database.cjs`, pois ele verifica TEST_DATABASE_URL imediatamente:

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

Quando os arquivos estiverem na raiz do backend, os comandos npm de teste
continuam disponíveis. Com a pasta `.env/`, use o prefixo
`node -r dotenv/config scripts/test-database.cjs` e o modo correspondente:
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
| `POST /prestadores` | Cria Usuario, Prestador e o primeiro Servico juntos; retorna 201 |
| `GET /servicos` | Busca pública com filtros, paginação e retorno somente de campos públicos |
| `POST /login` | Confere email, senha scrypt e conta ativa; retorna 201 com os dados públicos do usuário ou 401 para credenciais rejeitadas |
| `GET /` | Verificação básica já existente; retorna Hello World! |

O POST de `/prestadores` exige dados pessoais, dados profissionais e o objeto `servico`.
O GET aceita `texto`, `areaAtuacao`, `precoMin`, `precoMax`, `prestadorId`,
`pagina` e `limite`. O [contrato da API](docs/CATALOGO-API.md) detalha os campos,
limites, exemplos JSON e respostas 400, 409, 503 e 500.

## Login integrado ao frontend

Crie primeiro a conta com `POST /prestadores` no mesmo banco usado pela API.
O [guia do frontend](../frontend/README.md#criar-a-conta-antes-do-login) contém
um POST fictício e o roteiro para abrir a tela e confirmar o redirecionamento.
O login recebe `{"email":"...","senha":"..."}` e retorna `idUsuario`,
`nome`, `email` e `tipoUsuario`, sem retornar o hash.

A verificação de senha usa scrypt com salt e comparação com timingSafeEqual.
O fluxo atual não emite token nem cookie de sessão: o redirecionamento para
Home comprova a integração, mas ainda não protege essa página. O corpo de
login usa um tipo inline, sem DTO validado como o do cadastro.

## Arquitetura e motivos das mudanças

| Camada | Responsabilidade e motivo |
| --- | --- |
| `src/catalog/servico.controller.ts` | Recebe POST/GET e delega ao serviço, seguindo o diagrama de sequência |
| `src/catalog/catalogo.dto.ts` | Valida formatos, limites e campos extras antes de executar regras ou acessar o banco |
| `src/catalog/servico.service.ts` | Coordena o cadastro e a busca, verifica intervalo de preços e traduz erros para HTTP |
| `src/catalog/servico.repository.ts` | Define consultas e projeções públicas; evita expor senha, documentos e contato |
| `src/auth/` | Recebe o login, busca a conta e verifica status e senha |
| `src/models/` | Mantém as classes Prestador/Servico e demais regras de domínio já utilizadas nos testes |
| `src/persistence/` | Reutiliza transações, gravação das classes, conexão e adaptador do banco |

`AppModule` registra `CatalogoModule`, `AuthModule` e um `ValidationPipe` global com transformação,
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
inclui a consulta no Workbench.

## Limites atuais

O cadastro abre uma nova conta com seu serviço inicial; não adiciona serviços a
contas existentes. Novos cadastros ficam ativos nesta etapa acadêmica.
Autenticação, autorização, aprovação e limitação de requisições ainda precisam
ser implementadas antes de disponibilizar a API em produção.

CPF/CNPJ têm validação de tamanho, não verificação fiscal. Valores monetários
continuam como Float. Contratação, pagamento e avaliação estão nas classes e
na persistência, mas ainda não possuem rotas. O método Usuario.autenticar não
é o responsável pelo login da API; essa responsabilidade está em AuthService.

## Documentação complementar

- [Plano de implementação](docs/PLANO-CADASTRO-BUSCA.md)
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
