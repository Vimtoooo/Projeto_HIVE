import { test, expect } from "@playwright/test";
test.beforeEach(async ({ page }) => {
  await page.route("**/api/**", (route) =>
    route.fulfill({ status: 401, json: { message: "Entre na conta" } }),
  );
});
test("ajuda pública, pesquisa sem acentos, categorias e recuperação sem resultados", async ({
  page,
}) => {
  await page.goto("/ajuda");
  await expect(
    page.getByRole("heading", { name: "Central de Ajuda", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Notificações", exact: true })
    .last()
    .click();
  await expect(page.locator("details")).toHaveCount(1);
  await page.getByLabel("Qual é a sua dúvida?").fill("  NOTIFICACOES ");
  await expect(page.locator("details")).toHaveCount(1);
  await page.getByLabel("Qual é a sua dúvida?").fill("zzzinexistente");
  await expect(
    page.getByRole("heading", { name: "Nenhum artigo encontrado" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Limpar busca e filtros" }).click();
  await expect(page.locator("details")).toHaveCount(10);
});
test("artigos por teclado, limites de pagamento e atalhos válidos", async ({
  page,
}) => {
  await page.goto("/ajuda");
  await page.getByLabel("Qual é a sua dúvida?").fill("pagamentos");
  await expect(page.locator("details")).toHaveCount(2);
  const article = page
    .locator("summary")
    .filter({ hasText: "O HIVE já realiza pagamentos?" });
  await article.focus();
  await page.keyboard.press("Enter");
  await expect(
    page
      .locator("#main-content")
      .getByText("Não há processamento de pagamentos no aplicativo.", {
        exact: false,
      }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Ver detalhes dos pedidos" }).click();
  await expect(page).toHaveURL(/\/solicitacoes$/);
});
test("navegação desktop e celular, sem rolagem horizontal", async ({
  page,
}) => {
  await page.goto("/perfil");
  await page
    .getByRole("button", { name: "Central de ajuda", exact: true })
    .click();
  await expect(page).toHaveURL(/\/ajuda$/);
  await expect(
    page.getByRole("button", { name: "Central de ajuda", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await page.screenshot({
    path: "test-results/help-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByLabel("Qual é a sua dúvida?").fill("favoritos");
  await page
    .locator("summary")
    .filter({ hasText: "Onde ficam meus favoritos?" })
    .click();
  await expect(
    page.getByRole("link", { name: "Abrir favoritos da conta" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/help-mobile.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: "Abrir favoritos da conta" }).click();
  await expect(page).toHaveURL(/favoritos$/);
  await page.getByRole("button", { name: "Abrir navegação" }).click();
  await page
    .getByRole("button", { name: "Central de ajuda", exact: true })
    .last()
    .click();
  await expect(page).toHaveURL(/\/ajuda$/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
