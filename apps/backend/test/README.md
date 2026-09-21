# Como executar os testes de persistência do HIVE

Este guia mostra como testar a transferência dos objetos de `src/models` para
o PostgreSQL pelo Prisma, consultar os dados fictícios e removê-los depois.

## Por que existem suítes diferentes

O teste de persistência verifica as oito classes diretamente no banco. O novo
teste de catálogo entra pelas rotas HTTP do AppModule real, para também validar
DTOs, controllers, serviços e respostas. Assim, uma gravação correta no Prisma
não mascara uma rota ausente, uma entrada inválida aceita ou dados privados na resposta.

| Comando | Cobertura e motivo |
| --- | --- |
| `npm test -- --runInBand` | Dois testes unitários: comportamento básico e mensagem segura em falha do banco |
| `npm run test:e2e -- --runInBand` | Um teste HTTP básico de GET /, com conexão substituída por mock |
| `npm run test:persistencia` | Cinco testes das classes e transações, usando PostgreSQL real |
| `npm run test:catalogo` | Dez testes HTTP de cadastro, busca, filtros, paginação, validação e proteção dos dados |
| `npx ts-node test/manual-test.ts` | Demonstração das classes em memória, sem gravar no PostgreSQL |

As contagens descrevem a entrega atual. `npm test` sozinho não executa as suítes
de integração, pois cada uma possui sua configuração Jest e seu comando próprio.
Os testes de catálogo foram escritos antes das rotas e registraram falhas 404
antes da implementação. As suítes normais limpam somente seus próprios dados;
os comandos `:visualizar` preservam um cenário para consulta manual.

## Consulta rápida

Execute os comandos na pasta `apps/backend`, não dentro de `test`.

| Comando | Finalidade |
| --- | --- |
| `npm run prisma:generate` | Gerar o Prisma Client a partir do schema |
| `npm run test:db:prepare` | Preparar as tabelas no banco exclusivo de testes |
| `npm run test:persistencia` | Executar os cinco testes e limpar os dados da execução |
| `npm run test:catalogo` | Executar dez testes HTTP de cadastro e busca com PostgreSQL real |
| `npm run test:catalogo:visualizar` | Preservar um cadastro feito pela API para apresentação |
| `npm run start:demo` | Iniciar a aplicação real no banco exclusivo de testes |
| `npm run test:persistencia:visualizar` | Executar um cenário completo e preservar os dados para consulta |
| `npm run test:persistencia:limpar -- UUID` | Remover somente os dados da execução identificada pelo UUID |
| `npx tsc --project test/tsconfig.json` | Verificar os tipos TypeScript dos testes sem gerar arquivos |

## 1. Abrir o terminal na pasta correta

No PowerShell do VS Code, nesta máquina:

```powershell
cd "C:\Users\leone\OneDrive\Desktop\Vito\Work\University\Projetos\HIVE\apps\backend"
```

Em outro computador, ajuste o caminho para a pasta `apps/backend` da sua cópia
do HIVE. Em uma nova instalação ou após mudanças nas dependências, execute:

```powershell
npm ci
```

É necessário ter Node.js, npm e um servidor PostgreSQL disponível. Não é necessário
iniciar a API NestJS: os testes acessam a camada de persistência diretamente.

## 2. Configurar um banco exclusivo para os testes

O banco utilizado na validação local foi `hive_pi_20260915_test`.
O arquivo `apps/backend/.env/.env.test.local` já foi configurado nessa máquina,
mas não é enviado ao GitHub por conter credenciais.

Em uma nova instalação:

1. Inicie o PostgreSQL e conecte-se pelo pgAdmin ou psql.
2. Crie um banco separado, por exemplo:

   ```sql
   CREATE DATABASE hive_pi_20260915_test;
   ```

3. Se `.env/.env.test.local` ainda não existir, crie esse arquivo dentro da pasta `.env/` do backend.
   Os arquivos de ambiente e seus modelos não são distribuídos pelo Git.

4. Edite `.env/.env.test.local` com as credenciais do seu PostgreSQL:

   ```dotenv
   TEST_DATABASE_URL="postgresql://SEU_USUARIO:SUA_SENHA@localhost:5432/hive_pi_20260915_test"
   ```

   A configuração RSA do antigo driver MySQL não é necessária no PostgreSQL.

Substitua usuário e senha. Caracteres especiais nas credenciais precisam estar
codificados para URL. O usuário do banco precisa de permissões para preparar as
tabelas e executar consultas, inserções e exclusões nesse banco.

Antes dos comandos de teste, carregue o arquivo e a URL no terminal. No
PowerShell:

```powershell
$env:DOTENV_CONFIG_PATH = '.env/.env.test.local'
$env:TEST_DATABASE_URL = 'postgresql://SEU_USUARIO:SUA_SENHA@localhost:5432/hive_pi_20260915_test'
```

No Git Bash:

```bash
export DOTENV_CONFIG_PATH='.env/.env.test.local'
export TEST_DATABASE_URL='postgresql://SEU_USUARIO:SUA_SENHA@localhost:5432/hive_pi_20260915_test'
```

O nome do banco deve terminar em `_test` e seu destino deve ser diferente do
`DATABASE_URL` da aplicação. Não aponte os testes para o banco principal `hive`.
Se escolher outro nome, ajuste também o comando `USE` nas consultas abaixo.

## 3. Gerar o client e preparar as tabelas

No terminal do backend:

```powershell
npm run prisma:generate
npm run test:db:prepare
```

O primeiro comando gera o código do Prisma Client. O segundo sincroniza as
tabelas no banco indicado em `TEST_DATABASE_URL`, sem executar o seed legado,
resetar o banco ou aceitar automaticamente perda de dados.

Repita essa etapa quando houver mudanças no schema. Nas execuções seguintes,
se o ambiente estiver preparado e o schema não tiver mudado, vá diretamente
para os testes.

## 4. Executar a suíte completa

```powershell
npm run test:persistencia
```

O resultado esperado é **cinco testes aprovados**. A suíte verifica:

- Gravação das oito entidades, valores, datas, hash de senha e relacionamentos.
- Uso dos IDs gerados pelo banco, sem colisão com os contadores das classes.
- Rollback quando há duplicidade de dados.
- Rejeição de relações ainda não persistidas.
- Rejeição da criação repetida do mesmo objeto na transação.

Esse modo remove automaticamente os próprios registros fictícios ao terminar.
Portanto, é normal não encontrar esses dados nas tabelas após a execução.
O banco e as tabelas permanecem disponíveis.

## 5. Preservar dados para visualizar no Workbench

```powershell
npm run test:persistencia:visualizar
```

Esse modo executa somente o cenário completo: o resultado esperado é **um teste
aprovado e quatro ignorados intencionalmente**.

Por execução, ficam gravados:

| Tabela | Quantidade de registros |
| --- | ---: |
| Usuario | 2: cliente e usuário do prestador |
| Prestador | 1 |
| Servico | 1 |
| Indicacao | 1 |
| Contratacao | 1 |
| Fatura | 1 |
| Avaliacao | 1 |
| Financeiro | 2: receita e despesa |

A contratação vale R$ 200. A fatura e a receita são de R$ 190, após o desconto
de 5% por indicação. A despesa fictícia é de R$ 30.

O terminal informa um identificador único e o comando de limpeza:

```text
Dados preservados. ID da execução: <UUID>
Para limpar: npm run test:persistencia:limpar -- <UUID>
```

Guarde esse UUID. Cada execução gera outro identificador e novos registros.
Executar a suíte normal não apaga dados de demonstrações anteriores.

## 6. Consultar e limpar no PostgreSQL

Conecte o pgAdmin ou psql diretamente ao banco indicado em TEST_DATABASE_URL.
PostgreSQL não usa USE nem variáveis SET @nome. Os identificadores do Prisma
com maiúsculas exigem aspas duplas:

```sql
SELECT current_database();
SELECT "idUsuario", nome, email FROM "Usuario"
WHERE email LIKE '%@example.invalid' ORDER BY "idUsuario" DESC;
```

Para apagar somente uma execução, use
`npm run test:persistencia:limpar -- UUID_DA_EXECUCAO`.
Para limpar todas as oito tabelas sem repor o seed, exclusivamente no banco de
testes e com API parada, confira current_database() e execute:

```sql
BEGIN;
DELETE FROM "Financeiro";
DELETE FROM "Avaliacao";
DELETE FROM "Fatura";
DELETE FROM "Contratacao";
DELETE FROM "Indicacao";
DELETE FROM "Servico";
DELETE FROM "Prestador";
DELETE FROM "Usuario";
-- Confira os resultados; execute COMMIT para confirmar OU ROLLBACK para desfazer.
```

A limpeza preserva estrutura e sequências. Não desative FKs. Diferentemente
do MySQL, TRUNCATE é transacional no PostgreSQL, mas não é usado neste roteiro.
O arquivo consultar-persistencia.sql e as seções MySQL abaixo são históricos;
não execute sua sintaxe no PostgreSQL.

<details>
<summary>Referência histórica: consultas e limpeza no MySQL</summary>

## 6. Consultar os dados no MySQL Workbench

Conecte-se ao mesmo servidor e porta configurados em `.env/.env.test.local`.
Atualize a lista de schemas se o banco ainda não aparecer e execute:

```sql
USE hive_pi_20260915_test;
```

Abra [consultar-persistencia.sql](./consultar-persistencia.sql) no Workbench.
Substitua `COLE_O_UUID_AQUI` pelo identificador exibido no terminal:

```sql
SET @execucao = 'COLE_O_UUID_AQUI';
```

Execute o arquivo inteiro, incluindo os comandos `SET`. Ele contém consultas
para as oito tabelas, filtradas pela execução escolhida. Os resultados aparecem
nas grades de resultados do Workbench; execute novamente as consultas para
atualizá-las depois de uma nova gravação ou limpeza.

Se perder o UUID, consulte os emails fictícios no banco de testes. Eles seguem
o formato `cliente.UUID@example.invalid` e `prestador.UUID@example.invalid`:

```sql
SELECT idUsuario, nome, email
FROM Usuario
WHERE email LIKE '%@example.invalid'
ORDER BY idUsuario DESC;
```

## 7. Remover os dados da demonstração

Copie o comando de limpeza mostrado no terminal. Substitua `UUID_DA_EXECUCAO`
pelo identificador real, sem os sinais `<` e `>`:

```powershell
npm run test:persistencia:limpar -- UUID_DA_EXECUCAO
```

A limpeza usa os emails exatos daquela execução, remove os registros relacionados
na ordem das chaves estrangeiras e executa a operação em uma transação.
O comando não apaga o banco ou suas tabelas. Repita as consultas do passo 6:
os resultados daquela execução devem ficar vazios.

Não é necessário executar `TRUNCATE TABLE` nem desativar as chaves estrangeiras.
`TRUNCATE` apaga toda a tabela, pode ser impedido por FKs e provoca commit
implícito; ele não permite a limpeza seletiva usada aqui.

### 7.1. Erro 1701 ao executar TRUNCATE: limpar todas as tabelas de testes

O erro `Cannot truncate a table referenced in a foreign key constraint` ocorre
porque outra tabela referencia a tabela escolhida. No HIVE, por exemplo,
`Prestador` referencia `Usuario`. O MySQL pode bloquear TRUNCATE mesmo quando a
tabela dependente está vazia; apagar seus registros não remove a restrição.

Prefira a limpeza por UUID do passo anterior quando quiser remover somente uma
execução. Os comandos `:visualizar` preservam os registros intencionalmente.
Se precisar remover **todos os dados das oito tabelas da aplicação no banco de
testes**, use o procedimento abaixo. Ele também apaga cadastros manuais que
estejam nesse banco, mas preserva tabelas, chaves estrangeiras e migrations.

1. Pare a API de demonstração e qualquer teste em execução.
2. Conecte-se ao servidor correto no Workbench. O exemplo usa exclusivamente
   `hive_pi_20260915_test`; se seu banco tiver outro nome, substitua esse nome
   em todas as consultas. Nunca substitua pelo banco principal da aplicação.
3. Execute somente o primeiro bloco abaixo. Ele usa DELETE na ordem das
   dependências e abre uma transação nas tabelas InnoDB do projeto.

```sql
-- Todos os registros destas tabelas do banco de testes serão removidos.
SET @safe_updates_anterior = @@SESSION.SQL_SAFE_UPDATES;
SET SESSION SQL_SAFE_UPDATES = 0;

START TRANSACTION;

DELETE FROM hive_pi_20260915_test.Financeiro;
DELETE FROM hive_pi_20260915_test.Avaliacao;
DELETE FROM hive_pi_20260915_test.Fatura;
DELETE FROM hive_pi_20260915_test.Contratacao;
DELETE FROM hive_pi_20260915_test.Indicacao;
DELETE FROM hive_pi_20260915_test.Servico;
DELETE FROM hive_pi_20260915_test.Prestador;
DELETE FROM hive_pi_20260915_test.Usuario;
```

A opção SQL_SAFE_UPDATES é alterada somente nesta conexão para permitir DELETE
sem filtro, evitando o erro 1175 do modo seguro do Workbench. As verificações
FOREIGN_KEY_CHECKS continuam ativas.

4. Confira a saída de **todos** os DELETEs. Se nenhum falhou, confirme na
   **mesma conexão**:

```sql
COMMIT;
SET SESSION SQL_SAFE_UPDATES = @safe_updates_anterior;
```

Se qualquer DELETE falhar, não execute COMMIT. Desfaça a transação pendente
na mesma conexão e restaure a configuração:

```sql
ROLLBACK;
SET SESSION SQL_SAFE_UPDATES = @safe_updates_anterior;
```

Não execute os três blocos em sequência automaticamente: COMMIT e ROLLBACK são
alternativas. ROLLBACK só desfaz uma transação ainda não confirmada. Se houver
uma nova tabela com FK não contemplada aqui, revise a ordem de dependências
antes de tentar novamente, mantendo a validação das chaves estrangeiras.

5. Após confirmar com COMMIT, verifique as contagens; todas devem ser zero:

```sql
SELECT 'Financeiro' AS tabela, COUNT(*) AS registros FROM hive_pi_20260915_test.Financeiro
UNION ALL SELECT 'Avaliacao', COUNT(*) FROM hive_pi_20260915_test.Avaliacao
UNION ALL SELECT 'Fatura', COUNT(*) FROM hive_pi_20260915_test.Fatura
UNION ALL SELECT 'Contratacao', COUNT(*) FROM hive_pi_20260915_test.Contratacao
UNION ALL SELECT 'Indicacao', COUNT(*) FROM hive_pi_20260915_test.Indicacao
UNION ALL SELECT 'Servico', COUNT(*) FROM hive_pi_20260915_test.Servico
UNION ALL SELECT 'Prestador', COUNT(*) FROM hive_pi_20260915_test.Prestador
UNION ALL SELECT 'Usuario', COUNT(*) FROM hive_pi_20260915_test.Usuario;
```

DELETE não reinicia os contadores de IDs. Isso é esperado: os testes usam as
chaves geradas pelo banco e não dependem de os IDs começarem em 1. A tabela
`_prisma_migrations`, se existir, não deve ser apagada para limpar dados fictícios.

Referência: [restrições do TRUNCATE no MySQL](https://dev.mysql.com/doc/refman/8.0/en/truncate-table.html).

</details>

## 8. Resolver avisos de tipos no VS Code

O projeto já declara `@types/jest` nas dependências de desenvolvimento.
[tsconfig.json](./tsconfig.json) configura os tipos `node` e `jest` para os testes.
Não é necessário instalar Mocha.

Se o editor mostrar `Cannot find name 'describe'`, `beforeAll`, `it` ou `expect`:

1. Confira se executou `npm ci` na pasta do backend, incluindo as dependências
   de desenvolvimento.
2. Abra um arquivo TypeScript e pressione `Ctrl+Shift+P`.
3. Execute **TypeScript: Select TypeScript Version** e escolha **Use Workspace Version**.
4. Execute **TypeScript: Restart TS Server**.
5. Verifique os tipos pelo terminal:

   ```powershell
   npx tsc --project test/tsconfig.json
   ```

Sem erros, esse comando termina sem mensagens de diagnóstico.
Execute o teste com os scripts npm, não diretamente com `node` ou `ts-node`:
`describe`, `it` e os hooks são fornecidos pelo Jest durante a execução.

## Referências do projeto

- [Teste de integração](./persistencia.integration-spec.ts)
- [Consultas para o Workbench](./consultar-persistencia.sql)
- [Guia técnico de persistência e migração para PostgreSQL](../docs/PERSISTENCIA.md)
- [API de cadastro e busca: configuração e apresentação](../docs/CATALOGO-API.md)
- [Teste HTTP do fluxo do diagrama](./catalogo.integration-spec.ts)
- [Configuração e arquitetura do backend](../README.md)
- [Schema, migrations e conexão Prisma](../prisma/README.md)

## Demonstrar o fluxo do diagrama de sequência

Depois da preparação do banco, execute `npm run test:catalogo`: são dez testes
de cadastro, busca, validação, paginação, privacidade e rollback. Para preservar
um cadastro, use `npm run test:catalogo:visualizar` (um aprovado, nove pulados).

Copie o UUID exibido e rode `npm run start:demo` em outro terminal do backend.
Abra `http://localhost:3000/servicos?texto=UUID_DA_EXECUCAO` substituindo o UUID.
Você verá a aplicação consultando pelo Controller, Service, Repositório e Prisma.

Use o comando de limpeza exibido no terminal para remover aquela execução.
As consultas do arquivo `consultar-persistencia.sql` são do teste das oito
entidades; para o cadastro via API, use o SQL específico no
[roteiro de apresentação](../docs/CATALOGO-API.md#apresentação-para-o-grupo-e-o-professor).

## Seed de demonstração

A carga fixa para apresentação e seus testes estão documentados no
[guia do Prisma](../prisma/README.md#seed-local-para-apresentação).
`npm run test:seed` verifica as proteções sem banco; a integração exige
SEED_TEST_DATABASE_URL apontando para um banco descartável exclusivo.
O comando de reset local não faz parte da limpeza automática destas suítes.
