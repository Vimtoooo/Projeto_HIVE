import { test } from "node:test";
import assert from "node:assert/strict";
import {
  formatCpf,
  formatPhone,
  registrationInput,
  validateRegistration,
} from "../src/lib/FormValidation.ts";
import { apiMessage, isPublicUser, login } from "../src/services/ApiClient.ts";
const form = {
  nome: " Ana Demonstração ",
  email: " ana@example.invalid ",
  cpf: "123.456.789-01",
  telefone: "(11) 99999-8888",
  endereco: " Rua de Teste, 10 ",
  senha: "Teste!2026",
  confirmarSenha: "Teste!2026",
};
test("normaliza dados e não envia confirmação de senha", () => {
  assert.equal(validateRegistration(form), null);
  assert.deepEqual(registrationInput(form), {
    nome: "Ana Demonstração",
    email: "ana@example.invalid",
    cpf: "12345678901",
    telefone: "11999998888",
    endereco: "Rua de Teste, 10",
    senha: "Teste!2026",
  });
});
test("máscaras suportam CPF, celular e telefone fixo", () => {
  assert.equal(formatCpf("12345678901999"), "123.456.789-01");
  assert.equal(formatPhone("11999998888"), "(11) 99999-8888");
  assert.equal(formatPhone("1133334444"), "(11) 3333-4444");
});
for (const [field, value] of [
  ["nome", "A"],
  ["cpf", "123"],
  ["telefone", "123"],
  ["endereco", "Rua"],
  ["email", "invalido"],
  ["confirmarSenha", "diferente"],
]) {
  test("rejeita campo inválido: " + field, () =>
    assert.ok(validateRegistration({ ...form, [field]: value })),
  );
}
test("rejeita senha curta mesmo com confirmação igual", () =>
  assert.ok(
    validateRegistration({ ...form, senha: "123", confirmarSenha: "123" }),
  ));
test("valida a resposta em runtime e normaliza erros NestJS", () => {
  assert.equal(
    isPublicUser({
      idUsuario: 1,
      nome: "Ana",
      email: "ana@example.invalid",
      tipoUsuario: "CONTRATANTE",
    }),
    true,
  );
  for (const value of [
    null,
    {},
    { idUsuario: "1" },
    { idUsuario: 1, nome: "Ana", email: "a", tipoUsuario: "INVALIDO" },
  ])
    assert.equal(isPublicUser(value), false);
  assert.equal(
    apiMessage({ message: ["E-mail inválido", "Senha curta", 7] }, "Erro"),
    "E-mail inválido Senha curta",
  );
  assert.equal(apiMessage({ message: {} }, "Erro"), "Erro");
});
test("cliente HTTP rejeita JSON inválido e não confunde erro HTTP com sucesso", async (t) => {
  const mock = t.mock.method(
    globalThis,
    "fetch",
    async () => new Response("<html>erro</html>", { status: 502 }),
  );
  await assert.rejects(
    login({ email: "ana@example.invalid", senha: "Teste!2026" }),
    /Não foi possível concluir/,
  );
  mock.mock.mockImplementation(async () => new Response("{}", { status: 201 }));
  await assert.rejects(
    login({ email: "ana@example.invalid", senha: "Teste!2026" }),
    /resposta inesperada/,
  );
  mock.mock.mockImplementation(async () => {
    throw new TypeError("offline");
  });
  await assert.rejects(
    login({ email: "ana@example.invalid", senha: "Teste!2026" }),
    /conectar ao servidor/,
  );
});
