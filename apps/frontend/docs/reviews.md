# Avaliações de serviços

O cliente avalia um pedido concluído em **Minhas solicitações → detalhes do pedido**. Escolhe uma nota inteira de 1 a 5, escreve um comentário opcional de até 1000 caracteres e confirma o envio definitivo no próprio painel. O formulário preserva o texto após falha de rede e confere novamente a sessão antes de enviar.

## Regras e API

- `POST /solicitacoes/:id/avaliacao`, com `{ "nota": 5, "comentario": "Ótimo serviço!" }`: exige sessão, cabeçalho `X-Hive-Request: 1`, participação como contratante e pedido `CONCLUIDA`. Prestador, terceiros e outros estados não podem avaliar.
- Uma avaliação por contratação. Repetir a mesma nota e comentário normalizado retorna o registro existente; tentar substituí-los retorna 409. Não há edição ou exclusão pela API nesta versão.
- Espaços nas extremidades do comentário são removidos; comentário vazio é salvo como `null`. A avaliação e a notificação `AVALIACAO_RECEBIDA` são gravadas na mesma transação. Falha da notificação desfaz a avaliação.
- Lista/detalhe de solicitações incluem `avaliacao` (ou `null`) e `podeAvaliar`.
- `GET /profissionais/:id/avaliacoes?pagina=1&limite=5` é público. Página entre 1 e 100000; limite de 1 a 20. Retorna `itens`, `total`, `pagina`, `limite`, ordenados do mais recente ao mais antigo, com ID como desempate.
- Cada item público contém `idAvaliacao`, `nota`, `comentario`, `dataAvaliacao`, primeiro nome do `autor` e título do `servico`. Não expõe IDs da contratação/cliente, e-mail, CPF, telefone ou endereço. O comentário é público: o formulário avisa antes do envio.
- As médias do catálogo, Home e favoritos usam os registros reais existentes. São atualizadas na próxima consulta desses dados. O perfil oferece navegação entre páginas de comentários.
- A notificação aparece na categoria Solicitações e leva ao pedido recebido pelo prestador. Eventos anteriores à implementação não são reconstruídos.

## Preparação local

No backend, selecione seu ambiente e aplique a migration aditiva (sem reset):

```powershell
$env:DOTENV_CONFIG_PATH = '.env/.env'
npm run prisma:generate
npm run db:migrate:deploy
npm run start:dev
```

A migration `20261003000000_review_notifications` acrescenta um valor ao enum de notificações; a tabela de avaliações e sua restrição única por contratação já existiam. Execute `npm run dev` no frontend e abra `http://localhost:3001/solicitacoes`.

Para demonstrar, conclua um pedido como prestador, entre como seu cliente em outro perfil do navegador e envie a avaliação. Recarregue para conferir persistência; abra o profissional para ver comentário/média e consulte as notificações do prestador. O envio grava dados no banco selecionado.

## Verificação

- Backend: `npm run test:avaliacoes`. Usa `TEST_DATABASE_URL` de `.env/.env.test.local`, exige PostgreSQL local e CREATEDB, cria e remove apenas `hive_reviews_<uuid>_test`. Verifica migrations, permissões, validações, concorrência, avaliação definitiva, notificação única, rollback e leitura pública.
- Frontend: `$env:PLAYWRIGHT_CHANNEL = 'msedge'; npm run test:e2e -- ReviewsSpec RequestsSpec ProfessionalsSpec NotificationsSpec`. Inicia o Next.js na porta 3101 e usa respostas HTTP simuladas. Capturas em `test-results/reviews-desktop.png` e `reviews-mobile.png`.
- Complementos: lint e build nas duas aplicações; `npm run typecheck` no frontend e `npx tsc --project test/tsconfig.json` no backend.

Os testes de navegador não substituem a integração HTTP/PostgreSQL: cada suíte verifica sua camada. Sem moderação, resposta do prestador, anexos ou edição de avaliações nesta entrega.
