# Funções da barra lateral

Branch: `feat/funcoes-barra-lateral` (renomeada de `feat/mensagens-notificacoes`, preservando commits).

Cada seção será implementada, testada e registrada em um commit antes de iniciar a próxima. As seções usam a navegação compartilhada e atualizam o painel principal, sem modal de conteúdo. A adaptação móvel pode alternar lista e detalhes.

| Seção | Situação |
| --- | --- |
| Início e mensagens | Implementadas anteriormente |
| Minhas solicitações | Fluxo completo entregue nesta etapa; ver [guia](requests.md) |
| Notificações | Entregue: avisos persistentes de mensagens/pedidos, filtros e leitura; ver [guia](notifications.md) |
| Meu perfil | Entregue: consulta e edição de nome, telefone e endereço; ver [guia](profile.md) |
| Central de ajuda | Entregue: pesquisa, categorias e artigos públicos; ver [guia](help.md) |
| Profissionais | Entregue: catálogo público real, busca, paginação e detalhes; ver [guia](professionals.md) |
| Favoritos | Pendente: persistência por conta; exemplos locais continuam na Home |

Solicitações e Notificações foram concluídas. O [plano de notificações](notifications-plan.md) preserva as decisões da entrega. Meu perfil foi entregue em uma etapa própria. Central de Ajuda foi entregue. Profissionais foi entregue. Favoritos é a próxima etapa da sequência abaixo, cada um com testes, documentação, commit e pausa.

## Sequência aprovada

1. **Meu perfil (entregue):** `/perfil`, GET/PATCH autenticados, CPF mascarado, edição exclusiva de nome, telefone e endereço. Senha, e-mail, documentos, foto e perfil profissional ficam fora.
2. **Central de Ajuda (entregue):** `/ajuda`, conteúdo local tipado, categorias, artigos expansíveis e busca sem distinção de acentos/maiúsculas. Guias sobre funções existentes com atalhos, sem chamados ou atendimento fictício.
3. **Profissionais (entregue):** `/profissionais`, GET `/profissionais` e `/profissionais/:id`, catálogo real paginado por prestador; busca em nome, área e serviços ativos. Detalhes públicos, conversa e solicitação com serviço selecionado. Manter exemplos da Home separados; preservar o POST `/prestadores` existente.
4. **Favoritos:** `/favoritos`, modelo com unicidade usuário/prestador e migration aditiva. GET/PUT/DELETE autenticados, persistência entre sessões, integração com cards reais e tratamento de indisponibilidade. Não importar favoritos fictícios locais.

Todas as seções mantêm cabeçalho, navegação e painéis, sem modal de conteúdo. Testar desktop/celular, teclado, erros, sessão e isolamento. Integrações usam bancos descartáveis; migrations são validadas antes do banco local, sem reset. Sem push automático.

**Cadastro de prestador:** responsabilidade de outro integrante; sem planejamento ou alterações nesta sequência. Pagamentos, avaliações, geolocalização e upload também estão fora destas entregas.
