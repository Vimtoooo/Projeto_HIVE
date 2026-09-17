# Backend do HIVE

API NestJS com Prisma 7 e MySQL. Esta etapa conecta as classes de domínio à
aplicação HTTP: cadastro de prestador com serviço inicial e busca de serviços.
O frontend estático ainda não está conectado a essas rotas.

## Preparar o ambiente

Execute os comandos desta página em `apps/backend`. O ambiente usado na
validação foi Node.js 24.13, npm 11 e MySQL 8.0; as versões de dependências
resolvidas estão em `package-lock.json`.

```powershell
npm ci
```

Crie `.env` manualmente, com suas credenciais locais:

```dotenv
DATABASE_URL="mysql://SEU_USUARIO:SUA_SENHA@localhost:3306/hive"
PORT=3000
```

Não versione esse arquivo. Os modelos `.env.example` também são ignorados;
os exemplos da documentação usam apenas valores fictícios. Caracteres especiais
nas credenciais devem ser codificados para URL.

Crie o banco da aplicação no MySQL e gere o client:

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
dados nem use o seed legado para preparar a demonstração. Veja o
[README do Prisma](prisma/README.md) para distinguir client, schema e inserções.

Se o MySQL 8 local exigir a chave RSA após reiniciar, acrescente ao `.env`:

```dotenv
MYSQL_LOCAL_PUBLIC_KEY_RETRIEVAL=true
```

Essa opção só é aceita para hosts de loopback. Para servidores remotos, use
chave pública confiável ou configure TLS validado, conforme o
[guia da API](docs/CATALOGO-API.md#configurar-e-iniciar).

Para executar a versão compilada:

```powershell
npm run build
npm run start:prod
```

O script usa `dist/src/main`. O build é necessário para refletir mudanças no código.

## Rotas disponíveis

| Método e rota | Comportamento |
| --- | --- |
| `POST /prestadores` | Cria Usuario, Prestador e o primeiro Servico juntos; retorna 201 |
| `GET /servicos` | Busca pública com filtros, paginação e retorno somente de campos públicos |
| `GET /` | Verificação básica já existente; retorna Hello World! |

O POST exige dados pessoais, dados profissionais e o objeto `servico`.
O GET aceita `texto`, `areaAtuacao`, `precoMin`, `precoMax`, `prestadorId`,
`pagina` e `limite`. O [contrato da API](docs/CATALOGO-API.md) detalha os campos,
limites, exemplos JSON e respostas 400, 409, 503 e 500.

## Arquitetura e motivos das mudanças

| Camada | Responsabilidade e motivo |
| --- | --- |
| `src/catalogo/servico.controller.ts` | Recebe POST/GET e delega ao serviço, seguindo o diagrama de sequência |
| `src/catalogo/catalogo.dto.ts` | Valida formatos, limites e campos extras antes de executar regras ou acessar o banco |
| `src/catalogo/servico.service.ts` | Coordena o cadastro e a busca, verifica intervalo de preços e traduz erros para HTTP |
| `src/catalogo/servico.repository.ts` | Define consultas e projeções públicas; evita expor senha, documentos e contato |
| `src/models/` | Mantém as classes Prestador/Servico e demais regras de domínio já utilizadas nos testes |
| `src/persistence/` | Reutiliza transações, gravação das classes, conexão e adaptador do banco |

`AppModule` registra `CatalogoModule` e um `ValidationPipe` global com transformação,
whitelist e rejeição de campos desconhecidos. `class-validator` e
`class-transformer` fornecem a validação em tempo de execução; tipos TypeScript
sozinhos não validam um JSON recebido pela rede.

O cadastro usa uma transação para impedir perfis ou serviços parciais. Os IDs
são gerados pelo banco, não pelos contadores das classes. Email, CPF e CNPJ
únicos evitam duplicidade; uma colisão retorna 409 sem sobrescrever dados.

A senha é transformada em hash scrypt com salt. A busca seleciona explicitamente
os campos públicos, retorna somente serviços e contas ativos e ordena por ID.
A lista e sua contagem são consultadas na mesma transação com RepeatableRead.

A fábrica do client concentra o driver MySQL, permitindo planejar a troca para
PostgreSQL sem espalhar configuração de conexão pelos controllers. Isso não
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
implementa login da API.

## Documentação complementar

- [Plano de implementação](docs/PLANO-CADASTRO-BUSCA.md)
- [Persistência: transações, relações e limitações](docs/PERSISTENCIA.md)
- [Prisma: schema, migrations e troca de banco](prisma/README.md)
- [Segurança e sincronização após limpeza do histórico](docs/SEGURANCA-HISTORICO.md)

O HIVE segue a [licença do repositório](../../LICENSE); as licenças das dependências
continuam aplicáveis a seus respectivos códigos.
