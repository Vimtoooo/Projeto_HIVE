import type {
  LoginInput,
  PublicUser,
  RegistrationInput,
} from "../types/ApiTypes.ts";
export function isPublicUser(value: unknown): value is PublicUser {
  if (typeof value !== "object" || value === null) return false;
  return (
    "idUsuario" in value &&
    typeof value.idUsuario === "number" &&
    Number.isInteger(value.idUsuario) &&
    value.idUsuario > 0 &&
    "nome" in value &&
    typeof value.nome === "string" &&
    "email" in value &&
    typeof value.email === "string" &&
    "tipoUsuario" in value &&
    (value.tipoUsuario === "CONTRATANTE" || value.tipoUsuario === "PRESTADOR")
  );
}
export function apiMessage(value: unknown, fallback: string): string {
  if (typeof value !== "object" || value === null || !("message" in value))
    return fallback;
  const message: unknown = value.message;
  if (typeof message === "string" && message.trim()) return message;
  if (Array.isArray(message)) {
    const messages = message.filter(
      (item: unknown): item is string =>
        typeof item === "string" && item.trim().length > 0,
    );
    if (messages.length) return messages.join(" ");
  }
  return fallback;
}
async function postUser(
  route: string,
  input: LoginInput | RegistrationInput,
): Promise<PublicUser> {
  let response: Response;
  try {
    response = await fetch("/api/" + route, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new Error("Não foi possível conectar ao servidor. Tente novamente.");
  }
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok)
    throw new Error(
      apiMessage(
        data,
        "Não foi possível concluir a solicitação. Tente novamente.",
      ),
    );
  if (!isPublicUser(data))
    throw new Error("O servidor retornou uma resposta inesperada.");
  return data;
}
export const login = (input: LoginInput): Promise<PublicUser> =>
  postUser("login", input);
export const register = (input: RegistrationInput): Promise<PublicUser> =>
  postUser("clientes", input);
