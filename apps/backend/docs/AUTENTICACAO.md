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

apps/frontend/src/app/login/page.tsx

O código responsável por realizar a autenticação está localizado em:

apps/frontend/src/components/LoginForm.tsx e src/services/ApiClient.ts

O navegador envia POST /api/login ao Next.js, que encaminha ao backend:

http://localhost:3000/login

### CORS

O backend possui CORS habilitado para permitir que o frontend realize requisições para a API durante o desenvolvimento local.

## Sessão e autorização de mensagens

O login agora exige `Content-Type: application/json` e `X-Hive-Request: 1`. Além do mesmo corpo público de resposta, define o cookie `hive_session`, HTTP-only, SameSite=Lax, Path=/, com oito horas de validade e Secure em produção. O token aleatório tem 32 bytes; apenas seu hash SHA-256 é armazenado em Sessao. Tokens não ficam no localStorage/sessionStorage nem são retornados no JSON.

`GET /sessao` recupera a identidade pelo cookie. `POST /logout`, com o header `X-Hive-Request: 1`, revoga a sessão e expira o cookie. O frontend só limpa sua apresentação depois da confirmação do logout.

SessionGuard valida expiração e conta ATIVA. Operações de escrita exigem o header customizado para impedir formulários cross-origin; CORS não permite credenciais de outras origens. Use o frontend pelo proxy de mesma origem `/api`. A autorização de conversas verifica no servidor se o usuário é cliente ou prestador da dupla. Não aceita remetenteId ou contratanteId enviados pelo navegador como prova de identidade.

Conversas privadas retornam 404 para terceiros e 401 sem sessão válida. Essa implementação não é JWT/RBAC e não transforma as rotas públicas do catálogo em rotas privadas.
