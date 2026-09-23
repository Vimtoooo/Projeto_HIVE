# Tela de Registro de Cliente — HIVE

## O que essa funcionalidade faz

A tela de registro (`register.html`) permite que um novo cliente crie uma conta no HIVE.

**Fluxo completo:**
1. O usuário preenche o formulário de cadastro (nome, CPF, telefone, endereço, e-mail, senha e confirmação de senha).
2. O front-end valida os dados (CPF com 11 dígitos, telefone com 10 ou 11 dígitos, senha com no mínimo 8 caracteres e senhas iguais).
3. Os dados são enviados para o backend (`POST /clientes`), que salva o novo usuário no banco de dados.
4. Se o cadastro der certo, o usuário é redirecionado para a **tela de login** (`Hive.html`).
5. Ao fazer login com o e-mail e senha recém-criados, o sistema (fluxo que já existia antes) redireciona o usuário para a **home page** (`home.html`).

Ou seja: **registro → login → home**, como foi pedido.

## Linha do tempo das modificações

### 1. Criação da tela de registro (front-end)
- Foi criado o arquivo `apps/frontend/pages/register.html`, reaproveitando o mesmo layout visual e o mesmo CSS (`Loguin.css`) já usado na tela de login, pra manter a identidade visual do HIVE.
- Foi criado `apps/frontend/scripts/register.js`, responsável por:
  - Aplicar máscara de CPF e telefone enquanto o usuário digita.
  - Validar os campos antes de enviar.
  - Fazer a requisição `POST` para o backend.
  - Mostrar mensagem de erro na tela se algo falhar (ex: e-mail já cadastrado).
  - Redirecionar para a tela de login (`Hive.html`) quando o cadastro é concluído com sucesso.

### 2. Identificação de que faltava uma rota no backend
Ao revisar o backend, percebemos que só existiam as rotas `POST /login` (login) e `POST /prestadores` (cadastro de prestador de serviço). **Não existia nenhuma rota para cadastrar um cliente.**

### 3. Criação da rota de cadastro de cliente (backend)
Essa parte foi feita **com apoio de IA**, já que envolve lógica de backend e banco de dados — algo fora do que sei fazer sozinho no momento (meu foco até aqui foi front-end).

Foram criados 4 arquivos novos, dentro de uma pasta nova `apps/backend/src/cliente/`:

| Arquivo | O que faz |
| --- | --- |
| `cliente.dto.ts` | Define e valida os dados que chegam do formulário (nome, e-mail, senha, telefone, CPF, endereço) |
| `cliente.service.ts` | Contém a lógica de cadastro: monta um novo usuário do tipo "Contratante" e usa a função `criarUsuario`, que já existia no repositório do banco de dados, para salvar |
| `cliente.controller.ts` | Cria a rota `POST /clientes`, que recebe a requisição do front-end |
| `cliente.module.ts` | Junta os três arquivos acima em um módulo do NestJS |

Importante: **não foi criada nenhuma tabela nova no banco**. A tabela `Usuario` já existia (é a mesma usada no login e no cadastro de prestador) e já tinha um método pronto (`criarUsuario`) para salvar um cliente — só faltava a rota que chamasse esse método.

### 4. Registro do novo módulo
O arquivo `apps/backend/src/app.module.ts` foi atualizado para incluir o `ClienteModule` na lista de módulos do sistema, junto dos que já existiam (`AuthModule`, `CatalogoModule`).

### 5. Verificação do CORS
Foi confirmado que o backend permite requisições vindas do front-end mesmo rodando em portas diferentes (front na porta 5500, backend na porta 3000), usando `app.enableCors()` no `main.ts`.

## Caminhos dos arquivos (para referência)

```
apps/
├── frontend/
│   ├── pages/
│   │   └── register.html          ← tela de cadastro (novo)
│   ├── scripts/
│   │   └── register.js            ← lógica de validação e envio (novo)
│   └── styles/
│       └── Loguin.css             ← reaproveitado, sem alterações
│
└── backend/
    └── src/
        ├── cliente/                       ← pasta nova
        │   ├── cliente.dto.ts             ← novo
        │   ├── cliente.service.ts         ← novo
        │   ├── cliente.controller.ts      ← novo
        │   └── cliente.module.ts          ← novo
        └── app.module.ts                  ← modificado (adicionado ClienteModule)
```

## Como testar depois do `git pull`

Como cada integrante tem o próprio banco de dados local (o `.env` não é versionado no Git), é preciso confirmar alguns pontos antes de testar:

1. `git pull` para trazer os arquivos novos.
2. Ter o arquivo `.env/.env` já configurado com a `DATABASE_URL` do seu banco local (se o login já funciona na sua máquina, isso já está configurado).
3. **Não é necessário rodar nenhuma migration nova** — a tabela `Usuario` já existia e já suportava esse tipo de cadastro.
4. Rodar o backend:
   ```powershell
   cd apps/backend
   npm run start:dev
   ```
5. Confirmar no terminal que a rota `POST /clientes` aparece no mapeamento de rotas do NestJS.
6. Rodar o front-end com um servidor local (não abrir o HTML direto):
   ```powershell
   cd apps/frontend
   py -m http.server 5500 --bind 127.0.0.1
   ```
7. Acessar `http://localhost:5500/pages/register.html` e testar o cadastro.
8. Fazer login com o e-mail e senha cadastrados e confirmar o redirecionamento até a home.

## Observações

- O ambiente atual é 100% local (`localhost`) — ainda não há servidor externo.
- A home page ainda é provisória; ela está sendo desenvolvida separadamente pelo líder do grupo.
- Qualquer erro de CORS ou de conexão aparece no console do navegador (F12 → aba Console ou Network) e ajuda a identificar se o problema é no front ou no backend.