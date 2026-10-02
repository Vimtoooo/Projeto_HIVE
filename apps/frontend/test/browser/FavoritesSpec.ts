import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
const professional = {
  idPrestador: 12,
  nome: "Carlos Lima",
  areaAtuacao: "Marcenaria",
  precoInicial: 125.75,
  quantidadeServicos: 1,
  avaliacao: { quantidade: 0, media: null },
};
async function fixture(page: Page) {
  const state = {
    saved: false,
    fail: false,
    anonymous: false,
    owner: 7,
    available: true,
    writes: 0,
  };
  await page.route("**/api/**", async (r) => {
    const path = new URL(r.request().url()).pathname;
    if (path === "/api/sessao")
      return r.fulfill(
        state.anonymous
          ? { status: 401, json: { message: "Entre novamente." } }
          : {
              json: {
                idUsuario: state.owner,
                nome: "Ana",
                email: "ana@example.invalid",
                tipoUsuario: "CONTRATANTE",
              },
            },
      );
    if (path === "/api/notificacoes/resumo")
      return r.fulfill({
        json: { usuarioId: state.owner, naoLidas: 0, ateId: 0 },
      });
    if (path === "/api/favoritos")
      return r.fulfill(
        state.anonymous
          ? { status: 401, json: { message: "Entre novamente." } }
          : {
              json: {
                usuarioId: state.owner,
                itens: state.saved
                  ? [
                      {
                        idPrestador: 12,
                        nome: "Carlos Lima",
                        areaAtuacao: "Marcenaria",
                        criadoEm: "2026-10-02T12:00:00Z",
                        disponivel: state.available,
                        profissional: state.available ? professional : null,
                      },
                    ]
                  : [],
              },
            },
      );
    if (path === "/api/favoritos/12") {
      expect(r.request().headers()["x-hive-request"]).toBe("1");
      state.writes++;
      if (state.fail)
        return r.fulfill({
          status: 500,
          json: { message: "Falha ao gravar." },
        });
      state.saved = r.request().method() === "PUT";
      return r.fulfill({
        json: {
          usuarioId: state.owner,
          prestadorId: 12,
          favorito: state.saved,
        },
      });
    }
    if (path === "/api/profissionais")
      return r.fulfill({
        json: { itens: [professional], total: 1, pagina: 1, limite: 12 },
      });
    if (path === "/api/profissionais/12")
      return r.fulfill({
        json: {
          ...professional,
          experiencia: "Cinco anos",
          certificacoes: [],
          servicos: [
            {
              idServico: 40,
              titulo: "Montagem",
              descricao: "Serviço",
              precoBase: 125.75,
            },
          ],
        },
      });
    if (path === "/api/servicos")
      return r.fulfill({
        json: {
          itens: [
            {
              idServico: 40,
              titulo: "Montagem",
              descricao: "Serviço",
              precoBase: 125.75,
              prestador: {
                idPrestador: 12,
                nome: "Carlos Lima",
                areaAtuacao: "Marcenaria",
              },
            },
          ],
          total: 1,
          pagina: 1,
          limite: 20,
        },
      });
    if (path === "/api/contratacoes/anteriores") return r.fulfill({ json: [] });
    return r.fulfill({ status: 404, json: { message: "Não encontrado" } });
  });
  return state;
}
test("favorita no catálogo, persiste ao recarregar e remove na página própria", async ({
  page,
}) => {
  const state = await fixture(page);
  await page.goto("/profissionais");
  await page
    .getByRole("button", { name: "Favoritar: Carlos Lima", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Remover dos favoritos: Carlos Lima" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Remover dos favoritos: Carlos Lima" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Favoritos", exact: true }).click();
  await expect(page).toHaveURL(/favoritos$/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("link", { name: "Ver detalhes de Carlos Lima" }).click();
  await expect(
    page.getByRole("region", { name: "Detalhes do profissional" }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/favorites-desktop.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Remover dos favoritos: Carlos Lima" })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Seus profissionais favoritos ficam aqui",
    }),
  ).toBeVisible();
  expect(state.saved).toBe(false);
});
test("falha preserva favorito, indisponível continua removível e celular não transborda", async ({
  page,
}) => {
  const state = await fixture(page);
  state.saved = true;
  state.available = false;
  state.fail = true;
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/favoritos");
  await expect(
    page.getByText("Indisponível no momento", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Ver detalhes de Carlos Lima" }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Remover dos favoritos: Carlos Lima" })
    .click();
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "Falha ao gravar",
  );
  await expect(
    page.getByRole("button", { name: "Remover dos favoritos: Carlos Lima" }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/favorites-mobile.png",
    fullPage: true,
  });
  state.fail = false;
  await page
    .getByRole("button", { name: "Remover dos favoritos: Carlos Lima" })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Seus profissionais favoritos ficam aqui",
    }),
  ).toBeVisible();
});
test("sessão expirada limpa a lista e troca de conta não reaproveita favoritos", async ({
  page,
}) => {
  const state = await fixture(page);
  state.saved = true;
  await page.goto("/favoritos");
  await expect(
    page.getByRole("heading", { name: "Carlos Lima", exact: true }),
  ).toBeVisible();
  state.anonymous = true;
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(
    page.getByRole("heading", { name: "Entre para ver seus favoritos" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Carlos Lima", exact: true }),
  ).toHaveCount(0);
  state.anonymous = false;
  state.owner = 8;
  state.saved = false;
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(
    page.getByRole("heading", {
      name: "Seus profissionais favoritos ficam aqui",
    }),
  ).toBeVisible();
  expect(state.writes).toBe(0);
});
test("visitante não grava e favoritos demonstrativos não são importados", async ({
  page,
}) => {
  const state = await fixture(page);
  state.anonymous = true;
  await page.addInitScript(() =>
    sessionStorage.setItem(
      "hive:favorites:guest",
      JSON.stringify(["rafael", "12"]),
    ),
  );
  await page.goto("/profissionais");
  await page
    .getByRole("button", { name: "Favoritar: Carlos Lima", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: "Entrar para favoritar" }),
  ).toBeVisible();
  expect(state.writes).toBe(0);
});
test("Home oferece favorito nos profissionais reais", async ({ page }) => {
  const state = await fixture(page);
  await page.goto("/home");
  await page
    .getByRole("button", { name: "Favoritar: Carlos Lima", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Remover dos favoritos: Carlos Lima" }),
  ).toBeVisible();
  expect(state.saved).toBe(true);
});
