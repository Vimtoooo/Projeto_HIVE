# Orientações para agentes — HIVE

## Contexto e leitura

- Monorepositório acadêmico: `apps/frontend` usa Next.js, React, TypeScript e CSS Modules; `apps/backend` usa NestJS, Prisma e PostgreSQL.
- Antes de editar, confira a branch, `git status` e o diff relevante. Preserve alterações existentes, inclusive arquivos não rastreados.
- Leia também o `AGENTS.md` da aplicação afetada. As regras específicas complementam este arquivo.
- Use `README.md` para execução e arquitetura; os guias em `apps/frontend/docs` para requisitos de telas e `apps/backend/docs` para contratos e persistência. Leia apenas os documentos relacionados à tarefa.
- O objetivo vem do pedido atual e do plano aprovado, não apenas do nome da branch. Diferencie requisito, correção necessária e melhoria opcional.

## Autonomia e limites

- Para uma implementação autorizada, prossiga com inspeção, edição, execução local e testes pertinentes, corrigindo falhas causadas pela mudança.
- Em pedidos de explicação, diagnóstico ou revisão, apresente evidências; não implemente mudanças sem que o pedido inclua essa ação.
- Preserve contratos e decisões de produto. Dúvidas que mudam o escopo devem ser esclarecidas; escolhas rotineiras de implementação podem ser resolvidas e explicadas pelo agente.
- Não faça commit, push, merge, publicação, troca de branch ou operações destrutivas sem autorização correspondente. Não resete bancos nem descarte mudanças existentes.
- Use os testes de integração com bancos descartáveis documentados. Confira destino e migrations antes de modificar o banco local. Nunca registre credenciais, cookies de sessão ou conteúdo de arquivos de ambiente em documentação ou logs compartilhados.
- Não inicie agentes paralelos por padrão. Se o usuário autorizar, distribua escopos sem edições concorrentes nos mesmos arquivos.

## Conclusão e parada da branch

1. Identifique o requisito principal, os critérios de aceite e os limites da entrega antes de implementar. Se já estiverem documentados, reutilize-os.
2. Quando o requisito principal estiver implementado, interrompa a adição de funcionalidades. Faça somente o fechamento pertinente: revisão do diff, testes, avaliação de interface quando aplicável, correções de regressões da entrega e atualização da documentação.
3. Execute verificações proporcionais às alterações. Depois que passarem, repita somente se novas mudanças, falhas ou dúvidas concretas justificarem. Não transforme o fechamento em refatoração ou auditoria sem limite.
4. Declare a situação com precisão: concluída e validada; implementada com verificação pendente; ou bloqueada. Não declare conclusão se algum critério obrigatório estiver pendente. Se bloqueado, registre a evidência e o que falta para continuar.
5. Prepare o prompt de continuidade descrito abaixo e encerre o trabalho na branch. Não comece a próxima tarefa, não crie outra conversa/branch e não arquive a conversa automaticamente.
6. Melhorias descobertas ficam como sugestões para outra entrega. Só retome implementação após conclusão se o usuário pedir uma correção ou autorizar explicitamente novo escopo; recomende uma branch separada para outra funcionalidade.

## Prompt de continuidade

Ao encerrar uma entrega, crie ou atualize `docs/proximo-prompt-<tarefa>.md` e apresente o caminho ao usuário. A pasta `docs` da raiz é local e está ignorada pelo Git; não force sua inclusão. Não confunda essa pasta com os guias versionados em `apps/*/docs`.

O prompt deve permitir que outro modelo planeje e trabalhe sem consultar a conversa anterior. Inclua somente informações úteis:

- Objetivo da próxima tarefa confirmado pelo usuário. Se não houver, identifique a proposta como sugestão e peça ao próximo agente que aguarde a definição antes de implementar.
- Localização do repositório, branch de origem, estado do Git e alterações não commitadas a preservar. Confirme o estado no fechamento; não reutilize um resumo antigo como se fosse atual.
- O que foi entregue, decisões relevantes, limites e pendências reais. Separe critérios obrigatórios de melhorias opcionais.
- Arquivos de entrada, contratos e documentação essenciais, usando caminhos relativos ao repositório quando possível.
- Critérios de aceite da próxima tarefa e ações autorizadas. O prompt não amplia permissões concedidas pelo usuário.
- Comandos de execução e verificação; testes executados e seus resultados, com data e limitações (por exemplo, API simulada versus PostgreSQL real).
- Migrations aplicadas, ambiente usado e processos/portas iniciados pelo agente. Estado de execução é transitório: peça conferência antes de reutilizar ou encerrar processos.
- Primeiros passos: reler os AGENTS.md aplicáveis, conferir branch/diff e elaborar um plano proporcional à tarefa.
- Condição explícita de parada: concluir os critérios, verificar, documentar, preparar a próxima passagem e parar.

Crie documentos auxiliares apenas quando decisões ou procedimentos não couberem claramente no prompt. Referencie-os no prompt; não copie todo o histórico nem informações sensíveis. Documentação necessária para outros integrantes deve ficar em local versionado, sem depender desses arquivos locais.

## Manutenção destas instruções

- `AGENTS.md` é a fonte das regras compartilhadas; os `CLAUDE.md` correspondentes apenas referenciam os arquivos aplicáveis.
- Mantenha regras estáveis aqui e estado temporário no prompt de continuidade. Não acrescente instruções redundantes a cada tarefa.
- Estas instruções orientam o agente; não substituem permissões, sandbox e aprovações do ambiente.
