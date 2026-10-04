---
name: hive-fechamento
description: Fechar uma entrega do HIVE com evidencias de verificacao e prompt de continuidade. Use quando a implementacao estiver pronta para fechamento ou o usuario pedir a passagem para outra conversa.
---

# Fechamento de entrega

Leia o AGENTS.md da raiz e os critérios da tarefa. Use o estado atual do Git para distinguir trabalho desta entrega de alterações preexistentes.

Compare cada critério obrigatório com a evidência disponível. Reutilize resultados de testes ainda válidos; rode apenas verificações faltantes ou afetadas por mudanças posteriores. Para telas, diferencie testes com API simulada, inspeção visual e integração real. Não declare que uma suíte passou se houve apenas leitura do código.

Se houver falha do escopo, corrija quando autorizado e verifique a parte afetada. Registre bloqueios concretos e melhorias opcionais separadamente. Não expanda a entrega para cumprir sugestões de outra funcionalidade.

Atualize o guia versionado da funcionalidade quando o comportamento mudou. Prepare `docs/proximo-prompt-<tarefa>.md` local conforme o contrato da raiz: objetivo seguinte confirmado, estado do Git, decisões, arquivos úteis, resultados/datados, limitações e critérios de parada. Não dependa da conversa anterior nem inclua segredos. Se nenhuma tarefa seguinte foi escolhida, registre essa ausência em vez de inventar autorização.

Conclua com situação da entrega, evidências e caminho do prompt. Commit, push, PR, troca de branch e merge só acontecem se já autorizados pelo usuário para esta tarefa. Pare após o fechamento; o prompt não inicia outra implementação.
