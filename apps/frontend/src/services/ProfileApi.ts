import { api } from "./MessagingApi";
import { isPublicUser } from "./ApiClient";
import type { PublicUser } from "../types/ApiTypes";
export interface Profile extends PublicUser {
  telefone: string;
  endereco: string;
  cpfMascarado: string;
  dataCadastro: string;
}
export type ProfileInput = Pick<Profile, "nome" | "telefone" | "endereco">;
function parse(value: unknown): Profile {
  if (
    !isPublicUser(value) ||
    !("telefone" in value) ||
    typeof value.telefone !== "string" ||
    !("endereco" in value) ||
    typeof value.endereco !== "string" ||
    !("cpfMascarado" in value) ||
    typeof value.cpfMascarado !== "string" ||
    !/^\*{3}\.\*{3}\.\d{3}-\*{2}$/.test(value.cpfMascarado) ||
    !("dataCadastro" in value) ||
    typeof value.dataCadastro !== "string" ||
    !Number.isFinite(Date.parse(value.dataCadastro))
  )
    throw Error("Resposta de perfil inválida. Tente novamente.");
  return value as Profile;
}
export async function getProfile() {
  return parse(await api("perfil"));
}
export async function saveProfile(input: ProfileInput) {
  return parse(await api("perfil", input, "PATCH"));
}
