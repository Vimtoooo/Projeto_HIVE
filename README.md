# HIVE - Sistema para Registro de Serviços e Prestadores Autônomos

<p align="center">
  <img src="https://nestjs.com/img/logo-small.svg" width="100" alt="Nest Logo" />
  <img src="https://raw.githubusercontent.com/devicons/devicon/7330accdbc47e2dc0c19789a48533c4a3c50fe58/icons/prisma/prisma-original.svg" width="100" alt="Prisma Logo" />
</p>

O **HIVE** é uma plataforma robusta de intermediação de serviços, desenvolvida com foco em escalabilidade, integridade de dados e princípios avançados de Orientação a Objetos. O projeto visa conectar prestadores de serviço e contratantes através de um ecossistema seguro e auditável.

---

## 🚀 Destaques da Arquitetura

A arquitetura organiza as regras em **classes de domínio** e o fluxo da API em Controller → Service → Repositório → Prisma/PostgreSQL. As classes ainda utilizam tipos e enums do Prisma. A orientação a Domain-Driven Design (DDD) e a independência das regras em relação à infraestrutura permanecem como direção arquitetural.

*   **Encapsulamento Rigoroso**: Atributos privados protegidos por lógica de validação em *setters*.
*   **Princípio Fail-Fast**: DTOs e classes validam campos antes da persistência. CPF e CNPJ são verificados por formato e comprimento, sem cálculo de dígitos verificadores.
*   **Modelagem de Herança**: Implementação de especialização de classes onde `Prestador` estende `Usuario`, compartilhando atributos base e estendendo funcionalidades específicas.
*   **Persistência com Prisma**: Mapeamento objeto-relacional (ORM) configurado para PostgreSQL, garantindo consistência entre as classes TypeScript e o schema do banco.
*   **Regras de Domínio**: Classes modelam faturamento, indicação e financeiro; esses fluxos ainda não possuem endpoints na API.

## Integração atual

O backend já oferece cadastro de prestador com seu primeiro serviço em uma transação e busca de serviços ativos com filtros e paginação, via API REST em NestJS e persistência Prisma/PostgreSQL. Há testes automatizados com banco de testes e exemplos HTTP para demonstração. O frontend já realiza login via API e redireciona para a Home. Sessão/token, autorização e endpoints de contratação, pagamento e avaliação continuam no roadmap.

Consulte os guias do [backend](apps/backend/README.md), [testes](apps/backend/test/README.md), [Prisma](apps/backend/prisma/README.md) e [requisições HTTP](apps/backend/http/README.md) para configuração, execução e limpeza dos dados fictícios.

A migração atual usa `@prisma/adapter-pg` e URLs `postgresql://` (porta padrão 5432). Os bancos locais devem ser preparados no PostgreSQL; há uma migration inicial PostgreSQL validada, e o SQL MySQL foi arquivado. Como os dados legados são fictícios, serão recriados pelo seed; não há cópia automática. Consulte o [guia do Prisma](apps/backend/prisma/README.md#preparação-para-postgresql).

## 🛠️ Stack Tecnológica

| Camada | Tecnologias |
| :--- | :--- |
| **Frontend atual** | Next.js + React + TypeScript + CSS Modules; cadastro e login integrados à API |
| **Planejamento do frontend** | Base Node.js/Next.js adotada; evolução das telas, sessão e componentes compartilhados |
| **Backend** | Node.js + NestJS (TypeScript) |
| **Persistência** | PostgreSQL + Prisma ORM |
| **Testes** | Jest, integração com PostgreSQL e exemplos HTTP |
| **Qualidade de código** | TypeScript, ESLint e Prettier |
| **Ambiente planejado** | Docker; configuração ainda a implementar |

Node.js é um ambiente de execução JavaScript, enquanto NestJS e Next.js são frameworks distintos. O backend já usa NestJS sobre Node.js; o frontend agora usa Node.js/Next.js com React e TypeScript. Os demais itens planejados continuam como evolução futura.

## 📂 Estrutura do Projeto

Principais diretórios e arquivos (dependências e saídas de compilação omitidas):

```text
HIVE/
├── apps/                          # Aplicações do projeto
│   ├── backend/                   # API NestJS e persistência
│   │   ├── docs/                  # Contratos e explicações técnicas
│   │   ├── http/                  # Exemplos para o REST Client
│   │   ├── prisma/                # Schema, migrations e seed
│   │   ├── scripts/               # Preparação e limpeza do banco de testes
│   │   ├── src/                   # Código-fonte do backend
│   │   │   ├── auth/              # Login e verificação de senha
│   │   │   ├── catalog/           # Cadastro de prestador e busca de serviços
│   │   │   ├── enums/             # Enumerações auxiliares do domínio
│   │   │   ├── models/            # Classes de domínio
│   │   │   ├── persistence/       # Cliente Prisma e repositório de domínio
│   │   │   └── main.ts            # Inicialização da API
│   │   ├── test/                  # Integração, E2E e demonstrações
│   │   │   └── support/           # Limpeza seletiva de dados fictícios
│   │   └── README.md              # Configuração e execução do backend
│   └── frontend/                  # Next.js com telas React/TypeScript
│       ├── src/app/               # Layout e rotas React
│       ├── src/components/        # Formulários tipados de login e cadastro
│       ├── docs/                  # Guia do cadastro de cliente
│       └── public/images/         # Imagens originais versionadas
├── LICENSE                        # Termos de uso do código
└── README.md                      # Visão geral do projeto
```

## 📋 Entidades de Domínio

Abaixo, as principais entidades que compõem a lógica do HIVE:

1.  **Usuario/Prestador**: Gestão de perfis com validação de formato de CPF/CNPJ e unicidade na persistência.
2.  **Servico**: Catálogo de ofertas vinculadas a prestadores com controle de status (Ativo/Inativo).
3.  **Contratacao**: Orquestração do fluxo de serviço, incluindo cálculo de valores e aplicação de regras de indicação.
4.  **Indicacao**: Sistema de *referral* que permite rastrear a origem de novos usuários e aplicar benefícios financeiros.
5.  **Avaliacao**: Registro de nota e comentário associado à contratação.
6.  **Fatura/Financeiro**: Gestão de contas a receber e lançamentos contábeis automáticos após conclusões de serviço.

## ⚙️ Instalação e Execução

Para preparar o backend e demonstrar a API com dados fictícios:

### 1. Clonar o Repositório
```bash
git clone https://github.com/Vimtoooo/Projeto_HIVE.git
cd Projeto_HIVE/apps/backend
```

### 2. Instalar Dependências
```bash
npm install
```

### 3. Configurar Ambiente
Configure os arquivos de ambiente locais conforme o [guia do backend](apps/backend/README.md). Eles não são versionados; use um banco exclusivo de testes para as demonstrações.

### 4. Preparar o Banco de Dados

Comandos abaixo em `apps/backend` (PowerShell), após criar o banco local e
configurar DATABASE_URL em `.env/.env`:

```powershell
$env:DOTENV_CONFIG_PATH = '.env/.env'
npm run prisma:generate
npm run prisma:validate
npx prisma db push
```

Use `db push` para preparar um banco novo; em banco existente, revise as
mudanças de estrutura e não aceite perda de dados automaticamente.

### 5. Executar a API e o Frontend

No mesmo terminal do backend:

```powershell
$env:PORT = '3000'
npm run start:dev
```

Para executar com Next.js, siga o [guia do frontend](apps/frontend/README.md#executar-agora).
Execute em outro terminal, a partir da raiz:

```powershell
cd apps/frontend
npm ci
npm run dev
```

Abra [a tela de login](http://localhost:3001/login). A conta deve
existir no mesmo banco da API, criada por POST /prestadores ou pelo seed.
O login abre `/home`; a Home ainda é pública, sem sessão/token.
O cadastro na interface já usa POST /clientes; o login social continua visual. Detalhes no
[guia do frontend](apps/frontend/README.md).

### Comandos úteis

Execute em `apps/backend`. Os comandos de seed/reset exigem schema preparado;
selecione o arquivo de ambiente antes de escolher **uma** operação.

| Objetivo | Comando |
| --- | --- |
| Popular o banco vazio hive | `npm run db:seed:local -- --confirm hive` |
| Apagar os dados do hive e repor o seed | `npm run db:reset:local -- --confirm hive` |
| Popular o banco vazio de testes | `npm run db:seed:test -- --confirm hive_pi_20260915_test` |
| Apagar dados de testes e repor o seed | `npm run db:reset:test -- --confirm hive_pi_20260915_test` |
| Testes unitários | `npm test -- --runInBand` |
| Teste E2E básico | `npm run test:e2e -- --runInBand` |
| Proteções do seed | `npm run test:seed` |
| Verificar lint e tipos | `npm run lint:check` e `npx tsc --project test/tsconfig.json` |
| Aplicar migrations / consultar situação | `npm run db:migrate:deploy` / `npm run db:migrate:status` |
| Validar migrations em banco descartável | `npm run test:migrations` |
| Compilar e executar o build | `npm run build`, depois `npm run start:prod` |

**Reset apaga os dados das oito tabelas e repõe os exemplos; não é apenas
limpeza.** Pare a API antes. Os comandos locais usam DATABASE_URL; os comandos
`:test` usam TEST_DATABASE_URL. Para estes últimos, configure
`$env:DOTENV_CONFIG_PATH = '.env/.env.test.local'`. O nome após `--confirm`
deve coincidir com o banco configurado. Nenhum desses comandos recria o schema.

O seed oferece três contas, incluindo `ana@hive.example.invalid`, com a senha
fictícia `HiveDemo!2026`. Veja os dados, proteções e testes de integração
opt-in no [guia do seed](apps/backend/prisma/README.md#seed-local-para-apresentação).

### Demonstração e integração no banco de testes

Com os arquivos dentro de `.env/`, carregue as variáveis antes do script:

```powershell
$env:DOTENV_CONFIG_PATH = '.env/.env.test.local'
$env:PORT = '3000'
node -r dotenv/config scripts/test-database.cjs prepare
node -r dotenv/config scripts/test-database.cjs test
node -r dotenv/config scripts/test-database.cjs api
node -r dotenv/config scripts/test-database.cjs serve
```

Os modos correspondem a `test:db:prepare`, `test:persistencia`,
`test:catalogo` e `start:demo`. O último mantém a API ligada ao banco de testes,
sem build; não o execute junto com outra API na porta 3000. Se usar arquivos na raiz do backend, informe explicitamente seu caminho em
`DOTENV_CONFIG_PATH`; nesta branch, o padrão fica dentro de `.env/`.
Limpeza seletiva por UUID e roteiro de apresentação estão no
[README dos testes](apps/backend/test/README.md).

## 📈 Roadmap

- [x] Modelagem de Domínio e Validações de Integridade.
- [x] Integração inicial com Prisma ORM e MySQL (histórico).
- [x] Migração do provider e do adaptador da aplicação para PostgreSQL.
- [x] Consolidar migrations PostgreSQL e validar baseline para bancos existentes.
- [x] Definir recriação dos dados fictícios legados pelo seed.
- [ ] Implementação de Autenticação JWT e RBAC (Role-Based Access Control).
- [x] Endpoints REST de cadastro de prestador e busca de serviços no NestJS.
- [ ] Endpoints de contratação, pagamento e avaliação.
- [x] Telas de login e cadastro em React/TypeScript integradas à API.
- [ ] Ampliar a integração do frontend com a API e desenvolver as demais telas.
- [ ] Interface Administrativa e Dashboard do Cliente (Next.js, conforme planejamento original).
- [ ] Configuração do ambiente com Docker.

---

**Desenvolvido para fins acadêmicos e profissionais.**

## 📄 Licença

Este projeto utiliza uma [licença proprietária de uso restrito ao grupo de PI](./LICENSE).
O código é público para consulta, mas sua reutilização não é livre: as permissões
de desenvolvimento e uso acadêmico são destinadas aos seis integrantes do grupo,
conforme os termos da licença. Permanecem preservados os direitos previstos nos
termos do GitHub, nas licenças de terceiros e nas versões anteriormente
disponibilizadas sob MIT.

*Mantido por @Vimtoooo, @jeflotz e @vieirat981-dev*

### Home e mensagens

A Home inclui perfis ilustrativos, conversas reais com profissionais cadastrados e a seção **Contrate novamente**, baseada em serviços concluídos. Aplique a nova migration no backend com `npm run db:migrate:deploy` após gerar o Prisma Client; veja o [guia de configuração e demonstração com duas contas](apps/frontend/docs/messages.md). Os testes de banco isolado podem ser executados com `npm run test:mensagens` em `apps/backend`.

### Solicitações de serviços

A seção **Minhas solicitações** permite criar e acompanhar pedidos, aceitar/recusar, concluir e cancelar conforme o papel da conta. Aplique as migrations com `npm run db:migrate:deploy` no backend. Consulte o [guia de execução e demonstração](apps/frontend/docs/requests.md).
