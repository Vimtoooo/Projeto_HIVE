# Plano: cadastro e busca de serviços

> Atualização PostgreSQL: este documento preserva o planejamento e os exemplos da implementação MySQL original. O provider e o adaptador atuais são PostgreSQL; para comandos de conexão, testes, seed e consultas compatíveis, use os [guias do Prisma](../prisma/README.md) e de [testes](../test/README.md). A transferência de dados e um novo histórico de migrations permanecem pendentes.


Escopo confirmado: cadastro de prestador com seu primeiro serviço e busca de
serviços. Contratação, pagamento, avaliação, autenticação e telas ficam para
etapas seguintes.

1. Auditar o histórico publicado, remover arquivos de ambiente do Git e manter
   as configurações locais. Restaurar a proteção da main após a limpeza.
2. Reproduzir o ESLint dos models e corrigir formatação e problemas reais de
   tipos, mantendo as verificações habilitadas.
3. Escrever testes HTTP de integração antes dos endpoints: cadastro atômico,
   busca com filtros/paginação, validação, duplicidade e proteção dos dados.
4. Implementar Controller → Service → Repositório → Prisma → MySQL, conforme
   o diagrama de sequência. Reutilizar Prestador, Servico e PersistenciaService.
5. Validar os dados recebidos em tempo de execução; retornar somente a projeção
   pública dos serviços e prestadores. IDs são sempre gerados pelo banco.
6. Executar lint, TypeScript, testes existentes e novos. Documentar comandos
   reproduzíveis de demonstração, consulta no MySQL e limpeza seletiva.

## Contrato previsto

- `POST /prestadores`: cria um novo prestador e seu serviço inicial juntos;
  devolve os dados públicos do serviço com HTTP 201. Não associa serviços a uma
  conta existente sem autenticação.
- `GET /servicos`: busca pública de serviços ativos de contas ativas, com
  `texto`, `areaAtuacao`, `precoMin`, `precoMax`, `prestadorId`, `pagina` e `limite`.
- Entradas inválidas: 400; cadastro duplicado: 409; falha de acesso ao banco: 503.
- Nesta etapa acadêmica, novos cadastros ficam ativos. Aprovação de prestadores,
  autenticação e limitação de requisições devem preceder exposição em produção.

## Portabilidade

Consultas usam filtros do Prisma, sem SQL MySQL nos endpoints. O adaptador fica
na fábrica existente. A futura troca de banco ainda exige trocar provider,
adaptador e migrações, revisar tipos nativos e regras de collation da busca.
