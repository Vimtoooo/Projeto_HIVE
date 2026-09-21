# Prisma e banco de dados do HIVE

O schema usa PostgreSQL e Prisma Client 7. Execute todos os comandos desta página
na pasta `apps/backend`, não dentro de `prisma`.

## Estrutura não é inserção de dados

| Operação | O que faz |
| --- | --- |
| `npm run prisma:generate` | Gera o client TypeScript a partir do schema; não cria tabelas nem registros |
| `npm run prisma:validate` | Valida o schema/configuração; não modifica dados |
| `npx prisma db push` | Sincroniza a estrutura no banco DATABASE_URL; não cria histórico de migrations |
| Métodos do Prisma Client | Executam consultas e gravações de registros durante o uso da aplicação |

O arquivo `schema.prisma` descreve entidades, relações e restrições. Ele não
é executado para inserir os dados dos formulários. Essa gravação ocorre quando
a API chama as operações de persistência dentro de uma transação.

## Arquivos e configuração

- [schema.prisma](schema.prisma): oito entidades, enums, PKs, FKs e restrições únicas.
- [migrations/](migrations/): histórico SQL antigo, específico do MySQL; não o aplique no PostgreSQL.
- [seed.ts](seed.ts): comando de carga local com confirmação de destino.
- [seed-data.ts](seed-data.ts): nomes, contas, serviços e senha fictícia para editar e apresentar.
- [seed-local.ts](seed-local.ts): proteção de ambiente e carga transacional das oito entidades.
- [prisma.config.ts](../prisma.config.ts): carrega o arquivo de ambiente e define DATABASE_URL para a CLI; use os scripts npm para o seed.
- [prisma-client.factory.ts](../src/persistence/prisma-client.factory.ts): configura o adapter `@prisma/adapter-pg` para o Prisma 7.

Crie `.env/.env` local com uma URL `postgresql://` conforme o [README do backend](../README.md).
Para testes, use `.env/.env.test.local` com uma URL `postgresql://` em TEST_DATABASE_URL conforme o
[README dos testes](../test/README.md). Ambos são ignorados pelo Git.

A CLI usa DATABASE_URL; os comandos `test:db:prepare` e `start:demo` trocam esse
destino somente no processo filho, após validar o banco exclusivo de testes.
O client da aplicação precisa do adaptador; gerar o client não configura
automaticamente a conexão em tempo de execução.

## Como os dados chegam ao banco

`POST /prestadores` valida o JSON, instancia Prestador e Servico e usa
ServicoRepository → PersistenciaService → RepositorioDominio. A criação de
Usuario, Prestador e Servico pertence à mesma transação: uma falha desfaz tudo.

Prestador compartilha a chave do Usuario no relacionamento 1:1. Os IDs locais
das classes não são usados como PKs. O repositório associa as instâncias aos
IDs retornados pelo banco durante aquela transação. Email, CPF e CNPJ únicos
fazem o banco rejeitar duplicidades, que a API converte em resposta 409.

`GET /servicos` consulta o Prisma com filtros tipados, paginação e seleção
explícita de campos públicos. Não depende do estado dos objetos em memória.
As regras de domínio e os detalhes da consulta ficam fora do controller.

Veja os motivos, campos e exemplos no [contrato da API](../docs/CATALOGO-API.md)
e os limites do repositório no [guia de persistência](../docs/PERSISTENCIA.md).

## Compatibilidade com as colunas existentes

Indicacao expõe `meioIndicado` e `dataIndicado` no TypeScript, mas usa `@map`
para acessar as colunas `meioIndicacao` e `dataIndicacao` das migrations.
Esse ajuste evita renomear colunas ou perder dados no banco já existente.

Se um banco foi criado anteriormente por db push com outros nomes, revise a
diferença antes de sincronizar. Não aceite exclusão e recriação de colunas com
dados como substituto de uma migration de renomeação.

## Preparar e evoluir o schema

Para um banco local novo ou exclusivo de testes, o fluxo usado nesta entrega é:

```powershell
npm run prisma:generate
npm run prisma:validate
npm run test:db:prepare
npm run test:persistencia
npm run test:catalogo
```

`test:db:prepare` executa db push apenas no banco `_test`, sem reset, seed ou
aceitar perda de dados automaticamente. Os comandos de testes inserem dados
fictícios e fazem limpeza seletiva. Não use TRUNCATE para a demonstração.

As novas rotas reutilizam as tabelas existentes; esta entrega não acrescentou
uma migration de tabelas. Quando uma mudança futura exigir evolução estrutural
compartilhada pela equipe, produza e revise uma migration em banco de
desenvolvimento antes de aplicá-la aos demais ambientes.

Não misture db push e migrations sem verificar o estado do banco: alterações
feitas por db push não ficam registradas como migrations aplicadas. Não execute
reset para resolver divergências em um banco com dados que precisam ser mantidos.

## Conexão MySQL 8 — referência histórica

> Não se aplica ao adaptador PostgreSQL desta branch. As opções abaixo eram utilizadas na versão MySQL.

O erro `ER_CANNOT_RETRIEVE_RSA_KEY` pode aparecer após reiniciar o servidor,
quando o cache de autenticação deixa de atender o driver. A fábrica aceita
`MYSQL_LOCAL_PUBLIC_KEY_RETRIEVAL=true` somente para loopback. Para conexão
remota, use uma chave pública confiável via MYSQL_SERVER_PUBLIC_KEY ou configure
TLS validado no adaptador. Detalhes no [guia da API](../docs/CATALOGO-API.md).

Isso configura a autenticação do driver; não muda a senha do banco nem permite
publicar credenciais. Parâmetros de URL não tratados pela fábrica são rejeitados
para evitar ignorar silenciosamente opções de conexão.

## Preparação para PostgreSQL

Esta branch usa PostgreSQL no schema, no adapter e nas URLs. Como as migrations
existentes foram geradas para MySQL, prepare um banco PostgreSQL novo com:

```powershell
$env:DOTENV_CONFIG_PATH = '.env/.env'
npm run prisma:generate
npm run prisma:validate
npx prisma db push
```

O `migration_lock.toml` já declara PostgreSQL, mas os arquivos SQL antigos continuam MySQL; essa mudança não os converte.
Não execute `prisma migrate deploy` com as migrations MySQL antigas. Para
produção, gere e revise um novo histórico de migrations PostgreSQL depois de
validar o schema e a transferência de dados.

A busca mantém os filtros do Prisma; diferenças de maiúsculas e acentos entre PostgreSQL e MySQL precisam ser avaliadas.
Valores monetários continuam Float; adotar Decimal é uma mudança adicional de
schema e regras. PostgreSQL ainda requer validação das suítes de integração e da
transferência de dados antes de ser usado em produção.

## Seed local para apresentação

Execute em `apps/backend`. Os comandos `:local` usam **DATABASE_URL**; os comandos `:test` usam
**TEST_DATABASE_URL** e exigem sufixo `_test`. Configure um arquivo local, por exemplo `.env/.env.demo.local`:

```dotenv
DATABASE_URL="postgresql://USUARIO:SENHA@localhost:5432/hive_demo_local"
PORT=3000
```

Crie `hive_demo_local` no seu PostgreSQL e prepare o schema uma vez:

```powershell
$env:DOTENV_CONFIG_PATH = '.env/.env.demo.local'
npm run prisma:generate
npx prisma db push
npm run db:seed:local -- --confirm hive_demo_local
```

**Para apagar os dados das oito tabelas e repor a demonstração**, pare a API,
confira DATABASE_URL e execute neste mesmo terminal:

```powershell
npm run db:reset:local -- --confirm hive_demo_local
npm run start:dev
```

No Git Bash, configure `export DOTENV_CONFIG_PATH='.env/.env.demo.local'`;
os comandos npm são iguais. Para testar a tela, sirva o frontend conforme seu
[README](../../frontend/README.md). Use `start:dev` com o mesmo arquivo de
ambiente: `start:demo` seleciona TEST_DATABASE_URL e pode apontar para outro banco.

O reset substitui **todos** os dados dessas tabelas, inclusive os inseridos
manualmente; faça backup se precisar preservá-los. É reset de dados, não de
schema: mantém tabelas, migrations e contadores de IDs. Não execute simultaneamente
com a API ou outra carga. O comando é manual, nunca roda ao iniciar a aplicação.

### Contas e roteiro

Todas as contas usam a senha fictícia **HiveDemo!2026**, armazenada como hash
scrypt com salt pela mesma classe Usuario usada na aplicação.

| Conta | Email | Papel |
| --- | --- | --- |
| Ana Souza (Demo) | ana@hive.example.invalid | Contratante |
| Carlos Lima (Demo) | carlos@hive.example.invalid | Prestador de marcenaria |
| Beatriz Santos (Demo) | beatriz@hive.example.invalid | Prestadora de jardinagem |

1. Entre com Ana no formulário e confirme o redirecionamento à Home.
2. Consulte GET /servicos: aparecem montagem de estante (150) e manutenção de jardim (120).
3. Confira no PostgreSQL a restauração de mesa (250), inativa e ausente da busca pública.
4. Mostre a contratação concluída de Ana com Carlos: fatura paga de 150, receita vinculada e avaliação 5.
5. Compare com a contratação pendente de jardinagem: fatura pendente de 120, sem receita nem avaliação.

Totais: **3 usuários, 2 prestadores, 3 serviços, 2 contratações, 1 indicação,
1 avaliação, 2 faturas e 1 lançamento financeiro**. Datas são fixas em setembro
de 2026 para facilitar a apresentação; não representam vencimentos atuais.
Nomes, documentos e contatos são fictícios. Os emails usam o domínio reservado
example.invalid. As entidades sem endpoints são demonstradas pelo banco.

### Proteções e repetição

- Somente PostgreSQL em localhost, 127.0.0.1 ou ::1, com nome hive ou terminado em _local ou _test.
- Exige `--confirm NOME_EXATO` e recusa NODE_ENV=production antes de conectar.
- A carga simples recusa banco já populado; o reset pode ser repetido sem duplicar os exemplos.
- Limpeza em ordem de FKs e inserções compartilham uma transação. Falhas desfazem os dados; os contadores de IDs podem avançar.
- Não usa TRUNCATE, DROP, desativação de FKs ou SQL específico do MySQL na carga.
- As senhas demonstrativas são públicas e exclusivas de ambiente local.

### Verificar o seed

```powershell
npm run test:seed
```

Por padrão, verifica as proteções sem acessar o banco; os dois testes de integração
ficam explicitamente pulados. Para executá-los, prepare um banco **descartável e
vazio** chamado `hive_seed_verificacao_IDENTIFICADOR_test` (identificador com letras
minúsculas/números), sincronize o schema e forneça sua URL:

```powershell
$env:SEED_TEST_DATABASE_URL = 'postgresql://USUARIO:SENHA@localhost:5432/hive_seed_verificacao_manual_test'
$env:DATABASE_URL = $env:SEED_TEST_DATABASE_URL
npx prisma db push
npm run test:seed
Remove-Item Env:DATABASE_URL, Env:SEED_TEST_DATABASE_URL
```

Os testes de integração deixam os exemplos nesse banco descartável e validam
hash de senha, vínculos, recusa de carga duplicada, repetição e rollback após
falha simulada. Nunca aponte essa variável para o banco do grupo.

## Usar os bancos hive e hive_pi_2026f0915_test

Não é necessário renomear o banco `hive`. Configure sua URL em
`.env/.env` (DATABASE_URL) e a URL do banco de testes em
`.env/.env.test.local` (TEST_DATABASE_URL). Informe o nome que realmente
existe no seu PostgreSQL; o comando recusa confirmação diferente da URL.

Execute em `apps/backend`, com schema já preparado e API parada para reset:

```powershell
# Banco original local: hive
$env:DOTENV_CONFIG_PATH = '.env/.env'
npm run db:seed:local -- --confirm hive
# Para substituir os dados existentes, use no lugar do comando anterior:
npm run db:reset:local -- --confirm hive

# Banco de testes: hive_pi_2026f0915_test
$env:DOTENV_CONFIG_PATH = '.env/.env.test.local'
npm run db:seed:test -- --confirm hive_pi_2026f0915_test
# Para substituir os dados existentes, use no lugar do comando anterior:
npm run db:reset:test -- --confirm hive_pi_2026f0915_test
```

Escolha **seed ou reset**, não é necessário executar ambos. Seed exige banco
vazio; reset apaga os dados das oito tabelas e repõe os exemplos. Os comandos
não criam nem renomeiam bancos e não alteram seus arquivos de credenciais.
