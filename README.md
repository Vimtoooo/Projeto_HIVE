# HIVE - Sistema para Registro de Serviços e Prestadores Autônomos

<p align="center">
  <img src="https://nestjs.com/img/logo-small.svg" width="100" alt="Nest Logo" />
  <img src="https://raw.githubusercontent.com/devicons/devicon/7330accdbc47e2dc0c19789a48533c4a3c50fe58/icons/prisma/prisma-original.svg" width="100" alt="Prisma Logo" />
</p>

O **HIVE** é uma plataforma robusta de intermediação de serviços, desenvolvida com foco em escalabilidade, integridade de dados e princípios avançados de Orientação a Objetos. O projeto visa conectar prestadores de serviço e contratantes através de um ecossistema seguro e auditável.

---

## 🚀 Destaques da Arquitetura

A arquitetura organiza as regras em **classes de domínio** e o fluxo da API em Controller → Service → Repositório → Prisma/MySQL. As classes ainda utilizam tipos e enums do Prisma.

*   **Encapsulamento Rigoroso**: Atributos privados protegidos por lógica de validação em *setters*.
*   **Princípio Fail-Fast**: DTOs e classes validam campos antes da persistência. CPF e CNPJ são verificados por formato e comprimento, sem cálculo de dígitos verificadores.
*   **Modelagem de Herança**: Implementação de especialização de classes onde `Prestador` estende `Usuario`, compartilhando atributos base e estendendo funcionalidades específicas.
*   **Persistência com Prisma**: Mapeamento objeto-relacional (ORM) otimizado para MySQL, garantindo consistência entre as classes TypeScript e o schema do banco.
*   **Regras de Domínio**: Classes modelam faturamento, indicação e financeiro; esses fluxos ainda não possuem endpoints na API.

## Integração atual

O backend já oferece cadastro de prestador com seu primeiro serviço em uma transação e busca de serviços ativos com filtros e paginação, via API REST em NestJS e persistência Prisma/MySQL. Há testes automatizados com banco de testes e 90 requisições HTTP para demonstração. O frontend ainda não está integrado à API; autenticação, contratação, pagamento e avaliação pela API continuam no roadmap.

Consulte os guias do [backend](apps/backend/README.md), [testes](apps/backend/test/README.md), [Prisma](apps/backend/prisma/README.md) e [requisições HTTP](apps/backend/http/README.md) para configuração, execução e limpeza dos dados fictícios.

## 🛠️ Stack Tecnológica

| Camada | Tecnologias |
| :--- | :--- |
| **Frontend** | HTML5 + CSS3; tela estática de entrada, sem framework JavaScript |
| **Backend** | Node.js + NestJS (TypeScript) |
| **Persistência** | MySQL + Prisma ORM |
| **Testes** | Jest, integração com MySQL e exemplos HTTP |
| **Qualidade de código** | TypeScript, ESLint e Prettier |

## 📂 Estrutura do Projeto

Principais diretórios e arquivos (dependências e saídas de compilação omitidas):

```text
HIVE/
├── apps/                          # Aplicações do projeto
│   ├── backend/                   # API NestJS e persistência
│   │   ├── docs/                  # Contratos e explicações técnicas
│   │   ├── http/                  # 90 requisições para o REST Client
│   │   ├── prisma/                # Schema, migrations e seed
│   │   ├── scripts/               # Preparação e limpeza do banco de testes
│   │   ├── src/                   # Código-fonte do backend
│   │   │   ├── catalog/           # Cadastro de prestador e busca de serviços
│   │   │   ├── enums/             # Enumerações auxiliares do domínio
│   │   │   ├── models/            # Classes de domínio
│   │   │   ├── persistence/       # Cliente Prisma e repositório de domínio
│   │   │   └── main.ts            # Inicialização da API
│   │   ├── test/                  # Integração, E2E e demonstrações
│   │   │   └── support/           # Limpeza seletiva de dados fictícios
│   │   └── README.md              # Configuração e execução do backend
│   └── frontend/                  # Interface estática, ainda sem acesso à API
│       ├── imagens/               # Logotipos e imagens
│       ├── pages/                 # Página de entrada Hive.html
│       └── styles/                # Estilos CSS da interface
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
```bash
npm run prisma:generate
npm run test:db:prepare
```

### 5. Executar Demonstração da API
Para testar cadastro e busca com os exemplos HTTP, mantenha a API ligada:
```bash
npm run start:demo
```

Para visualizar o frontend, abra [Hive.html](apps/frontend/pages/Hive.html) no navegador. A tela é apenas visual: login e cadastro ainda não enviam requisições à API.

## 📈 Roadmap

- [x] Modelagem de Domínio e Validações de Integridade.
- [x] Integração com Prisma ORM e MySQL.
- [ ] Implementação de Autenticação JWT e RBAC (Role-Based Access Control).
- [x] Endpoints REST de cadastro de prestador e busca de serviços no NestJS.
- [ ] Endpoints de contratação, pagamento e avaliação.
- [x] Tela estática de entrada em HTML/CSS.
- [ ] Integração do frontend com a API e desenvolvimento das demais telas.

---

**Desenvolvido para fins acadêmicos e profissionais.**

## 📄 Licença

Este projeto utiliza uma [licença proprietária de uso restrito ao grupo de PI](./LICENSE).
O código é público para consulta, mas sua reutilização não é livre: as permissões
de desenvolvimento e uso acadêmico são destinadas aos seis integrantes do grupo,
conforme os termos da licença. Permanecem preservados os direitos previstos nos
termos do GitHub, nas licenças de terceiros e nas versões anteriormente
disponibilizadas sob MIT.

*Mantido por @Vimtoooo e @jeflotz*
