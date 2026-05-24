# HIVE - Service Ecosystem

<p align="center">
  <img src="https://nestjs.com/img/logo-small.svg" width="100" alt="Nest Logo" />
  <img src="https://raw.githubusercontent.com/prisma/prisma/main/packages/sdk/src/images/prisma_logo.svg" width="100" alt="Prisma Logo" />
</p>

O **HIVE** é uma plataforma robusta de intermediação de serviços, desenvolvida com foco em escalabilidade, integridade de dados e princípios avançados de Orientação a Objetos. O projeto visa conectar prestadores de serviço e contratantes através de um ecossistema seguro e auditável.

---

## 🚀 Destaques da Arquitetura

O desenvolvimento atual foca na **Camada de Domínio**, utilizando padrões de **Domain-Driven Design (DDD)** para garantir que as regras de negócio sejam independentes de infraestrutura.

*   **Encapsulamento Rigoroso**: Atributos privados protegidos por lógica de validação em *setters*.
*   **Princípio Fail-Fast**: O sistema valida a integridade dos dados (CPF, CNPJ, e-mail, formatos de string) no momento da instancialização, impedindo que estados inválidos persistam no banco de dados.
*   **Modelagem de Herança**: Implementação de especialização de classes onde `Prestador` estende `Usuario`, compartilhando atributos base e estendendo funcionalidades específicas.
*   **Persistência com Prisma**: Mapeamento objeto-relacional (ORM) otimizado para MySQL, garantindo consistência entre as classes TypeScript e o schema do banco.
*   **Lógica de Negócio Injetada**: Cálculos automatizados de faturamento, descontos por indicação e fluxos de caixa integrados.

## 🛠️ Stack Tecnológica

| Camada | Tecnologias |
| :--- | :--- |
| **Backend** | Node.js + NestJS (TypeScript) |
| **Persistência** | MySQL + Prisma ORM |
| **Testes** | Script de Demonstração de Domínio (Manual Test) |
| **Ambiente** | Docker Ready (Configuração futura) |

## 📂 Estrutura do Projeto

```text
HIVE/
├── apps/
│   ├── backend/
│   │   ├── prisma/             # Schema, Migrations e Seeds
│   │   ├── src/
│   │   │   ├── models/         # Classes de Domínio (Core Logic)
│   │   │   ├── enums/          # Definições de tipos constantes
│   │   └── test/               # Scripts de validação e demonstração
│   └── frontend/               # Interface em Next.js (em desenvolvimento)
└── README.md
```

## 📋 Entidades de Domínio

Abaixo, as principais entidades que compõem a lógica do HIVE:

1.  **Usuario/Prestador**: Gestão de perfis com validações estritas de documentos (CPF/CNPJ).
2.  **Servico**: Catálogo de ofertas vinculadas a prestadores com controle de status (Ativo/Inativo).
3.  **Contratacao**: Orquestração do fluxo de serviço, incluindo cálculo de valores e aplicação de regras de indicação.
4.  **Indicacao**: Sistema de *referral* que permite rastrear a origem de novos usuários e aplicar benefícios financeiros.
5.  **Fatura/Financeiro**: Gestão de contas a receber e lançamentos contábeis automáticos após conclusões de serviço.

## ⚙️ Instalação e Execução

Para reproduzir o ambiente de desenvolvimento e executar a demonstração das classes:

### 1. Clonar o Repositório
```bash
git clone https://github.com/seu-usuario/HIVE.git
cd HIVE/apps/backend
```

### 2. Instalar Dependências
```bash
npm install
```

### 3. Configurar Ambiente
Crie um arquivo `.env` baseado no `.env.example` e configure sua `DATABASE_URL` (MySQL).

### 4. Preparar o Banco de Dados
```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

### 5. Executar Demonstração de Domínio
Para visualizar as validações e o fluxo de classes em ação (essencial para apresentações):
```bash
npx ts-node test/manual-test.ts
```

## 📈 Roadmap

- [x] Modelagem de Domínio e Validações de Integridade.
- [x] Integração com Prisma ORM e MySQL.
- [ ] Implementação de Autenticação JWT e RBAC (Role-Based Access Control).
- [ ] Desenvolvimento de Endpoints REST no NestJS.
- [ ] Interface Administrativa e Dashboard do Cliente (Next.js).

---

**Desenvolvido para fins acadêmicos e profissionais.**
*Mantido por @Vimtoooo e @jeflotz*