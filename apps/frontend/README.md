# HIVE - Frontend

## Sobre o frontend

O frontend do HIVE contém a tela de login e a integração com a API de
autenticação do backend. Ele é uma aplicação estática, sem processo de build.

O login envia uma requisição `POST` para `http://localhost:3000/login`. Quando
a autenticação é concluída, o usuário é redirecionado para `home.html`.

## Estrutura atual

```text
apps/frontend/
|- images/
|  |- Facebook_Logo_(2019).png
|  |- Google__G__logo.svg.png
|  `- Logo1.png
|- pages/
|  |- Hive.html
|  `- home.html
|- scripts/
|  `- login.js
|- styles/
|  `- Loguin.css
`- README.md
```

Arquivos principais:

- `pages/Hive.html`: formulário de login.
- `scripts/login.js`: valida os campos, chama a API e trata a resposta.
- `pages/home.html`: destino provisório após o login.
- `styles/Loguin.css`: estilos da tela.

## Pré-requisitos

- Node.js e npm instalados.
- MySQL em execução.
- Dependências do backend instaladas.
- Banco configurado no backend; para demonstrações, use um banco exclusivo terminado em `_test`.
- Python instalado para o servidor HTTP do exemplo (ou um servidor local equivalente).
- Usuário cadastrado com status `ATIVO`.

O frontend não acessa o banco diretamente. A URL do banco é configurada no
backend, em `apps/backend/.env/.env`, e nunca deve ser publicada no GitHub.

## Configurar a URL do banco

Dentro do arquivo local `apps/backend/.env/.env`, use este formato:

```dotenv
DATABASE_URL="mysql://USUARIO:SENHA@localhost:3306/hive"
MYSQL_LOCAL_PUBLIC_KEY_RETRIEVAL=true
```

Substitua `USUARIO` e `SENHA` pelos dados do seu MySQL. Se a senha tiver
caracteres especiais, codifique-os para URL. Por exemplo, `@` vira `%40`.

Para um banco novo, crie o banco pelo MySQL Workbench ou pelo cliente MySQL:

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
`scripts/login.js`.

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

## Servir o frontend

Não é recomendado abrir o HTML diretamente pelo Explorer usando `file://`.
Use um servidor HTTP local. Em outro terminal, a partir da raiz do projeto:

```powershell
cd apps/frontend
py -m http.server 5500 --bind 127.0.0.1
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
2. Abra `http://localhost:5500/pages/Hive.html`.
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
- O frontend usa CORS habilitado pela API durante o desenvolvimento local.
- A página de cadastro e os botões de login social ainda são visuais.
- O destino `home.html` é provisório e poderá ser substituído pela página
  inicial definitiva do HIVE.
- Nunca versione `.env`, senhas, tokens ou chaves privadas.

## Evolução planejada

A interface atual usa HTML, CSS e JavaScript. O planejamento de evolução com
Node.js/Next.js e as demais telas permanece registrado no [README principal](../../README.md).
