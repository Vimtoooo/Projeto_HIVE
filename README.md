# HIVE - Sistema para Registro de Serviços e Prestadores Autônomos

<p align="center">
  <img src="https://nestjs.com/img/logo-small.svg" width="100" alt="Nest Logo" />
  <img src="https://raw.githubusercontent.com/devicons/devicon/7330accdbc47e2dc0c19789a48533c4a3c50fe58/icons/prisma/prisma-original.svg" width="100" alt="Prisma Logo" />
</p>

O **HIVE** é uma plataforma robusta de intermediação de serviços, desenvolvida com foco em escalabilidade, integridade de dados e princípios avançados de Orientação a Objetos. O projeto visa conectar prestadores de serviço e contratantes através de um ecossistema seguro e auditável.

---

## 🚀 Destaques da Arquitetura

A arquitetura parte da **Camada de Domínio**, utilizando padrões de **Domain-Driven Design (DDD)** para garantir que as regras de negócio sejam independentes de infraestrutura.

*   **Encapsulamento Rigoroso**: Atributos privados protegidos por lógica de validação em *setters*.
*   **Princípio Fail-Fast**: O sistema valida a integridade dos dados (CPF, CNPJ, e-mail, formatos de string) no momento da instancialização, impedindo que estados inválidos persistam no banco de dados.
*   **Modelagem de Herança**: Implementação de especialização de classes onde `Prestador` estende `Usuario`, compartilhando atributos base e estendendo funcionalidades específicas.
*   **Persistência com Prisma**: Mapeamento objeto-relacional (ORM) otimizado para MySQL, garantindo consistência entre as classes TypeScript e o schema do banco.
*   **Lógica de Negócio Injetada**: Cálculos automatizados de faturamento, descontos por indicação e fluxos de caixa integrados.

## Integração atual

O backend já oferece cadastro de prestador com seu primeiro serviço em uma transação e busca de serviços ativos com filtros e paginação, via API REST em NestJS e persistência Prisma/MySQL. Há testes automatizados com banco de testes e 90 requisições HTTP para demonstração. O frontend ainda não está integrado à API; autenticação, contratação, pagamento e avaliação pela API continuam no roadmap.

Consulte os guias do [backend](apps/backend/README.md), [testes](apps/backend/test/README.md), [Prisma](apps/backend/prisma/README.md) e [requisições HTTP](apps/backend/http/README.md) para configuração, execução e limpeza dos dados fictícios.

## 🛠️ Stack Tecnológica

| Camada | Tecnologias |
| :--- | :--- |
| **Backend** | Node.js + NestJS (TypeScript) |
| **Persistência** | MySQL + Prisma ORM |
| **Testes** | Jest, integração com MySQL e exemplos HTTP |
| **Ambiente** | Docker Ready (Configuração futura) |

## 📂 Estrutura do Projeto

```text
HIVE/
├── apps/
│   ├── backend/
│   │   ├── prisma/             # Schema e configuração do Prisma
│   │   ├── src/
│   │   │   ├── models/         # Classes de Domínio (Core Logic)
│   │   │   ├── enums/          # Definições de tipos constantes
│   │   └── test/               # Scripts de validação e demonstração
│   └── frontend/               # Páginas HTML/CSS (ainda sem integração à API)
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

## 📈 Roadmap

- [x] Modelagem de Domínio e Validações de Integridade.
- [x] Integração com Prisma ORM e MySQL.
- [ ] Implementação de Autenticação JWT e RBAC (Role-Based Access Control).
- [x] Endpoints REST de cadastro de prestador e busca de serviços no NestJS.
- [ ] Endpoints de contratação, pagamento e avaliação.
- [ ] Interface Administrativa e Dashboard do Cliente (Next.js).

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
