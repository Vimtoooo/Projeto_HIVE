# Conta única para contratar e prestar serviços

Implementação iniciada em 05/11/2026 e finalizada em 08/11/2026. Uma conta ativa pode contratar outros profissionais; o perfil profissional é uma capacidade adicional ligada ao mesmo `idUsuario`. Certificações são opcionais e continuam declaradas, sem verificação ou selo. Veja as [etapas futuras](PROXIMAS-TAREFAS.md).

## Fluxos e autorização

- `POST /clientes` cria `CONTRATANTE`. `POST /prestadores` cria `AMBOS`, perfil e primeiro serviço na transação existente; mantém resposta pública de serviço e login posterior.
- `POST /perfil/prestador` ativa a conta autenticada sem criar usuário ou alterar senha, CPF, e-mail, sessão ou histórico. Perfil, serviço e tipo `AMBOS` são gravados juntos.
- Toda conta ativa pode contratar, inclusive `PRESTADOR` legado. Oferecer serviços exige o registro profissional e a disponibilidade atual do serviço/conta.
- Autocontratação e autoavaliação são negadas no servidor. Ser `AMBOS` não concede acesso a pedidos de terceiros nem permite aceitar/concluir pedidos feitos a outro profissional. Avaliação exige participação como contratante e pedido concluído.
- Mantêm-se preço do servidor, chave de envio do pedido, bloqueios financeiros, notificações transacionais e conversas direcionais. Não há cobrança nova nem fusão de conversas.

## Contrato de ativação

Exige cookie de sessão válido, conta ativa e `X-Hive-Request: 1`. Aceita somente:

```json
{
  "cnpj": "12345678000199",
  "areaAtuacao": "Montagem",
  "experiencia": "Montagem de móveis",
  "certificacoes": [],
  "servico": {
    "titulo": "Montagem de mesa",
    "descricao": "Montagem completa",
    "precoBase": 200
  }
}
```

CNPJ obrigatório e único, com 14 dígitos: validação de formato, sem consulta oficial. Área/experiência: 1–191 caracteres; título: 5–191; descrição: 1–5000; preço: 0,01–1.000.000,00, até duas casas decimais. Certificações omitidas ou `[]` persistem como `[]`; `null`, tipos incorretos, itens vazios ou só espaços são rejeitados. Máximo de 20 itens, 1–191 caracteres cada. O DTO profissional é compartilhado com o cadastro direto.

- `201`: mesmo objeto público de serviço de `POST /prestadores`.
- `400`: payload inválido ou campo extra, inclusive identidade, senha, capacidades ou tipo de usuário.
- `401`: sessão inexistente, expirada ou conta não ativa; `403`: ausência do cabeçalho de segurança.
- `409`, `code: PERFIL_PROFISSIONAL_EXISTENTE`: já existe perfil; nenhuma gravação adicional, mesmo se o payload repetido for diferente.
- `409`, `code: CNPJ_DUPLICADO`: CNPJ de outro perfil.
- `503`: falha recuperável; consultar sessão antes de repetir.

A transação usa isolamento serializável e até três tentativas para conflitos transitórios `P2034`. As chaves únicas do banco impedem perfis/CNPJs duplicados. A repetição após confirmação devolve conflito explícito, sem criar outro primeiro serviço. Falha no serviço desfaz também o perfil.

Login, sessão, cadastro de cliente e perfil retornam `possuiPerfilProfissional: boolean`. A presença real da relação profissional é a autoridade; `tipoUsuario` permanece no contrato. O novo frontend exige esse booleano: disponibilize o backend antes de atualizar o frontend. Clientes antigos continuam recebendo os campos anteriores, mas precisam recarregar a versão nova para remover seus antigos bloqueios visuais.

## Interface e sessão

O convite da home e Meu perfil levam o cliente a `/perfil/prestador`; visitantes seguem para `/cadastro/prestador`. Profissionais não veem o convite. O cadastro público encaminha autenticados à ativação ou Meu perfil, conforme a sessão.

A ativação exibe somente dados profissionais e primeiro serviço, reutilizando campos/validações do cadastro. CNPJ obrigatório e certificações opcionais são explicados antes do preenchimento. Não há dados fictícios para contornar campos obrigatórios.

Após sucesso, a interface consulta a sessão e abre Meu perfil com confirmação, sem logout. Resposta perdida, conflito de perfil existente ou falha incerta exigem consulta antes de reenviar. CNPJ duplicado preserva campos para correção. Falha na consulta não é apresentada como prova de falha da ativação.

As capacidades são reconsultadas no foco da janela, retorno de visibilidade e eventos de mudança de conta. Respostas obsoletas são descartadas; a ativação limpa o formulário ao trocar identidade. SessionStorage contém somente apresentação, nunca autoridade. Pedidos feitos e Pedidos recebidos permanecem na mesma interface.

## Legado: diagnóstico e conversão controlada

Não há migration estrutural nova. O enum `PRESTADOR` permanece aceito e as contas legadas já podem contratar antes de qualquer conversão. Certificações e histórico antigos são preservados.

Em `apps/backend`, selecione conscientemente o arquivo de ambiente e o destino. `npm run contas:diagnostico` somente lê o banco `DATABASE_URL`: retorna contagens por tipo/presença de perfil, IDs elegíveis e inconsistências. Não expõe documentos ou credenciais.

O procedimento `scripts/conta-unica.ts` converte somente `PRESTADOR` com perfil, ao menos um serviço, CNPJ de 14 dígitos, área e experiência não vazias. Contas sem perfil, perfis sem serviço/dados essenciais e `CONTRATANTE` com perfil são diagnosticados, sem reparo automático. `AMBOS` sem perfil não recebe capacidade profissional fictícia.

A conversão é separada do deploy e exige autorização própria para o ambiente de destino:

```powershell
npm run contas:diagnostico -- --aplicar --confirmar-banco=NOME_EXATO_DO_BANCO
```

Ela refaz o diagnóstico dentro de transação serializável, registra contagens/IDs antes e depois e é idempotente. Antes de executar em ambiente real, revisar inconsistências, guardar diagnóstico e backup conforme o processo da equipe; depois, conferir IDs, contagens e sessões. Em falha, a transação desfaz a operação. Após confirmação, não fazer rollback cego para `PRESTADOR`: podem existir novos pedidos feitos por essas contas. Recuperação deve ser revisada com base nos registros afetados.

**Nesta entrega, conversão executada somente em banco descartável de testes; nenhum banco real foi convertido.**

## Verificação e limites

`npm run test:conta-unica` cria/remove seu próprio PostgreSQL descartável e aplica as migrations existentes. Cobre cadastro sem certificações, validação/autorização, concorrência, rollback por falha real no insert do serviço, preservação das relações/sessão, contratação recíproca e conversão idempotente. As suítes de profissionais, perfil, solicitações, avaliações, mensagens, favoritos e notificações complementam as regressões.

No frontend, `ProviderActivationSpec` verifica entradas, recuperação de resposta perdida, erros, troca de conta, teclado e larguras 320/390/768/1440. Executar também os cenários relacionados de cadastro, autenticação, perfil, catálogo, solicitações e acabamento visual. Playwright usa API simulada; as suítes backend usam HTTP/Prisma/PostgreSQL real.

Sem upload, verificação oficial, distintivo azul, página pública dedicada, fusão de contas, remoção de perfil, pagamentos novos ou poderes administrativos. A próxima etapa exige definição de fontes oficiais, evidências, reconsulta, validade/revogação e revisão manual. Não iniciar automaticamente.

### Evidência de validação — fechamento em 08/11/2026

- Backend: lint, build, 4 testes unitários e tipos dos testes aprovados. Integrações PostgreSQL descartáveis: conta única (6), profissionais (6), perfil (4), solicitações (6), avaliações (5), mensagens (7), favoritos (5) e notificações (5): 44 testes aprovados. Nenhuma migration estrutural nova; migrations existentes aplicadas apenas nos bancos descartáveis.
- Frontend: lint, typecheck, 25 testes unitários e build aprovados. Suíte completa Playwright com Edge: 80 testes aprovados; os 12 cenários de ativação foram repetidos após o ajuste final do cabeçalho e passaram. API simulada no navegador; sem alegação de validação browser/backend real de ponta a ponta. Capturas desktop/celular inspecionadas, inclusive correção de cores e bordas da ativação.
- `git diff --check` e links locais dos documentos alterados sem problemas. Nenhum commit, push ou publicação. O procedimento de conversão do legado não foi executado no banco da aplicação.
