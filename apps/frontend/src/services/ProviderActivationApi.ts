import type { ProfessionalInput } from "../lib/ProviderRegistration";
import { api, ApiError } from "./MessagingApi";
import { isCreatedProvider } from "./ProviderRegistrationApi";

export async function activateProvider(
  input: ProfessionalInput,
): Promise<void> {
  const result = await api("perfil/prestador", input);
  if (!isCreatedProvider(result))
    throw new Error("Não foi possível confirmar a resposta de ativação.");
}
export function activationMayHaveSucceeded(error: unknown): boolean {
  return (
    !(error instanceof ApiError) ||
    (error.status === 409 && error.code !== "CNPJ_DUPLICADO") ||
    error.status >= 500
  );
}
