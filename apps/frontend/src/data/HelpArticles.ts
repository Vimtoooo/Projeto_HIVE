export const helpCategories = [
  "Conta",
  "Contratação",
  "Mensagens",
  "Notificações",
  "Profissionais e favoritos",
] as const;
export type HelpCategory = (typeof helpCategories)[number];
export type HelpArticle = {
  id: string;
  category: HelpCategory;
  title: string;
  paragraphs: readonly string[];
  link: { label: string; href: string };
};
export const helpArticles: readonly HelpArticle[] = [
  {
    id: "editar-conta",
    category: "Conta",
    title: "Como atualizo os dados da minha conta?",
    paragraphs: [
      "Em Meu perfil, você pode editar nome, telefone e endereço. Use Salvar alterações para confirmar ou Cancelar edição para restaurar os dados do formulário.",
      "E-mail, CPF mascarado, tipo de conta e data de cadastro são apenas para consulta. Alteração de senha, e-mail, foto e documentos ainda não está disponível.",
    ],
    link: { label: "Abrir meu perfil", href: "/perfil" },
  },
  {
    id: "sessao",
    category: "Conta",
    title: "Minha sessão terminou. O que fazer?",
    paragraphs: [
      "Entre novamente para consultar dados da conta, pedidos, mensagens e notificações. Essas informações pertencem à conta conectada.",
      "Se uma operação falhar, confira a conexão e tente novamente. Nunca compartilhe sua senha em mensagens. A Central de Ajuda pode ser consultada sem entrar na conta.",
    ],
    link: { label: "Entrar na conta", href: "/login" },
  },
  {
    id: "solicitar",
    category: "Contratação",
    title: "Como solicito um serviço?",
    paragraphs: [
      "Entre com uma conta de contratante ou de ambos os tipos e abra Minhas solicitações → Nova solicitação. Escolha um serviço ativo de outro prestador e confirme a forma de pagamento pretendida. Contas somente de prestador recebem pedidos, mas não solicitam como clientes.",
      "O pedido registra o preço vigente ao confirmar. Confira o valor nos detalhes e combine endereço e horário pela conversa; ainda não há agenda estruturada ou rastreamento de localização.",
    ],
    link: { label: "Abrir minhas solicitações", href: "/solicitacoes" },
  },
  {
    id: "estados",
    category: "Contratação",
    title: "O que significa cada estado do pedido?",
    paragraphs: [
      "Pendente: aguarda a decisão do prestador. Em andamento: o prestador aceitou. Concluída: o prestador finalizou o serviço. Cancelada: houve cancelamento ou recusa; recusa não possui um estado separado.",
      "O prestador responsável pode aceitar ou recusar pedidos pendentes e concluir os que estão em andamento. Serviços concluídos alimentam Contrate novamente na Home.",
    ],
    link: { label: "Acompanhar pedidos", href: "/solicitacoes" },
  },
  {
    id: "cancelar",
    category: "Contratação",
    title: "Quando posso cancelar ou recusar um pedido?",
    paragraphs: [
      "O cliente pode cancelar pedidos pendentes ou em andamento. O prestador pode recusar os pendentes e cancelar os que estão em andamento. Pedidos concluídos ou cancelados ficam disponíveis para consulta e conversa.",
      "A operação pode ser bloqueada quando existem lançamentos financeiros ou pagamentos registrados como pagos, parciais ou estornados. Confira o aviso apresentado; em caso de atualização simultânea, atualize os detalhes antes de tentar outra vez.",
    ],
    link: { label: "Consultar meu pedido", href: "/solicitacoes" },
  },
  {
    id: "pagamentos",
    category: "Contratação",
    title: "O HIVE já realiza pagamentos?",
    paragraphs: [
      "Não há processamento de pagamentos no aplicativo. A forma de pagamento escolhida no pedido registra uma intenção, sem cobrar, transferir dinheiro ou gerar uma fatura automaticamente.",
      "Concluir um serviço não comprova pagamento. A interface também não realiza estornos ou reembolsos.",
    ],
    link: { label: "Ver detalhes dos pedidos", href: "/solicitacoes" },
  },
  {
    id: "conversar",
    category: "Mensagens",
    title: "Como converso com um profissional?",
    paragraphs: [
      "Use Conversar nos profissionais cadastrados da Home ou abra a conversa pelos detalhes de um pedido. A seção Mensagens reúne as conversas da sua conta.",
      "As mensagens são salvas no banco e atualizadas periodicamente. Perfis identificados como demonstrativos são fictícios e não recebem mensagens reais. Use uma conta conectada e um profissional cadastrado para conversar.",
    ],
    link: { label: "Abrir mensagens", href: "/mensagens" },
  },
  {
    id: "avisos",
    category: "Notificações",
    title: "Como consulto e marco minhas notificações?",
    paragraphs: [
      "Abra Notificações para acompanhar novas mensagens e mudanças nos pedidos. Filtre por categoria ou por não lidas e selecione um aviso para ver os detalhes e acessar a conversa ou solicitação.",
      "Abrir um aviso marca sua leitura. Marcar todas como lidas inclui todas as categorias até o momento da consulta; avisos novos continuam pendentes. Ler uma notificação não altera o estado do pedido.",
    ],
    link: { label: "Abrir notificações", href: "/notificacoes" },
  },
  {
    id: "profissionais",
    category: "Profissionais e favoritos",
    title: "Quais profissionais posso contratar?",
    paragraphs: [
      "A Home separa perfis demonstrativos e profissionais cadastrados no banco. Fotos, distâncias e avaliações dos exemplos são ilustrativas; não representam informações verificadas de prestadores reais.",
      "Para contratar, escolha um serviço ativo no fluxo de Nova solicitação. A seção Profissionais reúne o catálogo real, com busca por nome e serviço, filtro por área e detalhes.",
    ],
    link: {
      label: "Explorar profissionais",
      href: "/profissionais",
    },
  },
  {
    id: "favoritos",
    category: "Profissionais e favoritos",
    title: "Onde ficam meus favoritos?",
    paragraphs: [
      "Use Favoritar nos profissionais reais do catálogo ou da Home. A seção Favoritos mostra os salvos na conta conectada e mantém os vínculos após novo login ou em outro dispositivo.",
      "Você pode remover um favorito mesmo se o profissional ficar indisponível. Salvar não cria uma contratação. Os favoritos demonstrativos da Home continuam separados, apenas no navegador; eles não são importados para sua conta.",
    ],
    link: { label: "Abrir favoritos da conta", href: "/favoritos" },
  },
];
export function searchHelp(
  query: string,
  category: HelpCategory | "Todas" = "Todas",
) {
  const normalize = (text: string) =>
    text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const terms = normalize(query).trim().split(/\s+/).filter(Boolean);
  return helpArticles.filter((article) => {
    const text = normalize(
      [article.title, article.category, ...article.paragraphs].join(" "),
    );
    return (
      (category === "Todas" || article.category === category) &&
      terms.every((term) => text.includes(term))
    );
  });
}
