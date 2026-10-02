import { api } from "./MessagingApi";
export interface NotificationItem {
  id: number;
  tipo: string;
  titulo: string;
  descricao: string;
  criadaEm: string;
  lidaEm: string | null;
  destino: string | null;
}
export interface NotificationPage {
  usuarioId: number;
  itens: NotificationItem[];
  ateId: number;
  proximoCursor: number | null;
}
export interface NotificationSummary {
  usuarioId: number;
  naoLidas: number;
  ateId: number;
}
const object = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;
const integer = (v: unknown): v is number =>
  typeof v === "number" && Number.isSafeInteger(v) && v >= 0;
const date = (v: unknown): v is string =>
  typeof v === "string" && Number.isFinite(Date.parse(v));
const types = [
  "NOVA_MENSAGEM",
  "SOLICITACAO_CRIADA",
  "SOLICITACAO_ACEITA",
  "SOLICITACAO_RECUSADA",
  "SOLICITACAO_CONCLUIDA",
  "SOLICITACAO_CANCELADA",
];
function item(v: unknown): v is NotificationItem {
  return (
    object(v) &&
    integer(v.id) &&
    v.id > 0 &&
    typeof v.tipo === "string" &&
    types.includes(v.tipo) &&
    typeof v.titulo === "string" &&
    typeof v.descricao === "string" &&
    date(v.criadaEm) &&
    (v.lidaEm === null || date(v.lidaEm)) &&
    (v.destino === null ||
      (typeof v.destino === "string" &&
        (/^\/mensagens\?conversa=[1-9]\d*$/.test(v.destino) ||
          /^\/solicitacoes\?pedido=[1-9]\d*&papel=(cliente|prestador)$/.test(
            v.destino,
          ))))
  );
}
function invalid(): never {
  throw Error("Resposta inesperada do servidor. Tente atualizar.");
}
export async function notificationSummary(): Promise<NotificationSummary> {
  const v = await api("notificacoes/resumo");
  if (
    !object(v) ||
    !integer(v.usuarioId) ||
    v.usuarioId < 1 ||
    !integer(v.naoLidas) ||
    !integer(v.ateId)
  )
    return invalid();
  return { usuarioId: v.usuarioId, naoLidas: v.naoLidas, ateId: v.ateId };
}
export async function notificationList(
  query: string,
): Promise<NotificationPage> {
  const v = await api("notificacoes?" + query);
  if (
    !object(v) ||
    !integer(v.usuarioId) ||
    v.usuarioId < 1 ||
    !Array.isArray(v.itens) ||
    !v.itens.every(item) ||
    !integer(v.ateId) ||
    (v.proximoCursor !== null &&
      (!integer(v.proximoCursor) || v.proximoCursor < 1))
  )
    return invalid();
  return {
    usuarioId: v.usuarioId,
    itens: v.itens,
    ateId: v.ateId,
    proximoCursor: v.proximoCursor,
  };
}
export async function notificationDetail(
  id: number,
  read = false,
): Promise<NotificationItem> {
  const v = await api(
    `notificacoes/${id}${read ? "/lida" : ""}`,
    read ? {} : undefined,
  );
  return item(v) ? v : invalid();
}
export async function readAllNotifications(ateId: number): Promise<void> {
  const v = await api("notificacoes/ler-todas", { ateId });
  if (!object(v) || !integer(v.atualizadas)) invalid();
}
