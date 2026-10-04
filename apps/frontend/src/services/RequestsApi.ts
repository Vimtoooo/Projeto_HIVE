import { api } from "./MessagingApi";
export const statuses = {
  PENDENTE: "Pendente",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDA: "Concluída",
  CANCELADA: "Cancelada",
} as const;
export const payments = {
  PIX: "Pix",
  CARTAO: "Cartão",
  BOLETO: "Boleto",
  DINHEIRO: "Dinheiro",
  TRANSFERENCIA: "Transferência",
} as const;
export const actions = {
  ACEITAR: "Aceitar pedido",
  RECUSAR: "Recusar pedido",
  CONCLUIR: "Concluir serviço",
  CANCELAR: "Cancelar pedido",
} as const;
export type RequestAction = keyof typeof actions;
export type RequestRole = "cliente" | "prestador";
export interface Review {
  idAvaliacao: number;
  nota: number;
  comentario: string | null;
  dataAvaliacao: string;
}
export function isReview(v: unknown): v is Review {
  return (
    object(v) &&
    id(v.idAvaliacao) &&
    typeof v.nota === "number" &&
    Number.isInteger(v.nota) &&
    v.nota >= 1 &&
    v.nota <= 5 &&
    (v.comentario === null || typeof v.comentario === "string") &&
    typeof v.dataAvaliacao === "string" &&
    Number.isFinite(Date.parse(v.dataAvaliacao))
  );
}
export interface ServiceRequest {
  idContratacao: number;
  dataContratacao: string;
  status: keyof typeof statuses;
  valor: number;
  formaPagamento: keyof typeof payments;
  contratante: { idUsuario: number; nome: string };
  prestador: { idUsuario: number; nome: string; areaAtuacao: string };
  servico: { idServico: number; titulo: string; descricao: string };
  papel: RequestRole;
  acoes: RequestAction[];
  cancelamentoBloqueado: boolean;
  avaliacao: Review | null;
  podeAvaliar: boolean;
}
export interface CatalogService {
  idServico: number;
  titulo: string;
  descricao: string;
  precoBase: number;
  prestador: { idPrestador: number; nome: string };
}
export interface RequestPage {
  itens: ServiceRequest[];
  total: number;
  pagina: number;
  limite: number;
}
const object = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;
const id = (v: unknown): v is number =>
  typeof v === "number" && Number.isSafeInteger(v) && v > 0;
const member = (v: unknown, values: object) =>
  typeof v === "string" && Object.hasOwn(values, v);
function isRequest(v: unknown): v is ServiceRequest {
  return (
    object(v) &&
    id(v.idContratacao) &&
    typeof v.dataContratacao === "string" &&
    Number.isFinite(Date.parse(v.dataContratacao)) &&
    member(v.status, statuses) &&
    typeof v.valor === "number" &&
    Number.isFinite(v.valor) &&
    member(v.formaPagamento, payments) &&
    object(v.contratante) &&
    id(v.contratante.idUsuario) &&
    typeof v.contratante.nome === "string" &&
    object(v.prestador) &&
    id(v.prestador.idUsuario) &&
    typeof v.prestador.nome === "string" &&
    typeof v.prestador.areaAtuacao === "string" &&
    object(v.servico) &&
    id(v.servico.idServico) &&
    typeof v.servico.titulo === "string" &&
    typeof v.servico.descricao === "string" &&
    ["cliente", "prestador"].includes(String(v.papel)) &&
    Array.isArray(v.acoes) &&
    v.acoes.every((a) => member(a, actions)) &&
    typeof v.cancelamentoBloqueado === "boolean" &&
    typeof v.podeAvaliar === "boolean" &&
    (v.avaliacao === null || isReview(v.avaliacao))
  );
}
function checked(v: unknown): ServiceRequest {
  if (!isRequest(v)) throw Error("Resposta de solicitação inválida.");
  return v;
}
export async function requestList(
  papel: RequestRole,
  status: string,
  pagina: number,
): Promise<RequestPage> {
  const query = new URLSearchParams({
    papel,
    pagina: String(pagina),
    limite: "20",
  });
  if (status) query.set("status", status);
  const data = await api("solicitacoes?" + query);
  if (
    !object(data) ||
    !Array.isArray(data.itens) ||
    !data.itens.every(isRequest) ||
    typeof data.total !== "number" ||
    !Number.isSafeInteger(data.total) ||
    data.total < 0 ||
    !id(data.pagina) ||
    !id(data.limite)
  )
    throw Error("Resposta de lista inválida.");
  return data as unknown as RequestPage;
}
export async function requestDetail(id: number) {
  return checked(await api(`solicitacoes/${id}`));
}
export async function createRequest(
  servicoId: number,
  formaPagamento: keyof typeof payments,
  chave: string,
) {
  return checked(
    await api("solicitacoes", { servicoId, formaPagamento, chave }),
  );
}
export async function changeRequest(id: number, acao: RequestAction) {
  return checked(await api(`solicitacoes/${id}/acao`, { acao }));
}
export async function reviewRequest(
  id: number,
  nota: number,
  comentario: string,
) {
  return checked(
    await api(`solicitacoes/${id}/avaliacao`, { nota, comentario }),
  );
}
export async function requestConversation(id: number) {
  const data = await api(`solicitacoes/${id}/conversa`, {});
  if (!object(data) || !Number.isSafeInteger(data.id) || Number(data.id) < 1)
    throw Error("Resposta de conversa inválida.");
  return Number(data.id);
}
export async function requestServices(
  texto: string,
  pagina: number,
): Promise<{ itens: CatalogService[]; total: number }> {
  const data = await api(
    "servicos?" +
      new URLSearchParams({
        ...(texto.trim() ? { texto: texto.trim() } : {}),
        pagina: String(pagina),
        limite: "20",
      }),
  );
  if (
    !object(data) ||
    !Array.isArray(data.itens) ||
    typeof data.total !== "number" ||
    !Number.isSafeInteger(data.total) ||
    data.total < 0 ||
    !data.itens.every(
      (s) =>
        object(s) &&
        id(s.idServico) &&
        typeof s.titulo === "string" &&
        typeof s.descricao === "string" &&
        typeof s.precoBase === "number" &&
        Number.isFinite(s.precoBase) &&
        s.precoBase >= 0 &&
        object(s.prestador) &&
        id(s.prestador.idPrestador) &&
        typeof s.prestador.nome === "string",
    )
  )
    throw Error("Catálogo indisponível.");
  return data as unknown as { itens: CatalogService[]; total: number };
}
