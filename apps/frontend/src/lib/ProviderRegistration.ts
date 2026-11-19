import type { RegistrationForm, RegistrationInput } from "../types/ApiTypes.ts";
import {
  digits,
  registrationInput,
  registrationErrors,
} from "./FormValidation.ts";

export interface ProviderForm extends RegistrationForm {
  cnpj: string;
  areaAtuacao: string;
  experiencia: string;
  certificacoes: string;
  titulo: string;
  descricao: string;
  precoBase: string;
}
export interface ProfessionalInput {
  cnpj: string;
  areaAtuacao: string;
  experiencia: string;
  certificacoes: string[];
  servico: { titulo: string; descricao: string; precoBase: number };
}
export interface ProviderInput extends RegistrationInput, ProfessionalInput {}
export type ProfessionalForm = Pick<
  ProviderForm,
  | "cnpj"
  | "areaAtuacao"
  | "experiencia"
  | "certificacoes"
  | "titulo"
  | "descricao"
  | "precoBase"
>;
export function formatCnpj(value: string): string {
  return digits(value)
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2}\.\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,4})/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}
// Vírgula decimal e agrupamento brasileiro opcional; não arredonda entradas inválidas.
export function parsePrice(value: string): number | null {
  const text = value.trim();
  if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(text)) return null;
  const price = Number(text.replaceAll(".", "").replace(",", "."));
  return Number.isFinite(price) && price >= 0.01 && price <= 1_000_000
    ? price
    : null;
}
export function professionalInput(form: ProfessionalForm): ProfessionalInput {
  return {
    cnpj: digits(form.cnpj),
    areaAtuacao: form.areaAtuacao.trim(),
    experiencia: form.experiencia.trim(),
    certificacoes: form.certificacoes
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean),
    servico: {
      titulo: form.titulo.trim(),
      descricao: form.descricao.trim(),
      precoBase: parsePrice(form.precoBase) ?? NaN,
    },
  };
}
export function providerInput(form: ProviderForm): ProviderInput {
  return { ...registrationInput(form), ...professionalInput(form) };
}
export type ProviderErrors = Partial<Record<keyof ProviderForm, string>>;
export function professionalErrors(form: ProfessionalForm): ProviderErrors {
  const errors: ProviderErrors = {};
  const data = professionalInput(form);
  if (data.cnpj.length !== 14) errors.cnpj = "Informe um CNPJ com 14 dígitos.";
  if (!data.areaAtuacao.length || data.areaAtuacao.length > 191)
    errors.areaAtuacao = "Informe a área de atuação em até 191 caracteres.";
  if (!data.experiencia.length || data.experiencia.length > 191)
    errors.experiencia = "Descreva sua experiência em até 191 caracteres.";
  if (
    data.certificacoes.length > 20 ||
    data.certificacoes.some((s) => s.length > 191)
  )
    errors.certificacoes =
      "Informe até 20 certificações, uma por linha, com até 191 caracteres cada.";
  if (data.servico.titulo.length < 5 || data.servico.titulo.length > 191)
    errors.titulo = "O título deve ter de 5 a 191 caracteres.";
  if (!data.servico.descricao.length || data.servico.descricao.length > 5000)
    errors.descricao = "Descreva o serviço em até 5000 caracteres.";
  if (parsePrice(form.precoBase) === null)
    errors.precoBase =
      "Informe de R$ 0,01 a R$ 1.000.000,00, com vírgula para centavos e até duas casas decimais.";
  return errors;
}
export function providerErrors(form: ProviderForm): ProviderErrors {
  return { ...registrationErrors(form), ...professionalErrors(form) };
}
export function validateProvider(form: ProviderForm): string | null {
  return Object.values(providerErrors(form))[0] ?? null;
}
