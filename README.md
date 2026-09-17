# HIVE

Projeto interdisciplinar para conectar prestadores de serviços e contratantes.
O backend usa **NestJS, TypeScript, Prisma e MySQL**; o frontend atual contém
páginas estáticas HTML/CSS e ainda não está integrado à API.

## O que funciona hoje

- Cadastro de prestador com seu primeiro serviço em uma única transação.
- Busca de serviços ativos com filtros e paginação, seguindo Controller → Service → Repositório → banco.
- Persistência das oito entidades de domínio, com testes automatizados usando MySQL real.

Autenticação e os endpoints de contratação, pagamento e avaliação são etapas
futuras. Os fluxos dessas entidades já possuem classes e testes de persistência.

## Por onde começar

| Objetivo | Documentação |
| --- | --- |
| Configurar e executar o backend | [README do backend](apps/backend/README.md) |
| Testar e apresentar ao professor | [README dos testes](apps/backend/test/README.md) |
| Entender schema, banco e Prisma | [README do Prisma](apps/backend/prisma/README.md) |
| Consultar rotas, campos e respostas | [Contrato da API](apps/backend/docs/CATALOGO-API.md) |

Arquivos de ambiente ficam somente na máquina de cada integrante. Após a
limpeza do histórico, consulte as [orientações para a equipe](apps/backend/docs/SEGURANCA-HISTORICO.md)
antes de sincronizar uma cópia antiga do repositório.

## Licença

O código é público para consulta e utiliza a [licença proprietária do grupo de PI](LICENSE).
São preservados os direitos previstos nos termos do GitHub, nas licenças de
terceiros e nas versões anteriormente disponibilizadas sob MIT.

*Mantido por @Vimtoooo e @jeflotz.*
