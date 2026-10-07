# Central de Ajuda

Acesse `/ajuda` ou **Central de ajuda** na barra lateral. O botão **Como funciona** da Home também abre essa página. Mantém o shell e atualiza o painel principal, sem modal. No celular as categorias ficam acima dos artigos.

## Conteúdo e limites

Os dez artigos cobrem conta e sessão, criação e estados dos pedidos, cancelamento, pagamentos, mensagens, notificações, profissionais e favoritos. A pesquisa combina palavras no título, categoria e texto, ignorando acentos/maiúsculas. A categoria restringe os resultados. Sem resultados, é possível limpar ambos os filtros.

A consulta é pública. Atalhos para informações pessoais seguem as proteções das páginas de destino. Não há chamados, chat de atendimento ou suporte humano nesta página. O aplicativo não processa pagamentos; favoritos demonstrativos continuam locais e separados das próximas entregas. Cadastro de prestador permanece responsabilidade de outro integrante.

## Organização técnica

- `src/data/HelpArticles.ts`: artigos tipados, categorias e função pura de busca. Atualize os textos quando as regras do aplicativo evoluírem.
- `src/components/help/HelpWorkspace.tsx`: pesquisa controlada, filtro e artigos com `details/summary` nativos, acessíveis por teclado.
- `src/app/ajuda/page.tsx`: rota e metadados; `HomeDashboard` mantém cabeçalho e navegação compartilhados.
- `src/styles/help-page.module.css`: painéis responsivos, foco visível e ícone simples junto ao título.

Nenhuma dependência, endpoint, migration ou acesso ao banco foi adicionado. O shell conserva seu contador de notificações; falhas ou ausência de sessão não impedem a leitura dos guias. Os artigos e filtros não são persistidos.

## Validação e demonstração

Em `apps/frontend`, execute `npm test`, `npm run lint`, `npm run typecheck`, `npm run build` e `npm run test:e2e -- HelpSpec`.
Se o Chromium do Playwright não estiver instalado, use o Chrome existente: `$env:PLAYWRIGHT_CHANNEL = 'chrome'` antes do comando de teste no PowerShell.

1. Inicie o frontend com `npm run dev` e visite `http://localhost:3001/ajuda` sem login.
2. Pesquise `NOTIFICACOES`, selecione a categoria Notificações e abra o artigo.
3. Busque uma palavra inexistente e use **Limpar busca e filtros**.
4. Abra o artigo de pagamentos pelo teclado (Tab e Enter) e confira as limitações.
5. Siga um atalho para pedidos; sem sessão, a página solicita login.
6. No celular, confira categorias, artigos e menu lateral sem rolagem horizontal.

Os testes de navegador simulam a API do shell; não alteram dados reais. Capturas desktop/celular ficam em `test-results/help-desktop.png` e `help-mobile.png`.
