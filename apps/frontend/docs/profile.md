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

## Ativar atuação profissional

Contas sem perfil profissional veem **Quero ser profissional**, que abre `/perfil/prestador` dentro do shell atual. A presença do perfil vem de `possuiPerfilProfissional`, revalidada no servidor no foco/visibilidade e ao trocar de conta. A ativação solicita CNPJ obrigatório, área, experiência, certificações opcionais e primeiro serviço; não altera os campos pessoais pelo PATCH de perfil. Após confirmação, Meu perfil mostra a capacidade de contratar e prestar sem novo login. Veja [contrato de conta única](../../backend/docs/CONTA-UNICA.md).


## Apresentação e links

A ação **Quero ser profissional** fica no rodapé do cartão de resumo, acompanhada de ícone e explicação sobre usar a mesma conta. No desktop, os cartões se alinham pelo topo e cada um tem altura natural conforme seu conteúdo, sem esticar o formulário até a altura do resumo. Em telas estreitas, ficam empilhados. Os espaçamentos internos permanecem preservados. O foco permanece visível e o link funciona pelo teclado.

`src/app/global-styles.css` define `--link-color`, `--link-hover-color`, `--link-weight`, `--link-decoration-thickness`, `--link-underline-offset`, `--link-focus-color`, `--link-focus-width`, `--link-focus-offset` e `--link-transition`. Use `className="hive-link"` em links textuais para aplicar sublinhado, hover e foco consistentes (exemplo: `<Link className="hive-link" href="/perfil">Meu perfil</Link>`). O reset do shell preserva essa classe. Elementos de navegação e botões mantêm seus tratamentos próprios; movimento reduzido desliga a transição.

Os sete campos de `/perfil/prestador` recebem entrada suave em sequência por seção, com a mesma duração de 550 ms usada na autenticação. `prefers-reduced-motion: reduce` desliga as animações. A animação não se repete durante a edição.
