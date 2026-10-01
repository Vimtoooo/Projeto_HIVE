# HIVE - Frontend

## React e TypeScript com Next.js

Login, cadastro e Home agora são rotas React/TypeScript. O código dos formulários
foi migrado para componentes, e o Next.js gera o JavaScript executado pelo
navegador. O backend NestJS continua responsável por regras de negócio, senhas e
persistência no PostgreSQL. A integração de mensagens acrescenta uma migration de sessões, conversas e mensagens (veja o guia abaixo).

### Plano de adoção

1. **Concluído:** base Next.js, App Router, TypeScript estrito e proxy /api.
2. **Concluído:** migração do login, cadastro e Home para React; retirada da cópia
   automática de HTML/JavaScript legado e preservação do visual e da Home em andamento.
3. **Concluído:** contratos tipados, validação de respostas em execução, testes
   unitários e testes de navegador, CSS Modules para evitar conflitos entre telas.
4. **Concluído:** sessões com cookie HTTP-only, mensagens persistentes entre contas e histórico de prestadores contratados.
5. **Próximas etapas:** contratação pela interface, notificações e demais telas. A Home pode ser explorada publicamente; mensagens e histórico exigem sessão válida.

### Executar agora

Use Node.js **22.18 ou superior** (Node 24 usado na validação) e npm. O executor
nativo dos testes TypeScript exige essa base; Python não é mais usado no frontend.
Mantenha PostgreSQL e os dois servidores em execução. Na raiz do repositório:

**Terminal 1 — backend** (dependências e banco previamente preparados):

```powershell
cd apps/backend
$env:DOTENV_CONFIG_PATH = '.env/.env'
$env:PORT = '3000'
npm run start:dev
```

**Terminal 2 — frontend**, também partindo da raiz:

```powershell
cd apps/frontend
npm ci
npm run dev
```

Abra http://localhost:3001. A raiz vai para /login; cadastro em /cadastro e Home
em /home. Os antigos /pages/Hive.html, /pages/register.html e /pages/home.html
redirecionam para essas rotas. Não há mais arquivos HTML executáveis independentes
nem sincronização para public; o Next.js gera o HTML. Não use o servidor Python.

| Comando em apps/frontend | Finalidade |
| --- | --- |
| npm run dev | Iniciar Next.js na porta 3001, com atualização das telas |
| npm run lint | Conferir componentes, serviços e testes |
| npm run typecheck | Gerar tipos das rotas e verificar TypeScript, sem emitir JS |
| npm test | Testar validações e cliente HTTP com dados fictícios |
| npm run test:e2e | Testar telas no navegador, com API simulada |
| npm run build | Gerar aplicação de produção |
| npm start | Servir o build pronto na porta 3001 |

Para trocar a porta: npm run dev -- --port 3002. Não execute build e dev na mesma
pasta ao mesmo tempo; ambos usam .next. Os detalhes de testes estão no
[guia de testes](test/README.md).

### Configuração da API

O padrão é http://localhost:3000. Para trocar, crie .env.local na raiz do frontend:

```dotenv
API_URL=http://localhost:3000
```

Use somente a origem HTTP(S), sem caminho ou credenciais. Reinicie dev ou refaça
o build após alterar a variável. API_URL é usada no servidor, sem NEXT_PUBLIC_.
Nunca copie DATABASE_URL para o frontend. O navegador chama /api/login e
/api/clientes, encaminhados ao NestJS. Esse proxy não acrescenta autenticação.

### Organização

```text
frontend/
├── src/
│   ├── app/              # page.tsx e layout.tsx: rotas e layout do Next.js
│   ├── components/       # Formulários e componentes da Home em home/
│   ├── data/             # Catálogo fictício da demonstração
│   ├── services/         # ApiClient.ts: HTTP e validação das respostas
│   ├── types/            # ApiTypes.ts: contratos públicos
│   ├── lib/              # FormValidation.ts: máscaras e validações
│   └── styles/           # auth-page.module.css e home-page.module.css
├── public/images/       # Imagens originais versionadas em kebab-case
├── test/                # Testes unitários e cenários de navegador
├── docs/                # Cadastro e explicação técnica da migração
├── PlaywrightConfig.ts  # Configuração dos testes de navegador
├── next.config.mjs      # Proxy e redirecionamentos de compatibilidade
├── tsconfig.json        # TypeScript estrito
└── package.json         # Comandos e dependências
```

### Nomenclatura

Arquivos .ts e componentes .tsx próprios usam PascalCase: ApiClient.ts,
FormValidation.ts, LoginForm.tsx, FrontendTest.ts. CSS e imagens usam kebab-case,
com sufixo .module.css para isolamento. Novos exemplos HTML, se necessários,
devem usar nomes como pagina-home.html; as telas atuais são .tsx.

Exceções obrigatórias: page.tsx, layout.tsx e next-env.d.ts seguem convenções do
Next.js; package.json, tsconfig.json, next.config.mjs e eslint.config.mjs mantêm
os nomes reconhecidos pelas ferramentas. README.md, AGENTS.md e CLAUDE.md mantêm
suas convenções. Não renomeie arquivos reservados para PascalCase.

### Qualidade e limites

Formulários usam eventos React tipados, estado de envio e mensagens acessíveis.
Cliques repetidos são bloqueados enquanto a requisição está pendente; erros
liberam nova tentativa. Máscaras preservam CPF e telefone, incluindo fixos de
10 dígitos. O login aceita e-mail; autenticação por telefone não foi implementada.

O cliente trata JSON como unknown, valida o usuário retornado, interpreta erros
NestJS em texto ou lista e trata falha de conexão/timeout (15 segundos). Tipos
não substituem validação em execução nem autorização no backend. A confirmação
de senha não é enviada à API. As regras de CPF conferem formato, não dígitos verificadores.

Veja [migração técnica](docs/typescript-migration.md) e [cadastro](docs/registration.md).

## Pré-requisitos

- Node.js 22.18+ e npm, dependências instaladas em frontend e backend.
- PostgreSQL ativo e banco configurado; para demonstrações isoladas, use um banco _test.
- Conta cadastrada e ATIVA no mesmo banco usado pela API.

## Configurar a URL do banco

Dentro do arquivo local `apps/backend/.env/.env`, use este formato:

```dotenv
DATABASE_URL="postgresql://USUARIO:SENHA@localhost:5432/hive"
```

Substitua `USUARIO` e `SENHA` pelos dados do seu PostgreSQL. Se a senha tiver
caracteres especiais, codifique-os para URL. Por exemplo, `@` vira `%40`.

Para um banco novo, crie o banco pelo pgAdmin ou pelo cliente psql:

```sql
CREATE DATABASE hive;
```

Depois, no PowerShell, a partir da raiz do repositório:

```powershell
cd apps/backend
npm ci
$env:DOTENV_CONFIG_PATH=".env/.env"
npm run prisma:generate
npm run prisma:validate
npx prisma db push
```

Use `db push` apenas em um banco novo ou quando a alteração do schema tiver
sido revisada. Em um banco com dados importantes, não aceite perda de dados e
consulte a documentação do Prisma antes de sincronizar.


## Iniciar a API

Como o arquivo local atual está em `apps/backend/.env/.env`, informe esse
caminho ao `dotenv`. A porta `3000` precisa coincidir com a porta usada em
API_URL no frontend.

Em um terminal, a partir da raiz do repositório, execute:

```powershell
cd apps/backend
$env:DOTENV_CONFIG_PATH=".env/.env"
$env:PORT="3000"
npm run start:dev
```

Quando a API estiver funcionando, ela deverá registrar a rota:

```text
POST /login
```

Você também pode verificar a API abrindo:

```text
http://localhost:3000/
```

Para executar a versão compilada:

```powershell
cd apps/backend
$env:DOTENV_CONFIG_PATH=".env/.env"
$env:PORT="3000"
npm run build
npm run start:prod
```


## Criar a conta antes do login

Para dados fictícios, siga o [ambiente de testes do backend](../backend/README.md#ambiente-de-testes)
e mantenha a API no modo `serve`, na porta 3000. Isso direciona cadastro e
login ao mesmo banco de testes. Não inicie uma segunda API na mesma porta.

No REST Client, salve o exemplo abaixo em `apps/backend/http/login.local.http`
(ignorado pelo Git) e clique em **Send Request**. Todos os dados são fictícios:

```http
POST http://localhost:3000/prestadores
Content-Type: application/json

{
  "nome": "Pessoa Teste Login HIVE",
  "email": "api.28ad074c-85a1-493b-913b-d2adc9ae6c09@example.invalid",
  "senha": "LoginFicticio!2026",
  "telefone": "11999990000",
  "cpf": "90817263540",
  "endereco": "Rua Fictícia de Testes, 100",
  "areaAtuacao": "Montagem",
  "experiencia": "Experiência fictícia",
  "certificacoes": ["Certificação fictícia"],
  "cnpj": "90817263000140",
  "servico": {
    "titulo": "Serviço fictício para teste de login",
    "descricao": "Cadastro usado na demonstração do frontend",
    "precoBase": 100
  }
}
```

O cadastro deve retornar **201**. Repetir os mesmos dados retorna **409**;
nesse caso, reutilize a conta já criada ou limpe este lote antes de repetir.
Entre no formulário com o email e a senha acima, sem substituir o cadastro
por uma inserção SQL: a API grava a senha no formato scrypt esperado pelo login.
Se já existir um `login.local.http` com outra conta fictícia, use as credenciais
daquele arquivo e preserve seu UUID para limpeza.

Para remover somente a conta do exemplo e seus vínculos, em `apps/backend`:

```powershell
$env:DOTENV_CONFIG_PATH = '.env/.env.test.local'
node -r dotenv/config scripts/test-database.cjs clean 28ad074c-85a1-493b-913b-d2adc9ae6c09
```


## Testar o login

1. Confirme que a API está ativa em `http://localhost:3000`.
2. Abra `http://localhost:3001/login`.
3. Informe o e-mail de um usuário cadastrado.
4. Informe a senha correspondente.
5. Clique em **Logar**.

O frontend enviará:

```json
{
  "email": "usuario@email.com",
  "senha": "sua-senha"
}
```

Para o login ser aceito, o usuário precisa existir, estar com status `ATIVO` e
ter a senha correspondente ao hash armazenado no banco.

### Resultado esperado

- Login correto: `POST /login` retorna 201; o formulário navega automaticamente para `/home`.
- E-mail ou senha incorretos: a API retorna 401, exibe erro e permanece na tela.
- Conta inativa: a API rejeita a autenticação.
- API desligada: o navegador informa que não foi possível conectar ao servidor.

Os testes de navegador agora são permanentes e usam respostas simuladas. O teste
manual com backend e banco reais continua necessário para validar a integração completa.


## Encerrar os servidores

No terminal da API e no terminal do frontend, pressione `Ctrl+C`.


## Observações

- As imagens ficam em public/images e usam kebab-case; o destino do login é /home.
- O login cria sessão no backend por cookie HTTP-only. A Home é pública; conversas e histórico são privados e verificados pelo backend.
- O navegador usa o proxy /api na mesma origem. O frontend não acessa o banco diretamente.
- O cadastro de cliente já chama POST /clientes; os botões de login social ainda são visuais.
- A Home combina catálogo ilustrativo, profissionais cadastrados, mensagens reais e histórico de serviços concluídos. Contratação pela interface permanece futura.
- Nunca versione `.env`, senhas, tokens ou chaves privadas.


## Evolução planejada

As telas atuais usam React e TypeScript. A evolução das demais telas segue o plano acima.
O planejamento das demais telas permanece registrado no [README principal](../../README.md).


## Alternativa: contas do seed local

Para repetir a apresentação com contas e serviços previsíveis, siga o
[seed local do backend](../backend/prisma/README.md#seed-local-para-apresentação).
Após a carga, inicie a API com o mesmo DATABASE_URL e entre com
`ana@hive.example.invalid` e a senha fictícia `HiveDemo!2026`.
Essa alternativa dispensa o POST manual; o reset substitui todos os dados
do banco local selecionado.


## Versionamento e diagnóstico

Versione fontes, imagens originais em public/images e package-lock.json. O gitignore
exclui dependências, builds, relatórios, caches, .env, chaves, logs e backups; não
detecta segredos escritos no código nem aplica limite de tamanho. Revise git status.

Se o login falhar, confira F12 → Network: 401 indica credenciais rejeitadas ou
conta inativa; falhas de rede exigem conferir servidores, portas e API_URL.
Iniciar o frontend não executa seed. Não resete o banco para corrigir login.

Se .next ainda apontar para a estrutura antiga, encerre o Next.js e, somente
em apps/frontend, execute Remove-Item -LiteralPath .next -Recurse -Force.
Depois rode npm run dev. O comando remove apenas cache gerado.

## Home para demonstração

Acesse /home após entrar para ver seu primeiro nome. Sem login, a saudação
é de visitante. O login guarda somente ID e nome em sessionStorage para
apresentação; a autorização usa separadamente a sessão HTTP-only emitida pelo backend.

A busca aceita nomes, profissões e serviços, sem diferenciar acentos. Categorias
e favoritos podem ser combinados com a busca. As três seções ordenam os perfis
por distância ilustrativa, nota/avaliações e quantidade fictícia de serviços.
Detalhes dos perfis ilustrativos abrem em uma janela na própria Home. Mensagens reais têm uma página própria em `/mensagens`.

Favoritos ficam nesta aba, separados por usuário, e podem ser removidos. Ao
sair, a sessão é revogada na API e nome e favoritos do usuário atual são limpos. Se o armazenamento estiver
bloqueado, a apresentação usa memória e não persiste após recarregar.

Mensagens reais são acessíveis pelo menu e pelos cards de profissionais cadastrados.
Solicitações e notificações continuam futuras. Não há geolocalização, contratação ou pagamento pela interface.
Osasco, distâncias, preços e avaliações são dados fictícios. Veja o
[guia da Home](docs/home.md) e o [roteiro de testes](test/README.md).

## Mensagens reais e histórico de prestadores

Aplique a migration de sessões/conversas no backend e faça login novamente. “Profissionais cadastrados” permite iniciar conversas reais; “Contrate novamente” usa exclusivamente contratações concluídas da conta. Veja [configuração, demonstração com duas contas e limites](docs/messages.md).

A página `/mensagens` organiza contatos, chat e detalhes em painéis, com busca por nome e navegação adaptada ao celular. Consulte os [dois protótipos](docs/prototypes/README.md) e o [guia técnico de mensagens](docs/messages.md).
