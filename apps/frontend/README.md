# HIVE — Frontend

## 1. Sobre o frontend

O frontend do HIVE é responsável pela interface visual e pela interação do usuário com o sistema.

Atualmente, a parte implementada inclui a tela de login e sua integração com a API de autenticação do backend.

---

## 2. Estrutura atual

```text
apps/frontend/
├── imagens/
│   ├── Facebook_Logo_(2019).png
│   ├── Google__G__logo.svg.png
│   └── Logo1.png
│
├── pages/
│   ├── Hive.html
│   └── home.html
│
├── scripts/
│   └── login.js
│
├── styles/
│   └── Loguin.css
│
└── README.md

3. Alterações realizadas
Etapa 1 — Tela de login

Arquivo:

apps/frontend/pages/Hive.html

A tela de login já possuía a estrutura visual do HIVE, contendo:

Campo de e-mail.
Campo de senha.
Botão de login.
Botão de cadastro.
Identidade visual do HIVE.

O botão de login foi adaptado para executar uma função JavaScript:

<button type="button" class="btn-login" id="btn-login">Logar</button>

Etapa 2 — Criação da lógica de login

Arquivo criado:

apps/frontend/scripts/login.js

Esse arquivo é responsável por:

Capturar o e-mail digitado.
Capturar a senha digitada.
Verificar se os campos foram preenchidos.
Enviar os dados para a API do backend.
Receber a resposta da API.
Informar ao usuário se o login foi realizado ou não.
Redirecionar o usuário após o login bem-sucedido.

A comunicação é realizada através de:

POST http://localhost:3000/login

Etapa 3 — Conexão entre HTML e JavaScript

Arquivo:

apps/frontend/pages/Hive.html

Foi adicionada a importação do JavaScript antes do fechamento do body:

<script src="../scripts/login.js"></script>

Com isso, a página de login passa a utilizar o código responsável pela autenticação.

Etapa 4 — Página inicial provisória

Arquivo criado:

apps/frontend/pages/home.html

Essa página foi criada para demonstrar visualmente que o login foi concluído.

Atualmente ela possui uma mensagem indicando que o login foi realizado com sucesso.

Essa página é uma destinação provisória e poderá ser substituída posteriormente pela página inicial definitiva do HIVE.


Etapa 5 — Redirecionamento após o login

Arquivo:

apps/frontend/scripts/login.js

Após a API confirmar o login, o frontend redireciona o usuário para:

./home.html

Como Hive.html e home.html estão dentro da mesma pasta pages, o caminho relativo funciona dessa forma.


Etapa 5 — Redirecionamento após o login

Arquivo:

apps/frontend/scripts/login.js

Após a API confirmar o login, o frontend redireciona o usuário para:

./home.html

Como Hive.html e home.html estão dentro da mesma pasta pages, o caminho relativo funciona dessa forma.


5. Como testar
Pré-requisitos

Para realizar o teste completo, é necessário:

Backend do HIVE funcionando.
Banco de dados funcionando.
Existência de um usuário cadastrado.
Usuário com status ATIVO.
E-mail e senha conhecidos para realizar o teste.


Passo 1 — Iniciar o backend

Inicie a API do backend na porta:

http://localhost:3000
Passo 2 — Abrir a tela de login

Abra:

apps/frontend/pages/Hive.html
Passo 3 — Informar os dados

Preencha:

E-mail: e-mail do usuário cadastrado
Senha: senha do usuário cadastrado
Passo 4 — Realizar o login

Clique no botão:

Logar

O arquivo login.js enviará uma requisição:

POST http://localhost:3000/login

com os dados:

{
  "email": "usuario@email.com",
  "senha": "123456"
}
Passo 5 — Verificar o resultado
Login correto

Caso os dados estejam corretos:

O backend autentica o usuário.
O frontend exibe a mensagem de boas-vindas.
O usuário é redirecionado para:
apps/frontend/pages/home.html
Login incorreto

Caso o e-mail ou a senha estejam incorretos, o frontend apresenta uma mensagem de erro e permanece na tela de login.

Conta não ativa

Caso o usuário exista, mas sua conta não esteja com status ATIVO, o backend rejeita a autenticação.


Passo 1 — Iniciar o backend

Inicie a API do backend na porta:

http://localhost:3000
Passo 2 — Abrir a tela de login

Abra:

apps/frontend/pages/Hive.html
Passo 3 — Informar os dados

Preencha:

E-mail: e-mail do usuário cadastrado
Senha: senha do usuário cadastrado
Passo 4 — Realizar o login

Clique no botão:

Logar

O arquivo login.js enviará uma requisição:

POST http://localhost:3000/login

com os dados:

{
  "email": "usuario@email.com",
  "senha": "123456"
}
Passo 5 — Verificar o resultado
Login correto

Caso os dados estejam corretos:

O backend autentica o usuário.
O frontend exibe a mensagem de boas-vindas.
O usuário é redirecionado para:
apps/frontend/pages/home.html
Login incorreto

Caso o e-mail ou a senha estejam incorretos, o frontend apresenta uma mensagem de erro e permanece na tela de login.

Conta não ativa

Caso o usuário exista, mas sua conta não esteja com status ATIVO, o backend rejeita a autenticação.git status
