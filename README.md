# Login-Hive1
Está é a primeira versão da pagina de web pagina de login do HIVE

---

@Vimtoooo — 23/05/2026

## Mudanças e Atualizações:

* **Arquitetura Separada**: Divisão clara entre `apps/backend` (NestJS) e `apps/frontend` (Next.js).
* **Persistência de Dados**: Prisma configurado no backend para gestão de banco de dados MySQL.
* **Modelagem de Domínio**: Definição das classes de domínio (`Usuário`, `Prestador`, `Serviço`, `Contratação`, `Fatura`, `Financeiro`, `Indicação`, `Avaliação`) com encapsulamento (getters/setters) e lógica de negócio inicial.
* **Dados de Teste**: Implementação de um script `seed` para popular o banco de dados com dados de exemplo para testes.

## Estrutura de Pastas Sugerida:
```text
HIVE/
├── apps/
│   ├── backend/          # API NestJS, Prisma Models, Seeds
│   └── frontend/         # Interface Next.js (no futuro), Styles
└── README.md
```

## Roadmap de Desenvolvimento:

1.  **Setup de Ambiente (Concluído)**: Inicializar projetos Next.js (frontend) e NestJS (backend) ✅.
2.  **Modelagem de Dados (Concluído)**: Configuração do `schema.prisma` e implementação das classes de domínio para Prestadores, Clientes e Contratos para o banco de dados ✅.
3.  **Core Backend**: Implementar módulos de Autenticação (JWT) e o CRUD de serviços/contratações.
4.  **Integração Frontend**: Consumir a API do backend utilizando React Query ou SWR para gestão de estado.
5.  **Upload de Arquivos**: Configurar Cloudinary/S3 para fotos de perfil e portfólios.

### Resumo de Stacks (Pré-determinadas):

|     **Camada**     |        **Tecnologias**        |
| :----------------: | :---------------------------: |
|      Frontend      |  Next.js + React/TypeScript   |
|      Backend       |       Node.js + NestJS        |
|       Banco        |      MySQL OU/PostGreSQL      |
|        ORM         |            Prisma             |
|        Auth        |             JWT               |
|      Uploads       |         Cloudinary/S3         |