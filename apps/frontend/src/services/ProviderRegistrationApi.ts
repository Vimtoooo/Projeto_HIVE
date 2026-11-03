import type { ProviderInput } from "../lib/ProviderRegistration.ts";

const object = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;
const id = (v: unknown) =>
  typeof v === "number" && Number.isInteger(v) && v > 0;
const money = (v: unknown) =>
  (typeof v === "number" ||
    (typeof v === "string" && /^\d+(\.\d+)?$/.test(v))) &&
  Number.isFinite(Number(v)) &&
  Number(v) > 0;
export function isCreatedProvider(v: unknown): boolean {
  return (
    object(v) &&
    id(v.idServico) &&
    typeof v.titulo === "string" &&
    typeof v.descricao === "string" &&
    money(v.precoBase) &&
    object(v.prestador) &&
    id(v.prestador.idPrestador) &&
    typeof v.prestador.nome === "string" &&
    typeof v.prestador.areaAtuacao === "string" &&
    typeof v.prestador.avaliacaoMedia === "number" &&
    Number.isFinite(v.prestador.avaliacaoMedia) &&
    v.prestador.avaliacaoMedia >= 0 &&
    v.prestador.avaliacaoMedia <= 5
  );
}
export async function registerProvider(input: ProviderInput): Promise<void> {
  let response: Response;
  try {
    response = await fetch("/api/prestadores", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Hive-Request": "1" },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw Error(
      "Não foi possível conectar ao servidor. Seus dados foram mantidos; tente novamente.",
    );
  }
  if (response.status === 409)
    throw Error(
      "Já existe uma conta com este e-mail, CPF ou CNPJ. Confira os dados ou entre na sua conta.",
    );
  if (response.status === 400)
    throw Error(
      "O servidor não aceitou os dados. Confira os campos e os limites informados antes de tentar novamente.",
    );
  if (!response.ok)
    throw Error(
      "Não foi possível cadastrar agora. Seus dados foram mantidos; tente novamente mais tarde.",
    );
  const data: unknown = await response.json().catch(() => null);
  if (!isCreatedProvider(data))
    throw Error(
      "O servidor retornou uma resposta inesperada. O cadastro pode ter sido criado; tente entrar antes de reenviar.",
    );
}
