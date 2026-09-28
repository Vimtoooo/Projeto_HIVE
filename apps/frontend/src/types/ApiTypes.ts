export interface LoginInput {
  email: string;
  senha: string;
}
export interface RegistrationInput extends LoginInput {
  nome: string;
  cpf: string;
  telefone: string;
  endereco: string;
}
export interface RegistrationForm extends RegistrationInput {
  confirmarSenha: string;
}
export interface PublicUser {
  idUsuario: number;
  nome: string;
  email: string;
  tipoUsuario: "CONTRATANTE" | "PRESTADOR";
}
