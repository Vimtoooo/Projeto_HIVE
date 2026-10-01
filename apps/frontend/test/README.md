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
