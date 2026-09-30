import { test } from "node:test";
import assert from "node:assert/strict";
import { professionals } from "../src/data/DemoProfessionals.ts";
import {
  filterProfessionals,
  sortProfessionals,
  firstName,
  initials,
} from "../src/lib/HomeCatalog.ts";
import {
  parseViewer,
  parseFavorites,
  favoriteKey,
} from "../src/lib/ViewerStore.ts";
test("busca ignora acentos e combina profissão, termos e favoritos", () => {
  assert.equal(filterProfessionals(professionals, "eletrica", null).length, 2);
  assert.equal(
    filterProfessionals(professionals, "RAFAEL tomadas", "Elétrica")[0]?.id,
    "rafael",
  );
  assert.equal(
    filterProfessionals(professionals, "limpeza", "Elétrica").length,
    0,
  );
  assert.equal(filterProfessionals(professionals, "", null, []).length, 0);
  assert.deepEqual(
    filterProfessionals(professionals, "", null, ["camila"]).map((p) => p.id),
    ["camila"],
  );
});
test("ordena sem alterar a lista fonte e desempata avaliações por quantidade", () => {
  const original = professionals.map((p) => p.id);
  assert.equal(sortProfessionals(professionals, "nearby")[0].id, "rafael");
  assert.equal(sortProfessionals(professionals, "rating")[0].id, "juliana");
  assert.equal(sortProfessionals(professionals, "popular")[0].id, "pedro");
  assert.deepEqual(
    professionals.map((p) => p.id),
    original,
  );
});
test("nome e iniciais suportam espaços e visitante", () => {
  assert.equal(firstName("  Ana Maria Silva "), "Ana");
  assert.equal(initials(" Ana Maria Silva "), "AM");
  assert.equal(firstName(" "), "visitante");
  assert.equal(initials(""), "V");
});
test("dados locais corrompidos não simulam identidade e favoritos são isolados por usuário", () => {
  for (const raw of [
    "",
    "invalid",
    "null",
    "{}",
    '{"id":"1","name":"Ana"}',
    '{"id":1,"name":" "}',
  ])
    assert.equal(parseViewer(raw), null);
  assert.deepEqual(parseViewer('{"id":1,"name":" Ana "}'), {
    id: 1,
    name: "Ana",
  });
  assert.deepEqual(parseFavorites('["rafael",2,"rafael","camila"]'), [
    "rafael",
    "camila",
  ]);
  assert.deepEqual(parseFavorites("invalid"), []);
  assert.notEqual(
    favoriteKey({ id: 1, name: "Ana" }),
    favoriteKey({ id: 2, name: "João" }),
  );
});
