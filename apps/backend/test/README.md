# Como executar os testes de persistência do HIVE

Este guia mostra como testar a transferência dos objetos de `src/models` para
o MySQL pelo Prisma, consultar os dados fictícios e removê-los depois.

## Consulta rápida

Execute os comandos na pasta `apps/backend`, não dentro de `test`.

| Comando | Finalidade |
| --- | --- |
| `npm run prisma:generate` | Gerar o Prisma Client a partir do schema |
| `npm run test:db:prepare` | Preparar as tabelas no banco exclusivo de testes |
| `npm run test:persistencia` | Executar os cinco testes e limpar os dados da execução |
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

É necessário ter Node.js, npm e um servidor MySQL disponível. Não é necessário
iniciar a API NestJS: os testes acessam a camada de persistência diretamente.

## 2. Configurar um banco exclusivo para os testes

O banco utilizado na validação local foi `hive_pi_20260915_test`.
O arquivo `apps/backend/.env.test.local` já foi configurado nessa máquina,
mas não é enviado ao GitHub por conter credenciais.

Em uma nova instalação:

1. Inicie o MySQL e conecte-se pelo MySQL Workbench.
2. Crie um banco separado, por exemplo:

   ```sql
   CREATE DATABASE IF NOT EXISTS hive_pi_20260915_test CHARACTER SET utf8mb4;
   ```

3. Se `.env.test.local` ainda não existir, copie o modelo, no terminal do backend:

   ```powershell
   Copy-Item .env.test.example .env.test.local
   ```

4. Edite `.env.test.local` com as credenciais do seu MySQL:

   ```dotenv
   TEST_DATABASE_URL="mysql://SEU_USUARIO:SUA_SENHA@localhost:3306/hive_pi_20260915_test"
   ```

Substitua usuário e senha. Caracteres especiais nas credenciais precisam estar
codificados para URL. O usuário do banco precisa de permissões para preparar as
tabelas e executar consultas, inserções e exclusões nesse banco.

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

## 6. Consultar os dados no MySQL Workbench

Conecte-se ao mesmo servidor e porta configurados em `.env.test.local`.
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
- [Modelo de configuração do banco de testes](../.env.test.example)
