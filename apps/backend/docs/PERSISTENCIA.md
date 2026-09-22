# Persistência do HIVE com Prisma

> Atualização PostgreSQL: este documento preserva o planejamento e os exemplos da implementação MySQL original. O provider e o adaptador atuais são PostgreSQL; para comandos de conexão, testes, seed e consultas compatíveis, use os [guias do Prisma](../prisma/README.md) e de [testes](../test/README.md). O histórico PostgreSQL está implementado e testado; o SQL MySQL foi arquivado. Os dados legados fictícios serão recriados com seed, conforme decisão do grupo.


Implementado em 15 de setembro de 2026. O fluxo desta entrega é:

```text
Objetos de models → PersistenciaService → RepositorioDominio → Prisma Client → MySQL
```

O schema descreve a estrutura. `prisma generate` gera o client TypeScript;
`prisma db push` ou migrations sincronizam tabelas. Nenhum desses comandos
transfere automaticamente os objetos das classes: os métodos `criar...` abaixo
executam os inserts.

## Uso no backend

`AppModule` importa `PersistenciaModule`. Um serviço NestJS pode receber
`PersistenciaService` por injeção de dependência. Outros módulos que precisarem
dele devem importar `PersistenciaModule`.

```typescript
import { Injectable } from '@nestjs/common';
import { Usuario } from '../models/Usuario';
import { Prestador } from '../models/Prestador';
import { FormaPagamento } from '@prisma/client';
import { PersistenciaService } from '../persistence/persistencia.service';

@Injectable()
export class ExemploService {
  constructor(private readonly persistencia: PersistenciaService) {}

  async registrar(cliente: Usuario, prestador: Prestador) {
    const servico = prestador.cadastrarServico(
      'Montagem de mesa', 'Montagem de uma mesa de madeira', 200,
    );
    const contrato = cliente.solicitarContratacao(servico, 200, FormaPagamento.PIX);
    const fatura = contrato.gerarFatura();

    return this.persistencia.executar(async repositorio => {
      await repositorio.criarUsuario(cliente);
      await repositorio.criarPrestador(prestador);
      await repositorio.criarServico(servico);
      const registro = await repositorio.criarContratacao(contrato);
      await repositorio.criarFatura(fatura);
      return { idContratacao: registro.idContratacao };
    });
  }
}
```

O callback realiza commit somente se todas as etapas terminarem com sucesso.
Um erro propagado desfaz todas as gravações dessa operação. Use `await` em cada
etapa, em ordem de dependência; não capture erros para prosseguir com uma
transação parcialmente executada nem faça chamadas externas dentro dela.

| Método | Objetos que devem ter sido criados antes, na mesma transação |
| --- | --- |
| `criarUsuario(usuario)` | Nenhum; para uma instância de Prestador, use o método abaixo |
| `criarPrestador(prestador)` | Nenhum; cria Usuario e Prestador juntos, com a mesma PK |
| `criarServico(servico)` | Prestador |
| `criarIndicacao(indicacao)` | Usuário indicador e prestador indicado |
| `criarContratacao(contratacao)` | Contratante, serviço e indicação, quando houver |
| `criarFatura(fatura)` | Contratante e contratação |
| `criarAvaliacao(avaliacao)` | Contratação |
| `criarFinanceiro(financeiro)` | Contratação e fatura, quando houver |

Use as mesmas instâncias de objetos nas associações. O repositório mapeia cada
instância para o ID retornado pelo banco. Os contadores estáticos existentes nas
classes continuam servindo à demonstração em memória, não são PKs e não são
sobrescritos. Guarde os IDs dos registros retornados após o commit quando precisar
consultar o banco. Uma referência retornada antes de um rollback não é persistida.

Esta entrega implementa **inserção de objetos novos**. Não implementa atualização,
upsert, carregamento de registros como classes ou associação de objetos carregados
em outra transação. Essas operações exigirão contratos próprios de repositório;
não reutilize os IDs de demonstração para simulá-las. A camada agora é usada
pelo cadastro de prestador com serviço inicial na
[API de cadastro e busca](./CATALOGO-API.md), que também implementa consultas públicas.

Senhas novas são persistidas como `scrypt$salt$hash`, com salt aleatório. O método
`Usuario.autenticar` existente continua sendo uma demonstração em memória, não
um login contra o banco. Autenticação da API e verificação de hashes no login
ficam para essa implementação. Não exponha registros contendo hash em respostas HTTP.

## Ambiente

Execute na pasta `apps/backend`:

```powershell
npm ci
# Crie .env localmente conforme docs/CATALOGO-API.md e configure suas credenciais.
npm run prisma:generate
npm run build
```

`DATABASE_URL` aponta para o MySQL da aplicação. A fábrica em
`src/persistence/prisma-client.factory.ts` configura o adaptador do Prisma 7,
pool e conexão. Ela recusa parâmetros de URL não tratados; configure TLS e
outras opções explicitamente no adaptador caso use um servidor remoto.
O módulo reutiliza um client e encerra o pool no desligamento do NestJS.

Não execute `prisma/seed.ts` para validar esta entrega: o seed antigo apaga dados
e ainda utiliza a inicialização legada do client. Use os testes abaixo.

## Testes com dados fictícios e MySQL real

1. Crie um banco **separado**, por exemplo no MySQL Workbench:

   ```sql
   CREATE DATABASE hive_persistencia_test CHARACTER SET utf8mb4;
   ```

2. Crie `.env.test.local` conforme `test/README.md` e configure `TEST_DATABASE_URL`
   para esse banco. A senha deve ser codificada para URL quando necessário.
   O arquivo local é ignorado pelo Git. O usuário MySQL precisa poder criar
   tabelas nesse banco e executar as operações de leitura e escrita.

3. Execute:

   ```powershell
   npm run prisma:generate
   npm run test:db:prepare
   npm run test:persistencia
   ```

O comando de preparação executa `db push` **somente no destino de testes**, sem
`--accept-data-loss`, seed ou reset. O nome deve terminar em `_test` e ser diferente
do banco configurado para a aplicação. A suíte não pula testes silenciosamente
se faltar configuração ou o banco estiver inacessível.

`test/persistencia.integration-spec.ts` instancia as oito classes, grava via
Prisma, confirma o commit por uma segunda conexão e verifica:

- Campos, datas e relações, incluindo a herança Usuario/Prestador.
- Desconto da fatura, pagamento, avaliação e receitas/despesas com fatura opcional.
- Hash de senha verificável e ausência de senha em texto puro no registro novo.
- Colisão proposital entre um ID de demonstração e um ID já ocupado no banco.
- Rejeição de email/CPF duplicados, sem sobrescrever registros existentes.
- Rollback por erro, referência ainda não persistida ou criação repetida do objeto.

Depois das verificações, a suíte remove somente os dados fictícios identificados
por emails únicos daquela execução, em ordem de dependência. O banco e as tabelas
permanecem. Os documentos fictícios não representam pessoas reais e exercitam
as validações atuais de tamanho das classes; não são validações fiscais.

Os testes foram escritos primeiro: após corrigir `ignoreDeprecations` para o
TypeScript instalado, a primeira execução falhou porque a camada de persistência
ainda não existia. Depois da implementação, foram executados contra MySQL real.

## Visualizar os registros no MySQL Workbench

O comando normal limpa seus próprios dados ao terminar. Para preservar um cenário
completo e visualizar os registros, execute:

```powershell
npm run test:persistencia:visualizar
```

Esse comando executa apenas o caso que grava as oito entidades (um teste aprovado
e quatro ignorados intencionalmente). Ele mantém dois usuários, um prestador,
um serviço, uma indicação, uma contratação, uma fatura, uma avaliação e dois
lançamentos financeiros. Cada execução tem um UUID novo, exibido no terminal.

No Workbench, conecte-se ao mesmo servidor de `.env.test.local`, selecione o
banco indicado em `TEST_DATABASE_URL` e execute `test/consultar-persistencia.sql`,
substituindo `COLE_O_UUID_AQUI` pelo identificador exibido. Atualize a lista de
schemas se o banco não aparecer. As consultas mostram apenas aquela execução.

Depois de inspecionar:

```powershell
npm run test:persistencia:limpar -- UUID_EXIBIDO_NO_TERMINAL
```

A limpeza remove os registros daquela execução em transação e na ordem das FKs.
Não requer `TRUNCATE`, desativar chaves estrangeiras ou apagar o banco. Executar
a suíte normal depois de uma demonstração não remove a demonstração anterior.
`TRUNCATE` apaga a tabela inteira, tem limitações com FKs e não oferece o rollback
usado aqui ([documentação MySQL](https://dev.mysql.com/doc/refman/8.0/en/truncate-table.html)).

## Tipos do Jest no VS Code

`@types/jest` já é uma dependência de desenvolvimento. `test/tsconfig.json`
declara explicitamente os tipos `node` e `jest` para os arquivos de testes.
Verifique com `npx tsc --project test/tsconfig.json`.

Se os diagnósticos antigos continuarem no editor, abra a paleta de comandos
(`Ctrl+Shift+P`), selecione **TypeScript: Select TypeScript Version → Use Workspace
Version** e execute **TypeScript: Restart TS Server**. Em uma nova instalação,
execute `npm ci` no backend para instalar também as dependências de desenvolvimento.

## Compatibilidade com o banco existente

As migrations existentes usam as colunas `meioIndicacao` e `dataIndicacao`.
O schema expunha `meioIndicado` e `dataIndicado` sem mapeamento. Acrescentamos
`@map` para manter esses nomes na API TypeScript e usar os nomes físicos que
já existem no MySQL, sem renomear colunas nem alterar dados do banco principal.

Se outro ambiente tiver sido criado por `db push` com o schema antigo, suas
colunas podem usar os nomes antigos. Revise o diff e planeje uma migration de
renomeação preservando os valores antes de adotar esse schema nesse ambiente;
não aceite drops de colunas com dados.

## Preparação para PostgreSQL

O repositório utiliza operações tipadas do Prisma, sem SQL MySQL nas operações
de negócio. Para migrar:

1. Alterar `provider` no schema de `mysql` para `postgresql` e revisar os tipos.
2. Substituir o adaptador somente na fábrica por `@prisma/adapter-pg`, passando
   a URL PostgreSQL e configurando pool/TLS; atualizar as dependências.
3. Configurar as URLs e gerar novamente o Prisma Client.
4. Criar um histórico de migrations PostgreSQL. As migrations SQL MySQL atuais
   não são reutilizáveis; planejar separadamente a transferência dos dados e sequências.
5. Executar a mesma suíte de persistência no PostgreSQL, ajustando a preparação
   do banco e a porta padrão do validador de ambiente em `scripts/test-database.cjs`.

`Json`, relações e `@map` são mantidos no schema lógico. Não foi instalado nem
validado PostgreSQL nesta entrega. Valores monetários continuam no tipo `Float`
existente; uma mudança para `Decimal` exige uma migration e revisão dos cálculos
de domínio, não apenas a troca de adaptador.
