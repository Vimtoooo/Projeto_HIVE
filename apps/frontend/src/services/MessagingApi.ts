import { apiMessage, isPublicUser } from "./ApiClient";
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export interface Person {
  idUsuario: number;
  nome: string;
}
export interface Conversation {
  id: number;
  cliente: Person;
  prestador: Person;
}
export interface Message {
  id: number;
  conversaId: number;
  remetenteId: number;
  conteudo: string;
  enviadaEm: string;
}
export interface Provider {
  idPrestador: number;
  nome: string;
  areaAtuacao: string;
}
export interface PreviousProvider {
  prestadorId: number;
  nome: string;
  areaAtuacao: string;
  ultimoServico: string;
  dataContratacao: string;
  disponivel: boolean;
}
function object(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}
function id(v: unknown): v is number {
  return typeof v === "number" && Number.isSafeInteger(v) && v > 0;
}
function person(v: unknown): v is Person {
  return object(v) && id(v.idUsuario) && typeof v.nome === "string";
}
function conversation(v: unknown): v is Conversation {
  return object(v) && id(v.id) && person(v.cliente) && person(v.prestador);
}
function message(v: unknown): v is Message {
  return (
    object(v) &&
    id(v.id) &&
    id(v.conversaId) &&
    id(v.remetenteId) &&
    typeof v.conteudo === "string" &&
    typeof v.enviadaEm === "string" &&
    Number.isFinite(Date.parse(v.enviadaEm))
  );
}
function provider(v: unknown): v is Provider {
  return (
    object(v) &&
    id(v.idPrestador) &&
    typeof v.nome === "string" &&
    typeof v.areaAtuacao === "string"
  );
}
function previous(v: unknown): v is PreviousProvider {
  return (
    object(v) &&
    id(v.prestadorId) &&
    typeof v.nome === "string" &&
    typeof v.areaAtuacao === "string" &&
    typeof v.ultimoServico === "string" &&
    typeof v.dataContratacao === "string" &&
    typeof v.disponivel === "boolean"
  );
}
function valid<T>(value: unknown, check: (v: unknown) => v is T): T {
  if (!check(value)) throw new Error("Resposta inesperada do servidor.");
  return value;
}
function array<T>(value: unknown, check: (v: unknown) => v is T): T[] {
  if (!Array.isArray(value) || !value.every(check))
    throw new Error("Resposta inesperada do servidor.");
  return value;
}
export async function api(
  path: string,
  body?: unknown,
  method?: "PATCH" | "PUT" | "DELETE",
): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch("/api/" + path, {
      method: method ?? (body === undefined ? "GET" : "POST"),
      headers: { "Content-Type": "application/json", "X-Hive-Request": "1" },
      credentials: "same-origin",
      cache: "no-store",
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new Error("Não foi possível conectar à API. Tente novamente.");
  }
  const data: unknown =
    response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok)
    throw new ApiError(
      apiMessage(data, "Não foi possível concluir a solicitação."),
      response.status,
    );
  return data;
}
export async function session() {
  return valid(await api("sessao"), isPublicUser);
}
export async function conversations() {
  return array(await api("conversas"), conversation);
}
export async function startConversation(prestadorId: number) {
  return valid(await api("conversas", { prestadorId }), conversation);
}
export async function sendMessage(
  conversaId: number,
  conteudo: string,
  chave: string,
) {
  return valid(
    await api(`conversas/${conversaId}/mensagens`, { conteudo, chave }),
    message,
  );
}
export async function messages(conversaId: number, antes?: number) {
  const data = await api(
    `conversas/${conversaId}/mensagens` + (antes ? `?antes=${antes}` : ""),
  );
  if (!object(data) || typeof data.temMais !== "boolean")
    throw new Error("Resposta inesperada do servidor.");
  return { itens: array(data.itens, message), temMais: data.temMais };
}
export async function history() {
  return array(await api("contratacoes/anteriores"), previous);
}
export async function providers(page = 1) {
  const data = await api(`servicos?limite=30&pagina=${page}`);
  if (
    !object(data) ||
    !Array.isArray(data.itens) ||
    typeof data.total !== "number"
  )
    throw new Error("Resposta inesperada do servidor.");
  const items = data.itens.map((v) => {
    if (!object(v)) throw new Error("Resposta inesperada do servidor.");
    return valid(v.prestador, provider);
  });
  return {
    itens: [...new Map(items.map((p) => [p.idPrestador, p])).values()],
    temMais: page * 30 < data.total,
  };
}
