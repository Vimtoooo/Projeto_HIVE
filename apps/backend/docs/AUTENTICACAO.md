# Autenticação

## Login

O HIVE possui um endpoint para autenticação de usuários cadastrados.

### Endpoint

POST /login

### Requisição

O endpoint recebe o e-mail e a senha do usuário.

Exemplo:

{
  "email": "usuario@email.com",
  "senha": "123456"
}

### Processo de autenticação

1. O frontend envia o e-mail e a senha para a API.
2. O backend busca o usuário pelo e-mail no banco de dados.
3. O backend verifica se a conta está com status ATIVO.
4. A senha informada é comparada com o hash armazenado no banco.
5. Se os dados forem válidos, o backend retorna os dados básicos do usuário.

As senhas não são armazenadas em texto puro. O cadastro utiliza o algoritmo scrypt para gerar um hash com salt, e o login utiliza o mesmo algoritmo para verificar a senha informada.

### Resposta de sucesso

{
  "idUsuario": 1,
  "nome": "Nome do usuário",
  "email": "usuario@email.com",
  "tipoUsuario": "CONTRATANTE"
}

### Erros

Caso o usuário não exista ou a senha esteja incorreta, a API retorna um erro de autenticação.

Contas que não estejam com status ATIVO também não podem realizar login.

### Frontend

A página de login está localizada em:

apps/frontend/pages/Hive.html

O código responsável por realizar a autenticação está localizado em:

apps/frontend/scripts/login.js

O frontend envia uma requisição POST para:

http://localhost:3000/login

### CORS

O backend possui CORS habilitado para permitir que o frontend realize requisições para a API durante o desenvolvimento local.