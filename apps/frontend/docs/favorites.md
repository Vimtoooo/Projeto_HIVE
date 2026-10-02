# Favoritos por conta

A seção `/favoritos` mantém o shell, os cards e o painel de detalhes do catálogo. No celular, Ver detalhes alterna o painel e Voltar à lista retorna aos salvos. Profissionais indisponíveis não oferecem ações de conversa/contratação, mas podem ser removidos. Exclusão definitiva da conta ou prestador remove o vínculo por cascata.

## Preparação e demonstração

1. Em `apps/backend`, execute `npm run db:migrate:deploy`, `npm run prisma:generate` e reinicie `npm run start:dev`. A migration é aditiva; não exige reset ou seed. Nesta execução foi validada em banco descartável antes de aplicada ao `hive` local.
2. Inicie o frontend com `npm run dev` e entre na conta fictícia já disponível.
3. Abra `/profissionais` e use **Favoritar**. A confirmação aparece no botão e no contador da barra lateral.
4. Abra **Favoritos**, consulte o profissional, saia e entre novamente: a lista permanece. Outra conta tem sua própria lista.
5. Use **Remover dos favoritos**. Em falha de conexão, a interface preserva o estado e oferece atualização.
6. Na Home, **Ver favoritos demonstrativos** filtra somente exemplos do navegador. Nenhum identificador demonstrativo é enviado ou importado para o banco.

## Contrato e implementação

- `GET /favoritos` retorna `{ usuarioId, itens }`, ordenados por data decrescente e ID. Cada item contém identificação pública, área, data, disponibilidade e resumo público do catálogo quando disponível. A listagem atual é completa, sem paginação; paginação pode ser acrescentada se o volume crescer.
- `PUT /favoritos/:prestadorId` salva um profissional disponível, de outra conta. Repetir preserva a data original, inclusive se o já salvo ficou indisponível.
- `DELETE /favoritos/:prestadorId` remove apenas o vínculo da conta conectada, mesmo inexistente ou indisponível. PUT/DELETE respondem `{ usuarioId, prestadorId, favorito }`.
- IDs são inteiros positivos; corpo vazio, sem aceitar IDs de usuário. Escritas têm proteção de header e todos os endpoints usam sessão. Nenhuma senha, documento, e-mail, telefone ou endereço é retornado.

`FavoritesProvider` consulta o backend e compartilha o estado em memória; não usa o armazenamento dos exemplos. Atualiza ao voltar à janela, mudar visibilidade, trocar a identificação da conta ou solicitar atualização. Sessão expirada limpa os dados. Gravações não são otimistas: falhas não simulam sucesso. Se a gravação for confirmada e a nova consulta falhar, o aviso orienta atualizar a lista. Não há atualização por WebSocket.

`FavoriteButton` atende catálogo, favoritos e profissionais reais da Home. `FavoritesWorkspace` reutiliza `ProfessionalCard` e `ProfessionalDetails`. Os artigos da Central de Ajuda refletem o fluxo atual. Cadastro de prestador permanece fora deste escopo.

## Testes

Backend: `npm run test:favoritos`. Cria e remove somente `hive_favorites_<uuid>_test`, usando `TEST_DATABASE_URL` local terminado em `_test` e permissão CREATEDB. Verifica migration/schema, sessão, header, corpo, unicidade concorrente, idempotência, novo login, isolamento, indisponibilidade e cascatas.

Frontend: `npm run test:e2e -- FavoritesSpec`. Para Chrome instalado no PowerShell, configure `$env:PLAYWRIGHT_CHANNEL = 'chrome'`. Cobre salvar/remover, recarga, falha, troca/expiração de conta, visitante, Home e separação dos exemplos. Capturas em `test-results/favorites-desktop.png` e `favorites-mobile.png`. Execute também lint, typecheck, build e as regressões de Home, Profissionais e Ajuda.
