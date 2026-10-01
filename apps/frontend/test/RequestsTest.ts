import { test } from "node:test";
import assert from "node:assert/strict";
import { requestMoney } from "../src/lib/RequestFormatting.ts";
test("valores de pedidos preservam os centavos e mostram duas casas", () => {
  assert.match(requestMoney(125.75), /125,75/);
  assert.match(requestMoney(125), /125,00/);
  assert.match(requestMoney(0.01), /0,01/);
});
