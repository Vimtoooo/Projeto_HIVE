# Fluxo de trabalho com IA

Este guia é compartilhado e versionado. `docs/` na raiz guarda planejamento pessoal e prompts locais; não é pré-requisito para usar o projeto.

## Delegação explícita

O agente principal coordena requisito, contratos, integração e fechamento. Delegue quando solicitado e quando as tarefas puderem avançar de forma independente. Um ajuste pequeno não exige uma equipe. Comece com até dois especialistas; respeite a capacidade real do ambiente.

| Papel | Entrega | Limite |
| --- | --- | --- |
| Frontend | Formulários, componentes, acessibilidade e testes visuais | `apps/frontend`, apenas arquivos atribuídos |
| Backend | Contratos, regras, autorização e persistência | `apps/backend`, apenas arquivos atribuídos |
| Revisor | Problemas comprovados com impacto e localização | Leitura, sem aplicar correções |

Antes de despachar, defina um responsável por arquivo. DTOs, schema Prisma, lockfiles e arquivos de configuração compartilhados têm um único responsável por vez. Se mudar o contrato, comunique ao coordenador antes de consumidores implementarem pressupostos incompatíveis.

### Contrato de uma tarefa delegada

```text
Objetivo e critério de aceite:
Contexto mínimo e contratos confirmados:
Arquivos permitidos para edição:
Arquivos apenas para consulta / fora do escopo:
Dependências de outros agentes:
Verificações necessárias:
Entrega: resumo, arquivos alterados, evidências e impedimentos.
Parada: devolver ao coordenador ao satisfazer o critério; sem commit/push
ou novas funcionalidades, salvo autorização explícita para essas ações.
```

Agentes na mesma pasta compartilham mudanças imediatamente. Não reverta edições de outro agente nem rode Git destrutivo para resolver conflitos. O coordenador integra e executa a verificação final; não presume que testes individuais comprovam a integração.

## Branches e worktrees

Para funcionalidades independentes com escrita paralela, prefira worktrees/branches separadas, quando autorizadas. Isso isola arquivos, não bancos, portas, credenciais ou serviços. Atribua portas e use bancos descartáveis; não finalize processos de outros trabalhos. Arquivos ignorados, como prompts em `docs/`, devem ser fornecidos explicitamente quando necessários.

Uma branch termina ao cumprir o requisito e o fechamento descritos no AGENTS.md. Um PR pendente não autoriza merge: registre a base da branch dependente. Ao integrar a base, confira novamente o diff antes de abrir o próximo PR.

## Exemplo: cadastro de prestador

Delegue a leitura do contrato existente no backend e a identificação dos componentes reutilizáveis no frontend. Consolide as descobertas, defina o contrato e só então implemente o formulário. Não invente campos ou valores para satisfazer validações. Após a implementação, faça revisão e fechamento proporcionais ao escopo.

## Procedimentos reutilizáveis

As skills do repositório ficam em `.agents/skills`: `hive-fechamento` prepara evidências e continuidade; `hive-validacao-interface` verifica fluxos visuais alterados. No Codex, peça `$hive-fechamento` ou `$hive-validacao-interface`; descrições específicas também permitem seleção automática. Elas não concedem autorização extra nem exigem agentes paralelos.

Para usar as mesmas instruções em outro cliente sem descoberta dessa pasta, forneça o SKILL.md explicitamente. Os CLAUDE.md compartilham regras via AGENTS.md; não significam que configurações específicas do Codex são carregadas por Claude.
