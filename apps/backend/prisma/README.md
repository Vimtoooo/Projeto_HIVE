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
- [migrations/](migrations/): histórico ativo PostgreSQL, com migration inicial completa.
- [legacy-mysql-migrations/](legacy-mysql-migrations/): SQL original MySQL arquivado e excluído do deploy.
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

O histórico ativo agora contém `20260921000000_init_postgresql`, gerado a
partir do schema atual: oito tabelas, enums, índices únicos, relações, sequências
e certificações como array de texto. O SQL MySQL foi preservado em
`legacy-mysql-migrations/`, fora do caminho de deploy.

### Banco PostgreSQL novo

Crie o banco no PostgreSQL e execute em `apps/backend`:

```powershell
$env:DOTENV_CONFIG_PATH = '.env/.env'
npm run prisma:generate
npm run prisma:validate
npm run db:migrate:deploy
npm run db:migrate:status
npm run db:seed:local -- --confirm hive
```

Use o nome real após --confirm. O deploy não insere dados e pode ser repetido:
migrations já aplicadas não são executadas novamente. Para próximas alterações,
crie migrations com `prisma migrate dev` no ambiente de desenvolvimento e
revise o SQL antes de compartilhar. Não edite a migration inicial após aplicá-la.

### Banco PostgreSQL existente, criado por db push

Não execute reset. Faça backup e confirme o destino em DATABASE_URL. Primeiro
verifique se o schema existente corresponde ao schema desta branch:

```powershell
npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code
```

Prossiga **somente** se a saída disser que não há diferenças e o código for zero.
Código 2 indica divergência; corrija-a por uma alteração revisada, sem marcar
artificialmente a migration como aplicada. Código 1 indica erro de execução.
Se não existir histórico anterior e o schema for equivalente, registre o baseline:

```powershell
npx prisma migrate resolve --applied 20260921000000_init_postgresql
npm run db:migrate:deploy
npm run db:migrate:status
```

O baseline registra o estado existente sem recriar tabelas nem apagar registros.
Se houver migrations anteriores registradas, revise esse histórico antes; não
apague _prisma_migrations de um banco existente para forçar este procedimento.
A configuração respeita variáveis já definidas no processo, permitindo selecionar
um banco descartável sem que o arquivo .env sobrescreva a URL.

### Dados legados e verificação

O grupo confirmou que os dados antigos são fictícios: a estratégia adotada é
recriá-los com o seed no PostgreSQL, sem importar registros do MySQL. A migração
não copia dados automaticamente. Preserve o banco original até conferir o destino.
Se surgirem dados reais, planeje uma transferência separada com backup, mapeamento
de IDs/FKs, conversão de certificações JSON para String[] e ajuste de sequências.

```powershell
npm run test:migrations
```

Esse teste usa credenciais de TEST_DATABASE_URL em PostgreSQL local com permissão
CREATEDB. Cria um banco descartável de nome aleatório, verifica deploy repetido,
comparação sem diferenças, seed completo, rollback, persistência, catálogo e o SQL
de consulta. Simula um baseline no próprio banco descartável e confirma que os
usuários existentes foram preservados. Ao final remove somente o banco que criou.
Não executa reset dos bancos hive ou do banco de testes já configurado.

Valores monetários permanecem Float. A busca mantém a semântica atual dos filtros
Prisma/PostgreSQL; normalização de acentos e busca sem distinção de maiúsculas
não fazem parte desta correção de migrations.

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
npm run db:migrate:deploy
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
