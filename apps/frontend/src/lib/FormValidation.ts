import type { RegistrationForm, RegistrationInput } from "../types/ApiTypes.ts";
export const digits = (value: string): string => value.replace(/\D/g, "");
export function formatCpf(value: string): string {
  return digits(value)
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}
export function formatPhone(value: string): string {
  const valueDigits = digits(value).slice(0, 11);
  return valueDigits
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(valueDigits.length > 10 ? /(\d{5})(\d)/ : /(\d{4})(\d)/, "$1-$2");
}
export function registrationInput(form: RegistrationForm): RegistrationInput {
  return {
    nome: form.nome.trim(),
    cpf: digits(form.cpf),
    telefone: digits(form.telefone),
    endereco: form.endereco.trim(),
    email: form.email.trim(),
    senha: form.senha,
  };
}
export type RegistrationErrors = Partial<
  Record<keyof RegistrationForm, string>
>;
export const validName = (name: string): boolean =>
  /^[\p{L}][\p{L}\p{M}]*(?:[ '’-][\p{L}][\p{L}\p{M}]*)*$/u.test(name.trim());
export function registrationErrors(form: RegistrationForm): RegistrationErrors {
  const data = registrationInput(form);
  const errors: RegistrationErrors = {};
  if (data.nome.length < 3 || data.nome.length > 191 || !validName(data.nome))
    errors.nome =
      "Informe um nome de 3 a 191 caracteres, usando letras, espaços, hífen ou apóstrofo.";
  if (data.cpf.length !== 11) errors.cpf = "Informe um CPF com 11 dígitos.";
  if (data.telefone.length < 10 || data.telefone.length > 11)
    errors.telefone = "Informe o DDD e um telefone com 10 ou 11 dígitos.";
  if (data.endereco.length < 5 || data.endereco.length > 191)
    errors.endereco = "Informe um endereço de 5 a 191 caracteres.";
  if (data.email.length > 191 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
    errors.email = "Informe um e-mail válido com até 191 caracteres.";
  if (data.senha.length < 8 || data.senha.length > 128)
    errors.senha = "A senha deve ter de 8 a 128 caracteres.";
  if (!form.confirmarSenha) errors.confirmarSenha = "Confirme sua senha.";
  else if (form.senha !== form.confirmarSenha)
    errors.confirmarSenha = "As senhas não coincidem.";
  return errors;
}
export function validateRegistration(form: RegistrationForm): string | null {
  return Object.values(registrationErrors(form))[0] ?? null;
}
