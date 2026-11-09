# Próximas tarefas — conta única e certificações

Atualizado em 09/11/2026 (decisões de produto aprovadas em 05/11/2026). **Etapa 1 implementada; etapas 2 e 3 pendentes.** Sem commit, publicação ou conversão de banco real nesta entrega.

## Estado atual e direção

O cadastro profissional cria conta AMBOS, exige CNPJ e aceita certificações opcionais. Clientes podem ativar o perfil profissional na mesma identidade; profissionais legados também podem contratar. Não há consulta oficial de certificados nem distintivo de verificação.

Direção aprovada: uma conta mantém a capacidade de contratar e ganha a capacidade adicional de prestar serviços. Exemplo: um eletricista recebe pedidos de instalações e contrata um pintor para sua casa com o mesmo login. Ver o [plano de conta única](CONTA-UNICA.md) para regras de identidade, autorização, concorrência e legado.

## 1. Conta única e requisitos de cadastro

- [x] Permitir ao cliente autenticado ativar seu perfil profissional, preservando identidade, senha, sessão, pedidos, conversas, favoritos, notificações e avaliações.
- [x] Preservar o cadastro direto de novos prestadores: não exigir cadastro prévio de cliente. Criar identidade, perfil e primeiro serviço de forma atômica.
- [x] Permitir que profissionais também contratem outros profissionais; impedir autocontratação e autoavaliação no servidor.
- [x] Manter CNPJ obrigatório, incluindo a unicidade existente. Explicar antes do preenchimento que autônomos sem CNPJ não poderão concluir o cadastro. Não apresentar a atual validação de formato como consulta oficial de autenticidade.
- [x] Tornar certificações opcionais tanto no cadastro direto quanto na ativação profissional. Aceitar ausência de certificações na interface e API, sem preenchimento fictício. Preservar limites das certificações informadas e ajustar persistência/domínio conforme necessário.
- [x] Atualizar testes, textos e documentação que atualmente dizem que todos os campos são obrigatórios ou exigem pelo menos uma certificação.

Aceite: cliente ativa o perfil sem duplicar conta; novo prestador entra diretamente; ambos podem contratar terceiros; cadastro sem certificação funciona e sem CNPJ falha; legado e histórico são preservados. Certificação ausente não impede cadastro, e certificação informada ainda não recebe selo.

## 2. Certificações estruturadas e verificação

Esta etapa vem após o fluxo principal. Certificações opcionais não dependem da disponibilidade de um serviço externo de verificação.

- [ ] Substituir ou complementar texto livre com nome da formação/certificado e instituição emissora; incluir código, link oficial ou referência de QR Code quando disponíveis. Definir campos de emissão/validade quando aplicáveis.
- [ ] Preservar certificações antigas como **Informado pelo prestador**, sem promover textos legados a verificados.
- [ ] Identificar instituições com consulta oficial acessível e documentar quais fontes são suportadas. Definir mecanismo de confirmação, autenticação necessária e tratamento de fontes indisponíveis antes de implementar conectores.
- [ ] Conferir emissão e correspondência entre certificado, instituição, formação e titular da conta. Encontrar o nome do curso ou uma página na internet não comprova que a pessoa o concluiu.
- [ ] Guardar evidência rastreável da consulta, fonte e data, com acesso controlado. Definir quais dados poderão ser exibidos publicamente, sem expor documentos pessoais ou códigos privados.
- [ ] Tratar links fornecidos como entrada não confiável: restringir consultas às fontes oficiais suportadas e impedir acesso a destinos internos/locais ou redirecionamentos indevidos. Definir limites de tempo e tentativas.
- [ ] Nunca usar uma resposta de IA, resultado de busca ou ausência de resultado como prova suficiente de autenticidade ou invalidade. A confirmação deve vir de evidência oficial correspondente.

### Estados de apresentação

| Estado | Condição |
| --- | --- |
| Informado pelo prestador | Cadastrado sem confirmação de autenticidade |
| Em verificação | Consulta em andamento |
| Verificado | Emissão e correspondência dos dados confirmadas em fonte oficial |
| Não foi possível verificar | Fonte não suportada/indisponível ou dados insuficientes; não significa inválido |
| Divergência identificada | Consulta oficial retornou informações incompatíveis; apresentar o motivo e permitir correção/reanálise |

- [ ] Definir transições, retentativas e tratamento de expiração/revogação. Só classificar como expirado/revogado com evidência correspondente; indisponibilidade da consulta não prova revogação.
- [ ] Revalidar após alteração de dados relevantes do certificado. Uma edição não pode conservar automaticamente a confirmação anterior.
- [ ] Não bloquear todo o perfil por uma consulta inconclusiva. Qualquer política futura de restrição de serviços precisa de definição própria.

Aceite: ausência de consulta gera estado inconclusivo; incompatibilidade oficial gera divergência; confirmação exige correspondência do titular e formação. Falhas externas são recuperáveis e não paralisam cadastro/login. Expiração e revogação têm tratamento explícito e evidência preservada.

## 3. Distintivo azul de certificação verificada

- [ ] Exibir ícone azul e texto **“Verificada”** na certificação confirmada.
- [ ] Exibir **“Possui certificação verificada”** no perfil quando houver ao menos uma certificação com confirmação válida segundo a política definida.
- [ ] Ao abrir o distintivo, mostrar formação, instituição, data da verificação, validade quando houver e referência pública apropriada à fonte oficial.
- [ ] Vincular o distintivo à formação específica. Exemplo: “Certificação em instalações elétricas — emissão confirmada pela instituição”. Não estender a confirmação a outras atividades oferecidas pela mesma pessoa.
- [ ] Não usar o selo como garantia geral de qualidade, experiência, conduta, habilitação para toda atividade ou como “profissional aprovado pelo HIVE”. Avaliações de serviços concluídos continuam sendo uma informação separada.
- [ ] Atualizar ou retirar o distintivo aplicável quando a certificação expirar, for revogada ou perder a confirmação após edição. Se houver outra certificação válida e verificada, manter a indicação geral com os detalhes corretos.
- [ ] Garantir texto visível, nome acessível, navegação por teclado e detalhes utilizáveis no celular; a cor azul sozinha não comunica o estado.
- [ ] Calcular o estado e elegibilidade do distintivo no servidor; usuário não pode escolher “verificado” ou conceder o selo a si mesmo.

Aceite: nenhuma certificação ou apenas certificações declaradas/inconclusivas não gera selo; uma confirmação válida gera selo com explicação específica; múltiplas certificações, expiração, revogação e edição atualizam corretamente a apresentação.

## 4. Ampliação de Meu perfil — registrada, não implementada

Pedido de 09/11/2026: registrar estas funcionalidades para planejamento posterior. **Não iniciar implementação agora.** A referência a gov.br é uma inspiração de organização da conta; não implica integração, reprodução de funcionalidades ou autenticação governamental.

- [ ] Endereço detalhado: CEP, rua, número, complemento, bairro, cidade e UF. Definir campos obrigatórios, validação e conversão do endereço livre existente sem inventar dados. Consulta automática de CEP depende de decisão própria.
- [ ] Edição dos dados profissionais da própria conta: área de atuação, experiência e certificações declaradas. Preservar limites, autorização no servidor e distinção entre declaração e verificação; não conceder selo por edição.
- [ ] Segurança em seção própria: alteração de senha e e-mail com confirmação. Planejar reautenticação, comprovação de acesso ao novo e-mail, unicidade, expiração/uso único de confirmações e tratamento das sessões antes de implementar.
- [ ] Manter CPF e CNPJ sem edição pelo usuário após cadastro. Nenhum payload de atualização deve permitir trocar identidade, titularidade ou capacidades.
- [ ] Definir contratos, persistência/migrations quando necessárias, acessibilidade e testes antes de implementar. Campos editáveis atuais continuam sendo nome, telefone e endereço livre.

Estado visual atual: cartões de Meu perfil alinhados pelo topo, com alturas naturais conforme seu conteúdo. O convite profissional permanece no resumo da conta. Ver [guia de perfil](../../frontend/docs/profile.md).

## 5. Avaliação de piloto acadêmico com dados reais — pendente

O usuário informou exigência de avaliação pelo coordenador/clientes com dados reais. Este registro **não autoriza coleta, importação, publicação ou alteração de banco real**. A decisão institucional e a adequação do tratamento precisam ser definidas antes do piloto; aprovação funcional não substitui essas definições.

- [ ] Definir responsável institucional pelo tratamento, finalidade, participantes, dados estritamente necessários e base legal aplicável com a instituição. Documentar informação aos participantes e consentimento quando essa for a base adotada; a finalidade acadêmica não é autorização genérica.
- [ ] Definir acesso aos dados, prazo de retenção, descarte, atendimento aos titulares e responsável por incidentes. Avaliar a necessidade de CPF e endereço completo para cada objetivo do teste. Manter dados reais fora de repositórios, fixtures, capturas compartilhadas e logs de depuração.
- [ ] Preparar ambiente restrito de homologação, separado de testes automatizados, com HTTPS quando acessado em rede, segredos protegidos, acesso mínimo ao banco e backup/restauração testados.
- [ ] Revisar proteção contra tentativas repetidas de login/cadastro, configuração de CORS/origens e exposição da API. Inspeção pontual em 09/11/2026: main.ts usa enableCors() sem restrição explícita; não foi localizado limitador de requisições no código consultado. Isso não comprova ausência de controles externos: hospedagem/proxy não foram auditados.
- [ ] Executar fluxo integrado navegador → API → PostgreSQL, incluindo isolamento entre contas, expiração de sessão e dados exibidos publicamente, antes de inserir dados de clientes. Evidências existentes incluem navegador com API simulada e integrações backend em PostgreSQL descartável; não equivalem à validação completa do ambiente de piloto.
- [ ] Submeter o plano do piloto e seus critérios de aprovação ao coordenador e responsável institucional. Começar com grupo pequeno e participantes informados após resolver as pendências.

Há controles existentes de sessão HTTP-only, hash do token no banco, expiração e autorização por participante; esta revisão documental não é uma auditoria completa de segurança nem uma aprovação de conformidade.

Referências oficiais consultadas em 09/11/2026: [ANPD — tratamento para fins acadêmicos](https://www.gov.br/anpd/pt-br/assuntos/noticias/anpd-lanca-guia-orientativo-sobre-tratamento-de-dados-pessoais-para-fins-academicos) e [ANPD — guia de segurança da informação](https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia-orientativo-sobre-seguranca-da-informacao-para-agentes-de-tratamento-de-pequeno-porte).

## Decisões técnicas a concluir na implementação

Definir instituições/fontes iniciais suportadas, periodicidade de reconsulta, tratamento de certificados sem validade, política de evidências e necessidade de revisão manual. Esses detalhes ainda não foram aprovados como solução fechada. Upload de arquivos não é requisito decidido; não presumir que o texto “inserir certificado” autoriza implementar armazenamento de documentos.

O distintivo deverá aparecer na apresentação do profissional disponível na entrega; conferir se será no painel atual do catálogo ou na futura página dedicada. Não transformar esta tarefa em autorização implícita para construir toda a página pública.

## Verificação e condição de parada

Testar permissões por participante, ativação atômica/idempotente, validação opcional, preservação de dados legados, falhas externas, tentativa de adulterar o status, estados do distintivo e acessibilidade. Integrações externas precisam de cenários simulados determinísticos e verificação controlada em fontes suportadas, sem publicar dados pessoais de teste. Revisar necessidade de migrations e usar banco descartável para validação.

O próximo agente deve reler AGENTS.md, conferir branch/diff e consultar este arquivo e CONTA-UNICA.md. A primeira entrega foi autorizada e implementada; etapas posteriores exigem definição de escopo e autorização própria. Concluir cada entrega, verificar, documentar e parar. Não criar commit, push, merge, publicar ou alterar banco real automaticamente.
