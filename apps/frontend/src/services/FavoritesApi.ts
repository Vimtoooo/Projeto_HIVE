import { api } from "./MessagingApi";
import { isProfessionalSummary } from "./ProfessionalsApi";
import type { ProfessionalSummary } from "./ProfessionalsApi";
export type Favorite = {
  idPrestador: number;
  nome: string;
  areaAtuacao: string;
  criadoEm: string;
  disponivel: boolean;
  profissional: ProfessionalSummary | null;
};
export type FavoritesPage = { usuarioId: number; itens: Favorite[] };
const object = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;
const id = (v: unknown): v is number =>
  typeof v === "number" && Number.isSafeInteger(v) && v > 0;
function favorite(v: unknown): v is Favorite {
  return (
    object(v) &&
    id(v.idPrestador) &&
    typeof v.nome === "string" &&
    typeof v.areaAtuacao === "string" &&
    typeof v.criadoEm === "string" &&
    Number.isFinite(Date.parse(v.criadoEm)) &&
    typeof v.disponivel === "boolean" &&
    (v.disponivel
      ? isProfessionalSummary(v.profissional) &&
        v.profissional.idPrestador === v.idPrestador
      : v.profissional === null)
  );
}
export async function favoritesList(): Promise<FavoritesPage> {
  const data = await api("favoritos");
  if (
    !object(data) ||
    !id(data.usuarioId) ||
    !Array.isArray(data.itens) ||
    !data.itens.every(favorite)
  )
    throw Error("Resposta de favoritos inválida.");
  return data as FavoritesPage;
}
export async function saveFavorite(provider: number, saved: boolean) {
  const data = await api(`favoritos/${provider}`, {}, saved ? "PUT" : "DELETE");
  if (
    !object(data) ||
    !id(data.usuarioId) ||
    data.prestadorId !== provider ||
    data.favorito !== saved
  )
    throw Error("Confirmação de favorito inválida. Atualize a lista.");
  return data.usuarioId;
}
