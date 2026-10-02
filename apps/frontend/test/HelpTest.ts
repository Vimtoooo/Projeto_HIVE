import { test } from "node:test";
import assert from "node:assert/strict";
import { helpArticles, searchHelp } from "../src/data/HelpArticles.ts";
test("busca ignora acentos, caixa e espaços e combina palavras", () => {
  assert.deepEqual(searchHelp("  NOTIFICACOES  "), searchHelp("notificações"));
  assert.ok(
    searchHelp("  PAGAMENTO   INTENCAO ").some((a) => a.id === "pagamentos"),
  );
});
test("categoria restringe busca, busca vazia lista e termos ausentes não retornam artigos", () => {
  assert.equal(searchHelp(" ").length, helpArticles.length);
  assert.ok(searchHelp("", "Conta").every((a) => a.category === "Conta"));
  assert.equal(searchHelp("pagamento", "Mensagens").length, 0);
  assert.equal(searchHelp("zzzinexistente").length, 0);
});
