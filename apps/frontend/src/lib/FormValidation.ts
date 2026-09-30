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
export function validateRegistration(form: RegistrationForm): string | null {
  const data = registrationInput(form);
  if (data.nome.length < 3) return "Informe seu nome completo.";
  if (data.cpf.length !== 11) return "CPF inválido.";
  if (data.telefone.length < 10 || data.telefone.length > 11)
    return "Telefone inválido.";
  if (data.endereco.length < 5) return "Endereço muito curto.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
    return "Informe um e-mail válido.";
  if (form.senha !== form.confirmarSenha) return "As senhas não coincidem.";
  if (form.senha.length < 8) return "A senha deve ter no mínimo 8 caracteres.";
  return null;
}
