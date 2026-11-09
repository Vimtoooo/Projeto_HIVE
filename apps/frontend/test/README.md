# Testes do frontend

Execute os comandos em apps/frontend com Node.js 22.18+ (validado em Node 24).

```powershell
npm ci
npm test
npm run lint
npm run typecheck
npm run build
```

FrontendTest.ts usa node:test para máscaras, normalização, campos inválidos,
contratos e falhas HTTP. Não depende de banco ou backend. Os arquivos TypeScript
são executados com remoção nativa de tipos; a análise estática é um comando separado.

## Testes de navegador

### Cadastro de prestador

`RegistrationPolishSpec.ts` verifica erros por campo nos dois cadastros, placeholders, foco e correção, medidas compartilhadas com o login, breakpoint em 768/769 px, convite condicionado à sessão e cards reais com paginação recuperável. Execute junto de `ProviderRegistrationSpec`, `AuthenticationSpec`, `HomeSpec`, `MessagingSpec` e `FavoritesSpec`. Capturas: `test-results/polish-provider-{320,390,768,769,860,1440}.png` e `polish-real-cards.png`. As respostas HTTP são simuladas. No backend, a suíte de profissionais também verifica a rejeição de nomes inválidos pelos dois endpoints e a aceitação de nomes acentuados/compostos.

`ProviderRegistrationTest.ts` cobre normalização, máscara de CNPJ, limites, conversão monetária e validação da resposta pública. `ProviderRegistrationSpec.ts` cobre acesso por login/cadastro, payload, confirmação de senha, envio único, erros 400/409/503/rede/resposta malformada, preservação de campos, nova tentativa, teclado e larguras 1440/390/320.

Execute `npm run test:e2e -- ProviderRegistrationSpec AuthenticationSpec` com o navegador configurado abaixo. As capturas ficam em `test-results/provider-registration-1440.png`, `provider-registration-390.png` e `provider-registration-320.png`. A API é simulada nesses testes. No backend, `npm run test:profissionais` inclui cadastro via HTTP, presença no catálogo, preço persistido, login e duplicidade, em banco PostgreSQL descartável. Falha de preparação do banco deixa essa verificação pendente.

### Configuração do navegador

Na primeira utilização, instale o navegador do Playwright:

```powershell
npx playwright install chromium
npm run test:e2e
```

Alternativamente, no Windows com Edge já instalado:

```powershell
$env:PLAYWRIGHT_CHANNEL = 'msedge'
npm run test:e2e
```

PlaywrightConfig.ts inicia e encerra Next.js na porta 3101. Deixe essa porta
livre e encerre outros processos Next.js desta mesma pasta para evitar disputa
pelo cache .next. AuthenticationSpec.ts verifica redirecionamentos, imagens,
login por Enter, 401, JSON malformado, falha de rede, máscaras, confirmação de
senha, corpo do cadastro e erros do NestJS.

As requisições /api são interceptadas com dados fictícios. Nenhum usuário é
criado no banco. Essa suíte verifica o frontend; para integração real, inicie
backend e PostgreSQL e use o roteiro manual do README principal do frontend.

## Testes da Home

HomeTest.ts verifica busca, ordenação, nomes e leitura defensiva de preferências.
HomeSpec.ts cobre saudação, filtros, favoritos persistentes na aba, detalhes,
retorno de foco, recursos futuros, saída, menu móvel e largura de 320/390 pixels.
AuthenticationSpec.ts também confere o nome retornado pelo login após recarregar.
As capturas desktop e móvel são geradas em test-results (ignorado pelo Git).
Todos os perfis são fictícios e os testes não criam registros no banco.

## Mensagens e histórico integrado

MessagingSpec.ts cobre cards de histórico, abertura de conversa, envio, rascunho preservado em falha, repetição com a mesma chave, recarregamento, sessão expirada e layout móvel. ApiFixture.ts isola os testes antigos do backend real. As novas capturas ficam em test-results/messages-desktop.png e messages-mobile.png.

Para a camada de banco real, execute `npm run test:mensagens` em apps/backend. Para conferir as duas contas na interface, siga [docs/messages.md](../docs/messages.md).

A página de mensagens também é testada por URL direta e após recarregar, busca de contato, navegação Voltar, lista vazia, conversa indisponível, paginação e isolamento do histórico ao trocar contato. No celular, o teste alterna lista/chat e verifica o botão de envio no viewport. As capturas desktop e móvel registram a página completa, sem o antigo modal.

## Solicitações

`RequestsSpec.ts` cobre lista/detalhes sem modal, filtro, recarregamento, abertura de conversa, criação com repetição segura após erro, aceite/conclusão, cancelamento, sessão expirada e celular. Execute `npm run test:e2e -- RequestsSpec`. As respostas HTTP são simuladas. O teste real do backend é `npm run test:solicitacoes`; veja o [guia do fluxo](../docs/requests.md).

## Notificações

`npm run test:e2e -- NotificationsSpec` verifica a seção sem modal, contadores, filtros combinados, leitura persistente, leitura em lote limitada, erro com retry, origem removida, troca de conta, sessão expirada e navegação por teclado. Capturas desktop e celular ficam em `test-results/notifications-*.png` (ignoradas pelo Git). A API é simulada; a suíte HTTP/Prisma/PostgreSQL real roda no backend com `npm run test:notificacoes`. Veja [preparação e demonstração](../docs/notifications.md).

## Perfil

`npm run test:e2e -- ProfileSpec` testa navegação, campos permitidos, CPF mascarado, edição, persistência simulada, atualização da saudação, cancelamento, falha com retry, sessão expirada, teclado e celular. Capturas ignoradas pelo Git em `test-results/profile-*.png`. O teste real HTTP/Prisma/PostgreSQL roda no backend com `npm run test:perfil`.

O cenário de login compacto em `RegistrationPolishSpec.ts` verifica ausência de rolagem vertical e horizontal, inclusive com erro de autenticação, em 320×568, 390×844, 768×768, 769×720, 860×720, 1366×768 e 1440×900. Também verifica as três etapas do painel de cliente e a remoção do depoimento. Usa API simulada e gera capturas em `test-results` para inspeção.

O cenário `topo permanece alinhado entre login e cadastros` compara coordenadas de Voltar, título do formulário e, no desktop, logo, título e descrição do painel esquerdo nas três rotas. Também verifica ausência de sobreposição entre os links superiores em seis combinações de largura e altura.

## Conta única e ativação profissional

`ProviderActivationSpec.ts` usa API simulada para verificar convite da home/Meu perfil, encaminhamento do cadastro público, payload exclusivamente profissional, ausência de certificações, recuperação de resposta perdida e consulta indisponível após envio, CNPJ duplicado, bloqueio de envio duplo, troca de conta e descarte de resposta atrasada. Inclui teclado, foco, bordas/cores e ausência de transbordamento em 320/390/768/1440 px. Capturas: `test-results/activation-<largura>.png`.

Execute `npm run test:e2e -- ProviderActivationSpec ProviderRegistrationSpec AuthenticationSpec ProfileSpec ProfessionalsSpec RequestsSpec RegistrationPolishSpec`. O contrato público de usuário exige `possuiPerfilProfissional`; fixtures dos demais consumidores de sessão também devem fornecê-lo. O Edge instalado pode ser usado com `PLAYWRIGHT_CHANNEL=msedge`. A suíte backend `test:conta-unica` valida a API e persistência reais em banco descartável, complementando os mocks do navegador.


`ProfileSpec` também verifica a ação profissional dentro do resumo, foco por teclado, sublinhado, altura natural do formulário e espaçamento inferior no desktop e ausência de transbordamento em 320/390/768/1440 px. Na navegação entre seções, verifica que os mesmos nós de sidebar, logo e convite continuam conectados ao DOM. `ProviderActivationSpec` verifica animação em todos os campos e desativação por movimento reduzido. As capturas `profile-polish-<largura>.png` ficam em `test-results/`. Estes cenários usam API simulada.
