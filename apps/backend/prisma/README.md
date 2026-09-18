# Prisma e banco de dados do HIVE

O schema usa MySQL e Prisma Client 7. Execute todos os comandos desta página
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
- [migrations/](migrations/): histórico SQL existente, específico do MySQL.
- [seed.ts](seed.ts): demonstração legada que apaga registros e usa inicialização antiga do client; não usar para preparar esta entrega.
- [prisma.config.ts](../prisma.config.ts): define schema, caminho das migrations, seed e DATABASE_URL para a CLI.
- [prisma-client.factory.ts](../src/persistence/prisma-client.factory.ts): configura o adaptador MariaDB compatível com MySQL para o Prisma 7.

Crie `.env` local com DATABASE_URL conforme o [README do backend](../README.md).
Para testes, use `.env.test.local` com TEST_DATABASE_URL conforme o
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

## Conexão MySQL 8

O erro `ER_CANNOT_RETRIEVE_RSA_KEY` pode aparecer após reiniciar o servidor,
quando o cache de autenticação deixa de atender o driver. A fábrica aceita
`MYSQL_LOCAL_PUBLIC_KEY_RETRIEVAL=true` somente para loopback. Para conexão
remota, use uma chave pública confiável via MYSQL_SERVER_PUBLIC_KEY ou configure
TLS validado no adaptador. Detalhes no [guia da API](../docs/CATALOGO-API.md).

Isso configura a autenticação do driver; não muda a senha do banco nem permite
publicar credenciais. Parâmetros de URL não tratados pela fábrica são rejeitados
para evitar ignorar silenciosamente opções de conexão.

## Preparação para PostgreSQL

As operações de negócio usam o Prisma, sem SQL MySQL nos endpoints. A migração
ainda exige alterar o provider, substituir o adaptador por um compatível com
PostgreSQL, revisar tipos nativos e criar migrations próprias para esse banco.
Também será preciso transferir os dados, ajustar sequências, URLs e validação
de ambiente, e executar novamente as suítes de persistência e catálogo.

A busca segue a collation do banco; maiúsculas e acentos precisam de revisão.
Valores monetários continuam Float; adotar Decimal é uma mudança adicional de
schema e regras. PostgreSQL ainda não foi implementado nem validado nesta etapa.
