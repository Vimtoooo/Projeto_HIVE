import { mockHomeApi } from "./ApiFixture";
import { test, expect } from "@playwright/test";
test.beforeEach(async ({ page }) => {
  await mockHomeApi(page);
});
const viewer = { id: 7, name: "João Martins" };
test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
});
test("home personalizada, três seções, distâncias ilustrativas e captura desktop", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(
    (value) => sessionStorage.setItem("hive:viewer", JSON.stringify(value)),
    viewer,
  );
  await page.goto("/home");
  await expect(page.getByRole("heading", { name: "Olá, João!" })).toBeVisible();
  for (const name of ["Perto de você", "Mais avaliados", "Mais populares"]) {
    await expect(
      page.getByRole("heading", { name, exact: true }),
    ).toBeVisible();
  }
  await expect(page.getByText("Região ilustrativa")).toBeVisible();
  await expect(page.locator("article")).toHaveCount(9);
  await page.screenshot({
    path: "test-results/home-desktop.png",
    fullPage: true,
    animations: "disabled",
  });
  expect(errors).toEqual([]);
});
test("busca por profissão sem acentos, filtro combinado e vazio recuperável", async ({
  page,
}) => {
  await page.goto("/home");
  await page
    .getByRole("textbox", { name: "Buscar profissionais ou serviços" })
    .fill("eletrica");
  await page.getByRole("button", { name: "Buscar", exact: true }).click();
  await expect(
    page.getByText("2 profissionais encontrados para “eletrica”"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Limpeza", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Nenhum profissional encontrado" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Limpar filtros" }).click();
  await expect(page.locator("article")).toHaveCount(9);
  await page.getByRole("button", { name: "Todas as categorias" }).click();
  await page.getByRole("button", { name: "Aulas", exact: true }).click();
  await expect(
    page.getByText("1 profissional encontrado · Aulas"),
  ).toBeVisible();
});
test("favoritos persistem ao recarregar, detalhes abrem e Escape restaura o foco", async ({
  page,
}) => {
  await page.goto("/home");
  const save = page
    .getByRole("button", { name: "Salvar favorito: Rafael Martins" })
    .first();
  await save.click();
  await page.reload();
  const details = page
    .getByRole("button", { name: "Ver detalhes de Rafael Martins" })
    .first();
  await details.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByRole("dialog").getByText("Perfil fictício"),
  ).toBeVisible();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("button", { name: "Remover dos favoritos" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(details).toBeFocused();
  await page
    .getByRole("button", { name: "Ver favoritos demonstrativos" })
    .click();
  await expect(
    page.getByText(
      "1 profissional encontrado · Favoritos demonstrativos (neste navegador)",
    ),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Remover dos favoritos: Rafael Martins" })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "Seus favoritos começam aqui" }),
  ).toBeVisible();
});
test("ver todos expande a seção e ajuda abre seu painel", async ({ page }) => {
  await page.goto("/home");
  await page.getByRole("button", { name: "Ver todos: Perto de você" }).click();
  await expect(page.locator("article")).toHaveCount(15);
  await page.getByRole("button", { name: "Ver menos: Perto de você" }).click();
  await expect(page.locator("article")).toHaveCount(9);
  await page.getByRole("button", { name: "Central de ajuda" }).click();
  await expect(page).toHaveURL(/ajuda$/);
  await expect(
    page.getByRole("heading", { name: "Central de Ajuda", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
test("celular tem menu funcional, sem transbordamento horizontal e captura", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/home");
  await page.getByRole("button", { name: "Abrir navegação" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /Favoritos/ })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Seus profissionais favoritos ficam aqui" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Abrir navegação" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Início", exact: true }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("heading", { name: "Olá, visitante!" }).click();
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.screenshot({
    path: "test-results/home-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.setViewportSize({ width: 320, height: 740 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test("sair limpa a identificação e volta ao login", async ({ page }) => {
  await page.goto("/login");
  await page.evaluate((value) => {
    sessionStorage.setItem("hive:viewer", JSON.stringify(value));
    sessionStorage.setItem("hive:favorites:7", '["rafael"]');
  }, viewer);
  await page.goto("/home");
  await page
    .getByRole("button", { name: "Sair da conta", exact: true })
    .click();
  await expect(page).toHaveURL(/login$/);
  expect(
    await page.evaluate(() => sessionStorage.getItem("hive:viewer")),
  ).toBeNull();
  expect(
    await page.evaluate(() => sessionStorage.getItem("hive:favorites:7")),
  ).toBeNull();
  await page.goto("/home");
  await expect(
    page.getByRole("heading", { name: "Olá, visitante!" }),
  ).toBeVisible();
});
test("storage inválido permite explorar como visitante", async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem("hive:viewer", "invalid");
    sessionStorage.setItem("hive:favorites:guest", "invalid");
  });
  await page.goto("/home");
  await expect(
    page.getByRole("heading", { name: "Olá, visitante!" }),
  ).toBeVisible();
  await expect(page.locator("article")).toHaveCount(9);
});

test("login com armazenamento bloqueado mantém nome em memória", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new Error("Storage bloqueado");
    };
    Storage.prototype.setItem = () => {
      throw new Error("Storage bloqueado");
    };
  });
  await page.route("**/api/login", (route) =>
    route.fulfill({
      status: 201,
      json: {
        idUsuario: 9,
        nome: "Marina Teste",
        email: "marina@example.invalid",
        tipoUsuario: "CONTRATANTE",
      },
    }),
  );
  await page.goto("/login");
  await page
    .getByLabel("E-mail", { exact: true })
    .fill("marina@example.invalid");
  await page.getByLabel("Senha", { exact: true }).fill("Teste!2026");
  await page.getByRole("button", { name: "Logar" }).click();
  await expect(
    page.getByRole("heading", { name: "Olá, Marina!" }),
  ).toBeVisible();
});
