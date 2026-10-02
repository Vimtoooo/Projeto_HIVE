import { api } from "./MessagingApi";
export type Rating = { quantidade: number; media: number | null };
export type PublicService = {
  idServico: number;
  titulo: string;
  descricao: string;
  precoBase: number;
};
export type ProfessionalSummary = {
  idPrestador: number;
  nome: string;
  areaAtuacao: string;
  precoInicial: number;
  quantidadeServicos: number;
  avaliacao: Rating;
};
export type ProfessionalDetail = {
  idPrestador: number;
  nome: string;
  areaAtuacao: string;
  experiencia: string;
  certificacoes: string[];
  servicos: PublicService[];
  avaliacao: Rating;
};
export type ProfessionalsPage = {
  itens: ProfessionalSummary[];
  total: number;
  pagina: number;
  limite: number;
};
const object = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;
const integer = (v: unknown): v is number =>
  typeof v === "number" && Number.isSafeInteger(v) && v >= 0;
const id = (v: unknown): v is number => integer(v) && v > 0;
const money = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v) && v >= 0;
const rating = (v: unknown): v is Rating =>
  object(v) &&
  integer(v.quantidade) &&
  (v.quantidade === 0
    ? v.media === null
    : typeof v.media === "number" &&
      Number.isFinite(v.media) &&
      v.media >= 0 &&
      v.media <= 5);
const identity = (v: unknown): v is Record<string, unknown> =>
  object(v) &&
  id(v.idPrestador) &&
  typeof v.nome === "string" &&
  typeof v.areaAtuacao === "string" &&
  rating(v.avaliacao);
const summary = (v: unknown): v is ProfessionalSummary =>
  identity(v) && money(v.precoInicial) && id(v.quantidadeServicos);
export function isProfessionalDetail(v: unknown): v is ProfessionalDetail {
  return (
    identity(v) &&
    typeof v.experiencia === "string" &&
    Array.isArray(v.certificacoes) &&
    v.certificacoes.every((c) => typeof c === "string") &&
    Array.isArray(v.servicos) &&
    v.servicos.length > 0 &&
    v.servicos.every(
      (s) =>
        object(s) &&
        id(s.idServico) &&
        typeof s.titulo === "string" &&
        typeof s.descricao === "string" &&
        money(s.precoBase),
    )
  );
}
export async function professionalsList(
  query: string,
): Promise<ProfessionalsPage> {
  const data = await api("profissionais?" + query);
  if (
    !object(data) ||
    !Array.isArray(data.itens) ||
    !data.itens.every(summary) ||
    !integer(data.total) ||
    !id(data.pagina) ||
    !id(data.limite)
  )
    throw Error("Resposta de profissionais inválida.");
  return data as ProfessionalsPage;
}
export async function professionalDetail(
  id: number,
): Promise<ProfessionalDetail> {
  const data = await api(`profissionais/${id}`);
  if (!isProfessionalDetail(data) || data.idPrestador !== id)
    throw Error("Resposta de profissional inválida.");
  return data;
}
