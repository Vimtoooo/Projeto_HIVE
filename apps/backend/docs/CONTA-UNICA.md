# Próximo requisito — conta única para contratar e prestar serviços

## Estado e objetivo

**Planejado, ainda não implementado.** O usuário solicitou a preparação deste requisito e do plano para o próximo agente. Esta entrega altera somente documentação; não converte contas, não aplica migrations e não autoriza publicação ou alterações em banco real.

Objetivo: permitir que a mesma pessoa contrate e ofereça serviços com uma única identidade, senha, sessão e histórico. Este requisito passa a ser a prioridade proposta antes da página dedicada de perfil público do prestador, que permanece no backlog.

### Analogia de produto

Um eletricista usa o HIVE para receber pedidos de instalações. Quando precisa pintar sua casa, contrata um pintor pelo mesmo login. Na instalação ele é o prestador; na pintura ele é o contratante. São dois papéis em pedidos diferentes, e não duas pessoas ou duas contas.

A conta é a identidade da pessoa. O perfil profissional é uma capacidade adicional dessa conta. Uma eventual seleção visual de papel serve para filtrar a interface, nunca para conceder permissões.

## O que existe hoje

- `Usuario` concentra identidade e relações de contratação; `Prestador` é uma extensão opcional ligada à mesma identidade no schema Prisma.
- Existem os valores `CONTRATANTE`, `PRESTADOR` e `AMBOS`.
- `POST /clientes` cria `CONTRATANTE`; `POST /prestadores` cria `PRESTADOR`, perfil profissional e primeiro serviço juntos.
- O backend bloqueia explicitamente `PRESTADOR` ao criar uma solicitação. A interface repete essa restrição no catálogo e em Minhas solicitações.
- `AMBOS` já passa pela regra de criação de pedidos. Oferecer serviços exige também o registro profissional; apenas alterar o enum não cria esse registro.
- Minhas solicitações já distingue **Pedidos feitos** e **Pedidos recebidos**.
- Ainda não existe fluxo de ativação profissional de uma conta autenticada. O cadastro público atual não deve ser reutilizado como conversão, pois cria outra identidade.

## Regras de negócio propostas

| Situação final | Contratar outro profissional | Receber pedidos de seus serviços |
| --- | --- | --- |
| Visitante | Entrar ou cadastrar-se primeiro | Não |
| Conta ativa sem perfil profissional | Sim | Não |
| Conta ativa com perfil profissional | Sim | Sim, conforme disponibilidade do serviço |
| Conta inativa | Não iniciar novas operações | Não disponibilizar novos pedidos; preservar histórico e regras existentes de acesso |

1. **Identidade única:** ativar a atuação profissional preserva `idUsuario`, CPF, e-mail, senha, favoritos, conversas, notificações, avaliações e pedidos existentes. Não solicitar novo cadastro pessoal nem criar outro login.
2. **Contratação como capacidade básica:** todo usuário ativo pode contratar serviços ativos de outros profissionais ativos, inclusive quem presta serviços.
3. **Ativação profissional explícita:** cliente informa CNPJ, área, experiência, certificações e primeiro serviço, seguindo as validações atuais. Dados pessoais vêm da conta autenticada; não aceitar identidade de destino ou tipo de conta escolhidos pelo navegador.
4. **Ativação atômica:** perfil, primeiro serviço e mudança de tipo devem ocorrer juntos. Falha ou conflito não pode deixar perfil incompleto nem modificar parcialmente a conta.
5. **Sem duplicação:** chamadas simultâneas e repetição após falha de conexão não podem duplicar perfil ou primeiro serviço. Definir contrato de idempotência; repetir uma ativação concluída deve retornar resultado consistente ou conflito claro, sem novas gravações.
6. **Unicidade:** CPF/e-mail permanecem os da conta; CNPJ mantém a restrição existente. Não fundir automaticamente contas com identidades ou documentos conflitantes.
7. **Sem autocontratação:** comparar a identidade autenticada com o dono do serviço no servidor. Proibir também autoavaliação e preservar as restrições atuais de ações sobre o próprio perfil.
8. **Papel por pedido:** o contratante cria/cancela e avalia conforme as regras atuais; o prestador responsável aceita/recusa/conclui/cancela conforme o estado. Ser `AMBOS` não dá acesso a pedidos alheios nem permite aceitar o pedido feito a outro profissional.
9. **Avaliações:** somente o contratante do pedido concluído pode avaliar, uma vez. Um prestador que contratou outro pode avaliá-lo nesse contexto; a avaliação pertence ao profissional que executou o serviço.
10. **Mesmas garantias do fluxo atual:** manter preço obtido do servidor, chave de envio, transições, bloqueios financeiros e notificações à contraparte. Nenhum pagamento automático novo faz parte do requisito.
11. **Sessão como autoridade:** após ativação, consultar novamente a sessão no servidor e atualizar todas as telas dependentes. Revalidar ao retornar à janela e trocar de conta; armazenamento local não concede capacidades.
12. **Interface única:** manter Pedidos feitos/Pedidos recebidos. O convite profissional aparece para quem ainda não possui a capacidade; autenticados seguem para ativação e visitantes para cadastro. Quem já é profissional não vê convite de ativação. Não exigir logout para alternar entre contratar e prestar.

## Estratégia proposta para os tipos e contas existentes

Preferir reaproveitar `AMBOS` como tipo persistido da conta com perfil profissional, mantendo `CONTRATANTE` para quem não ativou essa capacidade. Não remover o valor legado `PRESTADOR` nesta entrega sem necessidade demonstrada.

- Novos cadastros profissionais passam a produzir conta `AMBOS`, perfil e primeiro serviço, mantendo o contrato público compatível ou documentando sua evolução.
- Ativação de cliente autenticado muda `CONTRATANTE` para `AMBOS` somente após criar o perfil e primeiro serviço na transação.
- Contas legadas `PRESTADOR` com perfil válido devem ganhar capacidade de contratar. Preferência: conversão controlada e idempotente para `AMBOS`, sem recriar usuários ou apagar histórico.
- Preparar primeiro uma consulta de diagnóstico: contagens por tipo e presença de perfil, incluindo `PRESTADOR` sem perfil e `AMBOS` sem perfil. Inconsistências exigem tratamento explícito; não inventar CNPJ, certificações ou serviços para corrigir dados.
- Definir compatibilidade durante implantação: backend não deve depender apenas da atualização simultânea de todos os clientes ou de sessões armazenadas localmente. Testar sessões abertas antes da conversão.
- O enum e a relação já existem; não presumir necessidade de alteração estrutural. Se necessária, justificar migration. Uma atualização de dados deve ser rastreável, ter pré-condições e ser validada em banco descartável antes de qualquer execução real.
- Documentar execução, auditoria e recuperação. Não fazer rollback cego para `PRESTADOR` após essas contas criarem pedidos. Não usar reset/seed para converter contas existentes.

Essas são decisões técnicas propostas para revisão pelo próximo agente, não funcionalidades já disponíveis. A forma exata do endpoint de ativação e da atualização de dados deve ser definida após conferir os contratos atuais.

## Plano de implementação

1. **Confirmar o ponto de partida:** ler AGENTS.md, conferir branch/diff e preservar trabalho não commitado. Rastrear os tipos no domínio, persistência, sessão, pedidos e interface. Registrar contratos e invariantes antes de editar.
2. **Concluir o contrato:** definir endpoint autenticado separado do cadastro público, payload apenas profissional, resposta, erros de validação/unicidade e idempotência. Documentar antes de ligar a interface. Não abrir alteração arbitrária de `tipoUsuario` na edição de perfil.
3. **Implementar backend:** ativação atômica, cadastro profissional com capacidade dupla, autorização por identidade/participação e compatibilidade de contratação das contas legadas. Reutilizar as regras atuais de validação, sem duplicá-las em versões divergentes.
4. **Preparar transição dos dados:** diagnóstico, procedimento de atualização e verificação em banco descartável. Preservar IDs, vínculos, valores e histórico. Separar preparação/testes da execução em ambiente real.
5. **Implementar interface:** visitante mantém cadastro profissional; cliente autenticado ativa perfil sem redigitar dados pessoais; profissional contrata pelo catálogo. Remover mensagens/bloqueios de “somente prestador” de forma coordenada com o backend. Atualizar convite, perfil, solicitações e sessão. Preservar o alinhamento e responsividade já entregues.
6. **Validar ponta a ponta:** contas novas/legadas, ativação, contratação recíproca, ações por participante, avaliações, notificações e histórico. Corrigir somente regressões relacionadas.
7. **Documentar e encerrar:** atualizar contratos, guias, exemplos e estado real do roadmap; registrar resultados/limitações, preparar continuidade e parar. Não iniciar a página pública de perfil no mesmo escopo.

## Critérios de aceite e testes

- Um eletricista cadastrado como profissional contrata um pintor sem criar outra conta; continua recebendo pedidos de instalações. Os pedidos aparecem nas abas corretas.
- Um cliente ativa o perfil, mantendo identidade, credenciais e histórico. A sessão aberta passa a refletir a capacidade profissional; o convite desaparece.
- Novo cadastro profissional resulta em capacidades duplas; conta sem perfil continua podendo contratar, mas não oferecer serviços.
- Perfil existente, CNPJ duplicado, campos inválidos, envio duplo, concorrência, timeout após confirmação e falha no primeiro serviço não causam duplicações ou estado parcial.
- Conta legada válida continua acessível após a atualização; inconsistências são identificadas sem dados inventados. Sessões antigas e troca entre contas não vazam permissões.
- Autocontratação e autoavaliação são negadas pelo backend mesmo com requisição manual. Usuário externo não consulta/altera pedidos de terceiros. Prestador contratante não aceita/conclui pedidos que fez a outro profissional.
- Preços, avaliações, notificações, favoritos, histórico e fluxo de mensagens mantêm seus contratos. Testar dois profissionais contratando um ao outro, respeitando a direção das conversas atual, sem fundir conversas indiscriminadamente.
- Conferir desktop/tablet/celular, teclado, mensagens em português, estados de carregamento/erro e ausência de sobreposição. Login permanece sem rolagem nas dimensões já testadas.
- Frontend: lint, typecheck, testes unitários, build e Playwright dos fluxos de autenticação, cadastro, solicitações, catálogo e sessão afetados.
- Backend: lint:check, build, testes unitários e integrações pertinentes de cadastro, solicitações, avaliações, mensagens e sessão em PostgreSQL descartável. Usar os scripts existentes descritos nos READMEs; não apontar testes destrutivos a bancos do usuário.
- Atualizar documentação para distinguir o que foi efetivamente entregue de qualquer etapa pendente.

## Arquivos de entrada

- `apps/backend/prisma/schema.prisma`: identidade, tipos e extensão profissional.
- `apps/backend/src/catalog/servico.service.ts`, `servico.repository.ts`, `catalogo.dto.ts`: cadastro profissional atual.
- `apps/backend/src/cliente/cliente.service.ts`, `src/models/Prestador.ts`, `src/persistence/`: criação e persistência da identidade.
- `apps/backend/src/auth/`, `src/profile/`, `src/requests/requests.service.ts`, `src/messaging/`: sessão, perfil e autorização.
- `apps/frontend/src/components/ProviderRegistrationForm.tsx`, `src/services/ProviderRegistrationApi.ts`: cadastro público atual.
- `apps/frontend/src/components/professionals/ProfessionalDetails.tsx`, `src/components/requests/RequestsWorkspace.tsx`: bloqueios atuais de contratação.
- `apps/frontend/src/components/home/ProviderInvitation.tsx`, `src/components/profile/ProfileWorkspace.tsx`, `src/services/ApiClient.ts`, `src/types/ApiTypes.ts`: convite, conta e sessão.
- Guias: [cadastros](../../frontend/docs/registration.md), [solicitações](../../frontend/docs/requests.md), [API de catálogo](CATALOGO-API.md).

## Limites

Não inclui pagamentos, geolocalização, upload de fotos, fusão de contas duplicadas, remoção do perfil profissional, novos poderes administrativos ou página dedicada de perfil público. Não criar outra plataforma ou exigir duas contas. Não executar commit, push, merge, publicação ou conversão em banco real automaticamente. Neste momento foi autorizada a documentação do plano; o próximo agente deve confirmar a autorização de implementação na conversa em que receber a tarefa.
