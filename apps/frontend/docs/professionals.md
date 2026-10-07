# Catálogo de profissionais

## Uso

Inicie a API com `npm run start:dev` em `apps/backend` e o frontend com `npm run dev` em `apps/frontend`. Acesse `http://localhost:3001/profissionais` ou **Profissionais** na barra lateral. O catálogo é público; mensagens e pedidos exigem sessão.

1. Busque pelo nome, área ou título/descrição de serviço ativo. O campo **Área de atuação** restringe a busca por trecho de área. Ambos ignoram maiúsculas/minúsculas; diferenças de acentos ainda são significativas nesta busca PostgreSQL.
2. Abra **Ver detalhes**. O painel mostra experiência, certificações declaradas (sem selo de verificação), avaliações registradas e serviços ativos com preços.
3. Use **Conversar** para abrir a conversa real da dupla. A própria conta não pode conversar consigo mesma.
4. **Solicitar serviço** abre a criação de pedido com o serviço selecionado. Confira o valor, escolha a forma de pagamento pretendida e confirme. Não há cobrança. Contas somente de prestador não contratam; contas CONTRATANTE ou AMBOS contratam outro prestador.
5. No celular, **Voltar à lista** retorna aos resultados. Filtros, página e seleção ficam na URL e funcionam com Voltar/Avançar.

A Home conserva os exemplos identificados como demonstração. `/home?secao=Profissionais` é encaminhado a `/profissionais`; favoritos locais continuam separados. Avaliações pela interface e favoritos reais foram acrescentados posteriormente; veja [avaliações](reviews.md) e [favoritos](favorites.md). Cadastro de prestador pela interface é a próxima etapa.

## Contrato público

- `GET /profissionais?texto=montagem&areaAtuacao=Marcenaria&pagina=1&limite=12`: página com `itens`, `total`, `pagina`, `limite`. Limite padrão 12, máximo 50; página entre 1 e 100000. Textos opcionais de até 191 caracteres, não vazios.
- Cada item contém `idPrestador`, `nome`, `areaAtuacao`, `precoInicial`, `quantidadeServicos` e `avaliacao` (`quantidade` e `media`, nula se não houver avaliações).
- `GET /profissionais/:id`: nome, área, experiência, certificações, avaliações e serviços ativos (`idServico`, `titulo`, `descricao`, `precoBase`). ID inválido retorna 400; profissional inexistente ou indisponível retorna 404.

A paginação é feita em Prestador, não em Servico; vários serviços não duplicam o profissional. A ordenação usa nome e ID como desempate. Consulta e contagem compartilham uma transação RepeatableRead. As médias vêm de registros Avaliacao, não do campo legado `avaliacaoMedia` que pode conter valores demonstrativos. Não são retornados telefone, endereço residencial, e-mail, CPF, CNPJ, senha ou hash.

Lista e detalhe mostram somente contas ATIVO com ao menos um serviço ATIVO. A consulta pública não autoriza ações: sessão, identidade, tipo de conta, serviço ativo e preço vigente são verificados pelos fluxos existentes. Se um serviço deixar de estar disponível entre a consulta e o envio, a criação é recusada.

## Implementação

`src/components/professionals` contém catálogo, card reutilizável e detalhes. `ProfessionalsApi.ts` verifica as respostas em runtime. O shell mantém o padrão das outras páginas. `NewRequestForm` recebe os identificadores pela URL, consulta os dados reais e nunca aceita um preço ou identidade da conta informados na URL.

No backend, o módulo `professionals` adiciona apenas leitura ao Prisma. Não modifica `POST /prestadores`, não adiciona dependências ou migrations e não reseta nenhum banco.

## Testes

- Backend: `npm run test:profissionais` cria um PostgreSQL descartável `hive_professionals_<uuid>_test`, aplica e verifica as migrations existentes, executa o Jest e remove apenas esse banco. Precisa de `TEST_DATABASE_URL` local terminando em `_test` e permissão CREATEDB, como as outras suítes. O banco configurado permanece intacto.
- Frontend: `npm run test:e2e -- ProfessionalsSpec`. Usa API simulada e cobre busca, paginação, detalhes, teclado, sessão, erros, serviço pré-selecionado, envio e celular. Para Chrome instalado no PowerShell: `$env:PLAYWRIGHT_CHANNEL = 'chrome'`.
- Regressões: `npm run test:e2e -- RequestsSpec HomeSpec HelpSpec`; execute também lint, typecheck e build antes de integrar.

Capturas em `test-results/professionals-desktop.png` e `professionals-mobile.png`. Exemplos REST em `apps/backend/http/professionals.http`.
