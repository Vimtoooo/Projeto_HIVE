# Meu perfil

A página `/perfil` mantém a navegação do HIVE e mostra resumo da conta e formulário, empilhados no celular. O item da barra lateral e o botão da conta no cabeçalho abrem a mesma página.

## Usar e demonstrar

1. Execute backend e frontend conforme os README e entre com uma conta ativa.
2. Abra **Meu perfil**. E-mail, CPF mascarado, tipo de conta e data de cadastro são somente para consulta.
3. Edite nome, telefone com DDD ou endereço e clique em **Salvar alterações**. A confirmação aparece após a resposta da API.
4. Recarregue e volte à Home: os dados persistem e o novo nome aparece na saudação e no cabeçalho.
5. Altere um campo e use **Cancelar edição** para restaurar os dados carregados, sem gravar no banco.

Falhas de gravação preservam o formulário para nova tentativa. Sessão expirada limpa os dados privados da tela e oferece login. Não há edição de senha, e-mail, CPF, foto, tipo de conta ou dados profissionais. Não é necessária migration.

## Contrato e validação

`GET /perfil` retorna idUsuario, nome, email, telefone, endereco, tipoUsuario, dataCadastro e cpfMascarado. O CPF completo e o hash da senha nunca fazem parte da resposta.

`PATCH /perfil` aceita apenas nome, telefone e endereco, inclusive atualização parcial. Exige sessão e `X-Hive-Request: 1`; o destinatário vem da sessão, sem ID no formulário. Nome: 3–191 caracteres; telefone: 10–11 dígitos; endereço: 5–191 caracteres. Nome/endereço são aparados; a interface remove formatação do telefone antes do envio. Corpo vazio, null e campos extras são rejeitados.

## Testes

No backend, configure TEST_DATABASE_URL local terminada em `_test` e permissão CREATEDB:

```powershell
$env:DOTENV_CONFIG_PATH = '.env/.env.test.local'
npm run test:perfil
```

O executor cria `hive_profile_<uuid>_test`, aplica migrations e remove somente o banco criado. Não altera os dados de `hive`. Ao voltar à aplicação, restaure `$env:DOTENV_CONFIG_PATH = '.env/.env'`.

No frontend: `npm run test:e2e -- ProfileSpec`. A API é simulada; cobre edição, cancelamento, retry, sessão expirada, saudação, teclado e celular. Capturas ficam em `test-results/profile-*.png`, ignoradas pelo Git.
