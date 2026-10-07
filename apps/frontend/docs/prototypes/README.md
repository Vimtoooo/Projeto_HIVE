# Protótipos de mensagens

Abra os arquivos HTML diretamente no navegador. Usam somente CSS/JS locais e dados fictícios; não acessam a API.

- **[Proposta 1 — Conversas em foco](mensagens-duas-colunas.html):** navegação HIVE + lista e chat. Maximiza o espaço de leitura.
- **[Proposta 2 — Conversas com contexto](mensagens-tres-colunas.html):** mantém lista e chat e acrescenta detalhes à direita, alinhados aos protótipos de Notificações e Minhas solicitações. É a base escolhida para implementação; o painel lateral recolhe em larguras menores.

Nos dois, é possível pesquisar contatos, selecionar conversa e acrescentar uma mensagem local. O conteúdo inicial é apenas uma amostra visual compartilhada entre contatos. A implementação usa a API real, com histórico distinto e sessão autenticada.

Critérios: navegação persistente, amarelo para ação/seleção, painéis claros com bordas discretas, campo de envio acessível e adaptação para celular (na aplicação, lista e chat alternam por seleção). Os protótipos não são novas telas públicas da aplicação.
