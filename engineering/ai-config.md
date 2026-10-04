# Configuração de agentes

`.codex/config.toml` habilita a capacidade de delegação com até dois subagentes simultâneos, além do principal. Isso não dispensa o pedido explícito definido em AGENTS.md. Os perfis em `.codex/agents` são `hive-frontend`, `hive-backend` e `hive-reviewer`; modelos e esforço são herdados, sem exigir um plano/modelo específico.

Peça, por exemplo: “Delegue ao hive-backend a análise do contrato de cadastro e ao hive-frontend a análise do formulário existente, ambos sem editar. Consolide um plano antes da implementação”. Na implementação, atribua arquivos e critérios conforme `ai-workflow.md`. Para revisão, informe a base exata: use a branch anterior quando houver PRs encadeados, não main indiscriminadamente.

O revisor declara sandbox somente leitura e não deve executar testes que escrevam artefatos. Configurações do cliente e overrides da sessão podem prevalecer: instruções não são uma barreira de segurança. Os demais perfis herdam permissões; nenhum arquivo desabilita aprovações, amplia rede ou configura segredos/MCP.

Os arquivos seguem a [documentação oficial de subagentes](https://learn.chatgpt.com/docs/agent-configuration/subagents) consultada em 04/10/2026. O suporte depende da versão/cliente e da confiança concedida ao projeto; reabra a sessão depois de instalar/alterar configurações. AGENTS.md continua sendo o contrato compartilhado. CLAUDE.md importa esse contrato, mas não carrega os perfis TOML do Codex.

## Validação reproduzível

Requer Python 3.11+. Use um ambiente virtual local, sem instalar dependências no Python global. No PowerShell, a partir da raiz:

```powershell
python -m venv docs/.venv-validation
docs/.venv-validation/Scripts/python.exe -m pip install -r engineering/requirements-validation.txt
docs/.venv-validation/Scripts/python.exe engineering/validate_ai_config.py
docs/.venv-validation/Scripts/python.exe -B -m unittest discover -s engineering -p test_ai_config.py
```

O validador verifica sintaxe TOML/YAML, campos dos perfis/skills, imports CLAUDE, existência dos guias, política mínima de configuração e exclusão da pasta docs raiz. Seus testes verificam rejeição de metadados inválidos e expansão de sandbox. A política é intencionalmente restrita: novas configurações exigem atualizar a validação após revisão.

Isso não comprova comportamento de modelos nem descoberta dos perfis por todos os clientes. Complemente com revisão humana de contexto, conflitos e limites. A CI executa essas verificações sem credenciais de IA nem chamadas a modelos.
