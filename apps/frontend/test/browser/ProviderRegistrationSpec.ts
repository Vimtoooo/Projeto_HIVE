import { test, expect, type Page } from "@playwright/test";
test.beforeEach(async ({ page }) => {
  await page.route("**/api/sessao", (r) =>
    r.fulfill({ status: 401, json: { message: "Entre novamente." } }),
  );
});
const result = {
  idServico: 10,
  titulo: "Montagem de mesa",
  descricao: "Montagem completa",
  precoBase: "1234.56",
  prestador: {
    idPrestador: 20,
    nome: "Ana Teste",
    areaAtuacao: "Montagem",
    avaliacaoMedia: 0,
  },
};
async function fill(page: Page) {
  await page.goto("/cadastro/prestador");
  for (const [name, value] of Object.entries({
    nome: "Ana Teste",
    cpf: "12345678901",
    telefone: "11999998888",
    endereco: "Rua Teste, 10",
    email: "ana@example.invalid",
    senha: "Teste!2026",
    confirmarSenha: "Teste!2026",
    cnpj: "12345678000199",
    areaAtuacao: "Montagem",
    experiencia: "Montagem de móveis",
    certificacoes: "Curso A\nCurso B",
    titulo: "Montagem de mesa",
    descricao: "Montagem completa",
    precoBase: "1.234,56",
  }))
    await page.locator(`[name="${name}"]`).fill(value);
}
test("acesso pelo login e cadastro de cliente", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("link", { name: "Sou prestador" }).click();
  await expect(page).toHaveURL(/cadastro\/prestador$/);
  await page.getByRole("link", { name: "Cadastrar como cliente" }).click();
  await page
    .getByRole("link", { name: "Quero me cadastrar como prestador" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Cadastro de prestador" }),
  ).toBeVisible();
});
test("valida, envia contrato normalizado uma vez e redireciona ao login", async ({
  page,
}) => {
  let calls = 0;
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/prestadores", async (route) => {
    calls++;
    expect(route.request().postDataJSON()).toEqual({
      nome: "Ana Teste",
      cpf: "12345678901",
      telefone: "11999998888",
      endereco: "Rua Teste, 10",
      email: "ana@example.invalid",
      senha: "Teste!2026",
      cnpj: "12345678000199",
      areaAtuacao: "Montagem",
      experiencia: "Montagem de móveis",
      certificacoes: ["Curso A", "Curso B"],
      servico: {
        titulo: "Montagem de mesa",
        descricao: "Montagem completa",
        precoBase: 1234.56,
      },
    });
    await gate;
    await route.fulfill({ status: 201, json: result });
  });
  await fill(page);
  await expect(page.getByLabel("CNPJ", { exact: true })).toHaveValue(
    "12.345.678/0001-99",
  );
  await page.getByLabel("Confirmar senha").fill("OutraSenha");
  await page.getByRole("button", { name: "Cadastrar prestador" }).click();
  await expect(page.locator("#confirmarSenha-error")).toContainText(
    "não coincidem",
  );
  expect(calls).toBe(0);
  await page.getByLabel("Confirmar senha").fill("Teste!2026");
  await page.getByLabel("Preço base (R$)").press("Enter");
  await expect(
    page.getByRole("button", { name: "Cadastrando..." }),
  ).toBeDisabled();
  await page.locator("form").evaluate((form: HTMLFormElement) => {
    form.requestSubmit();
  });
  await expect.poll(() => calls).toBe(1);
  release();
  await expect(page).toHaveURL(/login$/);
  expect(calls).toBe(1);
});
test("falhas preservam campos e permitem nova tentativa", async ({ page }) => {
  await fill(page);
  for (const [status, message] of [
    [400, "não aceitou"],
    [409, "e-mail, CPF ou CNPJ"],
    [503, "mais tarde"],
    [201, "resposta inesperada"],
  ] as const) {
    await page.route("**/api/prestadores", (route) =>
      route.fulfill({ status, json: {} }),
    );
    await page.getByRole("button", { name: "Cadastrar prestador" }).click();
    await expect(page.locator("form").getByRole("alert")).toContainText(
      message,
    );
    await expect(page.locator("form").getByRole("alert")).toBeFocused();
    await expect(page.getByLabel("Nome completo")).toHaveValue("Ana Teste");
    await expect(
      page.getByLabel("Certificações (opcional)", { exact: true }),
    ).toHaveValue("Curso A\nCurso B");
  }
  await page.route("**/api/prestadores", (route) => route.abort());
  await page.getByRole("button", { name: "Cadastrar prestador" }).click();
  await expect(page.locator("form").getByRole("alert")).toContainText(
    "conectar ao servidor",
  );
  await page.route("**/api/prestadores", (route) =>
    route.fulfill({ status: 201, json: result }),
  );
  await page.getByRole("button", { name: "Cadastrar prestador" }).click();
  await expect(page).toHaveURL(/login$/);
});
test("layout desktop e celular, campos acessíveis por teclado", async ({
  page,
}) => {
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await fill(page);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.getByLabel("Nome completo").focus();
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("CPF", { exact: true })).toBeFocused();
    await page.screenshot({
      path: `test-results/provider-registration-${width}.png`,
      fullPage: true,
      animations: "disabled",
    });
  }
});
