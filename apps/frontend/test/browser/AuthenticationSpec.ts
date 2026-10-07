import { mockHomeApi } from "./ApiFixture";
import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
test.beforeEach(async ({page})=>{await mockHomeApi(page);});
const user = {
  idUsuario: 1,
  nome: "Ana Demonstração",
  email: "ana@example.invalid",
  tipoUsuario: "CONTRATANTE",
};
async function credentials(page: Page) {
  await page.getByLabel("E-mail", { exact: true }).fill(user.email);
  await page.getByLabel("Senha", { exact: true }).fill("Teste!2026");
}
async function registration(page: Page) {
  await page.goto("/cadastro");
  await page.getByLabel("Nome completo").fill(user.nome);
  await page.getByLabel("CPF", { exact: true }).fill("12345678901");
  await page.getByLabel("Telefone", { exact: true }).fill("11999998888");
  await page.getByLabel("Endereço", { exact: true }).fill("Rua de Teste, 10");
  await credentials(page);
  await page.getByLabel("Confirmar senha").fill("Teste!2026");
}
test("URLs antigas redirecionam, imagens carregam e Home local é preservada", async ({
  page,
}) => {
  for (const [old, current] of [
    ["/", "/login"],
    ["/pages/Hive.html", "/login"],
    ["/pages/register.html", "/cadastro"],
    ["/pages/home.html", "/home"],
  ]) {
    await page.goto(old);
    await expect(page).toHaveURL(new RegExp(current + "$"));
  }
  await expect(
    page.getByRole("heading", { name: "Olá, visitante!" }),
  ).toBeVisible();
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Olá!" })).toBeVisible();
  await expect
    .poll(() =>
      page
        .locator("img")
        .evaluateAll(
          (images) =>
            images.length === 3 &&
            images.every(
              (img) =>
                img instanceof HTMLImageElement &&
                img.complete &&
                img.naturalWidth > 0,
            ),
        ),
    )
    .toBe(true);
  await page
    .getByRole("link", { name: "Cadastrar-se", exact: true })
    .first()
    .click();
  await expect(page).toHaveURL(/cadastro$/);
  await page.getByRole("link", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/login$/);
});
test("login aceita Enter e navega para Home somente com resposta válida", async ({
  page,
}) => {
  await page.route("**/api/login", async (route) => {
    expect(route.request().postDataJSON()).toEqual({
      email: user.email,
      senha: "Teste!2026",
    });
    await route.fulfill({ status: 201, json: user });
  });
  await page.goto("/login");
  await credentials(page);
  await page.getByLabel("Senha", { exact: true }).press("Enter");
  await expect(page).toHaveURL(/home$/);
  await expect(page.getByRole("heading", { name: "Olá, Ana!" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Olá, Ana!" })).toBeVisible();
});
test("401 aparece na tela e permite tentar novamente", async ({ page }) => {
  await page.route("**/api/login", (route) =>
    route.fulfill({
      status: 401,
      json: { message: "E-mail ou senha inválidos." },
    }),
  );
  await page.goto("/login");
  await credentials(page);
  await page.getByRole("button", { name: "Logar" }).click();
  await expect(page.locator("form").getByRole("alert")).toHaveText(
    "E-mail ou senha inválidos.",
  );
  await expect(page).toHaveURL(/login$/);
  await expect(page.getByRole("button", { name: "Logar" })).toBeEnabled();
});
test("resposta de sucesso malformada não autentica e falha de rede é tratada", async ({
  page,
}) => {
  await page.route("**/api/login", (route) =>
    route.fulfill({ status: 201, json: {} }),
  );
  await page.goto("/login");
  await credentials(page);
  await page.getByRole("button", { name: "Logar" }).click();
  await expect(page.locator("form").getByRole("alert")).toContainText(
    "resposta inesperada",
  );
  await expect(page).toHaveURL(/login$/);
  await page.route("**/api/login", (route) => route.abort());
  await page.getByRole("button", { name: "Logar" }).click();
  await expect(page.locator("form").getByRole("alert")).toContainText(
    "conectar ao servidor",
  );
});
test("cadastro valida senhas antes da API, aplica máscaras e envia somente contrato público", async ({
  page,
}) => {
  let calls = 0;
  await page.route("**/api/clientes", async (route) => {
    calls++;
    expect(route.request().postDataJSON()).toEqual({
      nome: user.nome,
      email: user.email,
      senha: "Teste!2026",
      cpf: "12345678901",
      telefone: "11999998888",
      endereco: "Rua de Teste, 10",
    });
    await route.fulfill({ status: 201, json: user });
  });
  await registration(page);
  await expect(page.getByLabel("CPF", { exact: true })).toHaveValue(
    "123.456.789-01",
  );
  await expect(page.getByLabel("Telefone", { exact: true })).toHaveValue(
    "(11) 99999-8888",
  );
  await page.getByLabel("Confirmar senha").fill("OutraSenha");
  await page.getByRole("button", { name: "Cadastrar", exact: true }).click();
  await expect(page.locator("form").getByRole("alert")).toContainText(
    "não coincidem",
  );
  expect(calls).toBe(0);
  await page.getByLabel("Confirmar senha").fill("Teste!2026");
  await page.getByRole("button", { name: "Cadastrar", exact: true }).click();
  await expect(page).toHaveURL(/login$/);
  expect(calls).toBe(1);
});
test("cadastro mostra erros do backend em lista e libera o botão", async ({
  page,
}) => {
  await page.route("**/api/clientes", (route) =>
    route.fulfill({
      status: 400,
      json: { message: ["CPF inválido.", "Telefone inválido."] },
    }),
  );
  await registration(page);
  await page.getByRole("button", { name: "Cadastrar", exact: true }).click();
  await expect(page.locator("form").getByRole("alert")).toHaveText(
    "CPF inválido. Telefone inválido.",
  );
  await expect(
    page.getByRole("button", { name: "Cadastrar", exact: true }),
  ).toBeEnabled();
});
