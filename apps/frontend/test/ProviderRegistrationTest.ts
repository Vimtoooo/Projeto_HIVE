import { test } from "node:test";
import assert from "node:assert/strict";
import {
  formatCnpj,
  parsePrice,
  providerInput,
  validateProvider,
} from "../src/lib/ProviderRegistration.ts";
import { isCreatedProvider } from "../src/services/ProviderRegistrationApi.ts";
const form = {
  nome: " Ana Teste ",
  email: "ana@example.invalid",
  senha: "Teste!2026",
  confirmarSenha: "Teste!2026",
  cpf: "123.456.789-01",
  telefone: "(11) 99999-8888",
  endereco: "Rua Teste, 10",
  cnpj: "12.345.678/0001-99",
  areaAtuacao: " Montagem ",
  experiencia: "Montagem de móveis",
  certificacoes: " Curso A \n\n Curso B ",
  titulo: "Montagem de mesa",
  descricao: "Montagem completa",
  precoBase: "1.234,56",
};
test("cadastro de prestador normaliza documentos, certificações e serviço sem confirmação de senha", () => {
  assert.equal(validateProvider(form), null);
  const input = providerInput(form);
  assert.equal(input.cnpj, "12345678000199");
  assert.equal(input.cpf, "12345678901");
  assert.equal(input.telefone, "11999998888");
  assert.equal(input.areaAtuacao, "Montagem");
  assert.deepEqual(input.certificacoes, ["Curso A", "Curso B"]);
  assert.equal(input.servico.precoBase, 1234.56);
  assert.equal("confirmarSenha" in input, false);
  assert.equal(formatCnpj("12345678000199"), "12.345.678/0001-99");
});
test("preço brasileiro aceita limites sem truncar ou arredondar entradas inválidas", () => {
  for (const [value, expected] of [
    ["0,01", 0.01],
    ["1.000.000,00", 1000000],
    ["200", 200],
    ["200,5", 200.5],
  ] as const)
    assert.equal(parsePrice(value), expected);
  for (const value of [
    "",
    "0",
    "-1",
    "1,001",
    "200.50",
    "1.00,00",
    "1e3",
    "Infinity",
    "1.000.000,01",
  ])
    assert.equal(parsePrice(value), null, value);
});
test("campos obrigatórios e limites do contrato são respeitados", () => {
  for (const change of [
    { cnpj: "123" },
    { certificacoes: Array(21).fill("Curso").join("\n") },
    { certificacoes: "x".repeat(192) },
    { nome: "x".repeat(192) },
    { senha: "x".repeat(129), confirmarSenha: "x".repeat(129) },
    { areaAtuacao: " " },
    { experiencia: "x".repeat(192) },
    { titulo: "abc" },
    { descricao: "x".repeat(5001) },
    { confirmarSenha: "outra" },
  ])
    assert.ok(validateProvider({ ...form, ...change }));
});
test("resposta de serviço é validada sem aceitar resposta de usuário ou dados inválidos", () => {
  const result = {
    idServico: 1,
    titulo: "Serviço",
    descricao: "Descrição",
    precoBase: "200.50",
    prestador: {
      idPrestador: 2,
      nome: "Ana",
      areaAtuacao: "Montagem",
      avaliacaoMedia: 0,
    },
  };
  assert.equal(isCreatedProvider(result), true);
  for (const value of [
    {},
    { idUsuario: 2 },
    { ...result, precoBase: "" },
    { ...result, prestador: null },
    { ...result, idServico: -1 },
  ])
    assert.equal(isCreatedProvider(value), false);
});

test("certificações vazias geram lista vazia sem erro", () => {
  const empty = { ...form, certificacoes: " \n " };
  assert.deepEqual(providerInput(empty).certificacoes, []);
  assert.equal(validateProvider(empty), null);
});
