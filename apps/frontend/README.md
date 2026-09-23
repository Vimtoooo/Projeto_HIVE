# HIVE - Frontend

## Adoção gradual do Next.js

Esta branch inicia a base **Next.js + React + TypeScript com App Router**.
As telas HTML/CSS existentes continuam como fonte durante a transição: login,
cadastro de cliente e Home são servidos pelo Next.js, sem reescrever o trabalho
da equipe. O backend NestJS e o PostgreSQL continuam separados.

### Plano de adoção

1. **Concluído — estrutura e execução:** package.json, lockfile, TypeScript,
   ESLint, layout e rota inicial no App Router; frontend na porta 3001.
2. **Concluído — compatibilidade:** copiar automaticamente as pastas de src/legacy para public e encaminhar /api ao backend. Preservar os
   formulários e a navegação existentes.
3. **Próxima etapa — migrar uma tela por vez:** transformar login, cadastro e
   Home em componentes React; manter o mesmo contrato JSON com o NestJS.
   Comparar comportamento e visual antes de substituir cada tela antiga.
4. **Próxima etapa — componentes compartilhados:** extrair campos, botões e
   navegação; usar CSS Modules para isolar estilos por tela. As telas atuais
   mantêm seus CSS, sem introduzir Tailwind nesta etapa.
5. **Próxima etapa — testes e sessão:** automatizar cadastro/login/erros nas
   rotas React e implementar sessão/autorização em conjunto com o backend.
   Next.js sozinho não torna a Home protegida.

### Executar agora

Pré-requisito: Node.js >= 20.9 (Node 24 já usado pelo projeto), npm e backend
configurado conforme seu [README](../backend/README.md). Não copie DATABASE_URL
para o frontend. Python é necessário apenas para a alternativa estática legada.

**Terminal 1 — API**, a partir da raiz do repositório:

```powershell
cd apps/backend
$env:DOTENV_CONFIG_PATH = '.env/.env'
$env:PORT = '3000'
npm run start:dev
```

**Terminal 2 — frontend**, a partir da raiz do repositório:

```powershell
cd apps/frontend
npm ci
npm run dev
```

Abra **http://localhost:3001**. A rota inicial redireciona para
/pages/Hive.html. Cadastro: /pages/register.html; Home: /pages/home.html.
O cadastro atual usa POST /clientes, já implementado nesta branch.
As portas diferentes evitam conflito com a API em 3000.

| Comando em apps/frontend | Uso |
| --- | --- |
| npm run dev | Servidor Next.js e sincronização das telas legadas |
| npm run assets:sync | Recriar manualmente os arquivos públicos das telas |
| npm run lint | Conferir o código novo Next.js e as ferramentas de execução |
| npm run typecheck | Verificar os tipos TypeScript |
| npm run build | Sincronizar telas e gerar o build de produção |
| npm start | Servir o build pronto na porta 3001 |

Para trocar a porta do servidor de desenvolvimento: `npm run dev -- --port 3002`.
Encerre com Ctrl+C. O servidor observa as quatro pastas-fonte durante o
`dev`; após editar HTML/CSS/JS, atualize a página no navegador. As futuras
rotas React usam a atualização automática do Next.js. Em produção, alterações
exigem um novo build.

### Configuração da API

O padrão é http://localhost:3000. Para alterá-lo, crie **.env.local** na raiz
do frontend (arquivo ignorado pelo Git):

```dotenv
API_URL=http://localhost:3000
```

API_URL deve conter somente a origem HTTP(S), sem caminho ou credenciais.
Reinicie o dev ou refaça o build após alterar essa variável. É uma variável
usada pelo servidor Next.js, sem prefixo NEXT_PUBLIC_. O navegador envia
requisições a /api/login e /api/clientes na mesma origem; o rewrite encaminha
para /login e /clientes do NestJS. Validações, senhas e acesso ao banco
continuam no backend. O proxy não acrescenta autenticação.

Os scripts-fonte mantêm localhost:3000 como alternativa para execução pelo
servidor estático antigo. Somente as cópias geradas recebem a configuração
/api; assim os dois modos continuam disponíveis.

### Organização durante a transição

```text
frontend/
├── src/
│   ├── app/               # Layout, CSS global e rotas React do App Router
│   └── legacy/            # Fontes das telas existentes durante a transição
│       ├── pages/         # Hive.html, register.html e home.html
│       ├── styles/        # CSS das telas HTML
│       ├── scripts/       # Login e cadastro em JavaScript
│       └── images/        # Imagens usadas pelas telas
├── docs/                  # Guia de cadastro e integração
├── public/                # Cópias geradas para servir as telas; não editar
├── tooling/               # Sincronização e execução de desenvolvimento
├── next.config.mjs        # Proxy da API e raiz do projeto
├── eslint.config.mjs      # Verificação do código Next.js e tooling
├── tsconfig.json          # Configuração TypeScript para src/
├── package.json           # Comandos e dependências
└── package-lock.json      # Versões reproduzíveis para o grupo
```

Edite as telas originais em src/legacy, nunca as cópias em public/pages, public/styles,
public/scripts e public/images: esses quatro diretórios são recriados. Não
coloque segredos nessas pastas. Eles, node_modules e .next são ignorados pelo
Git; package.json e package-lock.json devem ser versionados. Não crie arquivos
React em src/legacy/pages/: use src/app/ para não misturar os dois sistemas de rotas.

### Roteiro de verificação

- Abra a raiz, confira as imagens e navegue até o cadastro.
- Use conta fictícia ativa criada pela API ou pelo seed no mesmo banco do backend.
- Verifique senha incorreta (erro e permanência no login) e senha correta (Home).
- No Network, confira chamadas /api/login e /api/clientes; erro de conexão pode
  indicar API desligada ou API_URL incorreta.
- Rode lint, typecheck e build antes de compartilhar a estrutura.

Referência: [instalação e App Router do Next.js](https://nextjs.org/docs/app/getting-started/installation).
As instruções abaixo preservam os detalhes do banco e a alternativa HTML estática.


## Sobre o frontend

O frontend do HIVE contém a tela de login e a integração com a API de
autenticação do backend. As telas ainda são HTML/CSS/JavaScript, agora servidas pela base Next.js descrita acima. O modo estático permanece como alternativa.

No Next.js, o login envia `POST /api/login`, encaminhado ao backend em `http://localhost:3000/login`. Quando
a autenticação é concluída, o usuário é redirecionado para `home.html`.

## Estrutura atual

A árvore completa está em **Organização durante a transição** acima.
As imagens preservadas são Facebook_Logo_(2019).png, Google__G__logo.svg.png e Logo1.png.

Arquivos principais:

- `src/legacy/pages/Hive.html`: formulário de login.
- `src/legacy/scripts/login.js`: valida os campos, chama a API e trata a resposta.
- `src/legacy/pages/home.html`: destino provisório após o login.
- `src/legacy/styles/Loguin.css`: estilos da tela.

## Pré-requisitos

- Node.js e npm instalados.
- PostgreSQL em execução.
- Dependências do backend instaladas.
- Banco configurado no backend; para demonstrações, use um banco exclusivo terminado em `_test`.
- Python somente para o servidor estático alternativo; o Next.js usa Node.js.
- Usuário cadastrado com status `ATIVO`.

O frontend não acessa o banco diretamente. A URL do banco é configurada no
backend, em `apps/backend/.env/.env`, e nunca deve ser publicada no GitHub.

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
`src/legacy/scripts/login.js`.

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

## Servir o frontend sem Next.js (alternativa legada)

Não é recomendado abrir o HTML diretamente pelo Explorer usando `file://`.
Use um servidor HTTP local. Em outro terminal, a partir da raiz do projeto:

```powershell
cd apps/frontend
py -m http.server 5500 --bind 127.0.0.1 --directory src/legacy
```

Abra no navegador:

```text
http://localhost:5500/pages/Hive.html
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
2. Abra `http://localhost:3001` com Next.js (ou `http://localhost:5500/pages/Hive.html` no modo estático).
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

- Login correto: `POST /login` retorna 201; confirme o alerta de boas-vindas para abrir `home.html`.
- E-mail ou senha incorretos: a API retorna 401, exibe erro e permanece na tela.
- Conta inativa: a API rejeita a autenticação.
- API desligada: o navegador informa que não foi possível conectar ao servidor.

O fluxo foi verificado no Edge com cadastro por POST, rejeição de senha incorreta
e redirecionamento após senha correta. Isso valida a integração atual; não
representa uma suíte automatizada permanente de login.

## Encerrar os servidores

No terminal da API e no terminal do frontend, pressione `Ctrl+C`.

## Observações

- Os caminhos de imagens usam `images/`; o destino do login é `home.html` em minúsculas, inclusive em sistemas que distinguem maiúsculas de minúsculas.
- O login ainda não cria sessão/token. A Home é pública e pode ser aberta diretamente.
- No Next.js, o navegador usa o proxy /api na mesma origem; no modo estático, usa o CORS habilitado pela API.
- O cadastro de cliente já chama POST /clientes; os botões de login social ainda são visuais.
- O destino `home.html` é provisório e poderá ser substituído pela página
  inicial definitiva do HIVE.
- Nunca versione `.env`, senhas, tokens ou chaves privadas.

## Evolução planejada

A interface atual usa HTML, CSS e JavaScript. A base Next.js foi iniciada; a conversão das telas para React segue o plano acima.
O planejamento das demais telas permanece registrado no [README principal](../../README.md).

## Alternativa: contas do seed local

Para repetir a apresentação com contas e serviços previsíveis, siga o
[seed local do backend](../backend/prisma/README.md#seed-local-para-apresentação).
Após a carga, inicie a API com o mesmo DATABASE_URL e entre com
`ana@hive.example.invalid` e a senha fictícia `HiveDemo!2026`.
Essa alternativa dispensa o POST manual; o reset substitui todos os dados
do banco local selecionado.

## Arquivos versionados e cuidados locais

O .gitignore exclui dependências, builds, caches, cópias geradas em public,
logs, relatórios de testes, arquivos .env, chaves privadas e backups compactados
ou de banco. Imagens necessárias às telas, fontes e package-lock.json continuam
versionados. Não salve vídeos de demonstração ou dumps dentro do código-fonte.
O Git não aplica limite de tamanho pelo .gitignore, e arquivos já rastreados
continuam rastreados mesmo que uma nova regra os ignore. Confira git status antes
de cada commit; nunca coloque credenciais em HTML, JavaScript ou arquivos públicos.

As configurações do Next.js, TypeScript e npm permanecem na raiz por convenção
das ferramentas. AGENTS.md e CLAUDE.md são instruções geradas pelo Next.js para
assistentes de código; não são arquivos da interface.

Guia complementar: [cadastro de cliente](docs/registration.md).

## Diagnosticar a execução local

Mantenha PostgreSQL, backend (3000) e frontend (3001) executando simultaneamente.
Iniciar o Next.js não inicia o NestJS nem carrega o seed. A conta deve existir
no banco indicado pelo DATABASE_URL do backend. No navegador, F12 → Network:
201 no login indica sucesso; 401 indica credenciais rejeitadas ou conta inativa;
erros 500 exigem conferir a resposta e o terminal do backend. Falhas de conexão
exigem conferir os servidores, as portas e API_URL. Não use reset para tentar
corrigir um erro de login: ele substitui os dados do banco.

Se você já executou a estrutura anterior e aparecer erro em .next citando
app/page.js ou app/layout.js, encerre o Next.js com Ctrl+C. Em apps/frontend,
remova somente o cache gerado e reinicie:

```powershell
Remove-Item -LiteralPath .next -Recurse -Force
npm run dev
```

Essa limpeza não remove código nem dados do banco. Não execute dev e build
simultaneamente na mesma pasta, pois ambos usam .next.
