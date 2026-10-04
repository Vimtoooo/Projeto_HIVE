import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
const user = {
  idUsuario: 7,
  nome: "Ana Teste",
  email: "ana@example.invalid",
  tipoUsuario: "CONTRATANTE",
};
const detail = {
  idPrestador: 12,
  nome: "Carlos Lima",
  areaAtuacao: "Marcenaria",
  experiencia: "Cinco anos",
  certificacoes: ["Curso de montagem"],
  avaliacao: { quantidade: 0, media: null },
  servicos: [
    {
      idServico: 40,
      titulo: "Montagem de estante",
      descricao: "Montagem cuidadosa",
      precoBase: 125.75,
    },
  ],
};
async function fixture(page: Page) {
  const state = {
    anonymous: false,
    unavailable: false,
    failList: false,
    invalid: false,
    role: "CONTRATANTE",
    sent: 0,
  };
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url()),
      path = url.pathname,
      method = route.request().method();
    if (path === "/api/sessao")
      return state.anonymous
        ? route.fulfill({
            status: 401,
            json: { message: "Entre para continuar." },
          })
        : route.fulfill({ json: { ...user, tipoUsuario: state.role } });
    if (path === "/api/notificacoes/resumo")
      return route.fulfill({ json: { usuarioId: 7, naoLidas: 0, ateId: 0 } });
    if (path === "/api/profissionais/12")
      return state.unavailable
        ? route.fulfill({
            status: 404,
            json: { message: "Profissional indisponível." },
          })
        : route.fulfill({
            json: state.invalid ? { ...detail, servicos: null } : detail,
          });
    if (path === "/api/profissionais/12/avaliacoes")
      return route.fulfill({
        json: { itens: [], total: 0, pagina: 1, limite: 5 },
      });
    if (path === "/api/profissionais") {
      if (state.failList)
        return route.fulfill({
          status: 500,
          json: { message: "Falha temporária." },
        });
      const pagina = Number(url.searchParams.get("pagina") || 1),
        noResults = url.searchParams.get("texto") === "inexistente";
      return route.fulfill({
        json: {
          itens: noResults
            ? []
            : [
                {
                  idPrestador: 12,
                  nome: pagina === 1 ? "Carlos Lima" : "Marina Teste",
                  areaAtuacao: "Marcenaria",
                  precoInicial: 125.75,
                  quantidadeServicos: 1,
                  avaliacao: { quantidade: 0, media: null },
                },
              ],
          total: noResults ? 0 : 13,
          pagina,
          limite: 12,
        },
      });
    }
    if (path === "/api/conversas")
      return route.fulfill({
        json:
          method === "POST"
            ? {
                id: 9,
                cliente: user,
                prestador: { idUsuario: 12, nome: "Carlos Lima" },
              }
            : [],
      });
    if (path === "/api/servicos")
      return route.fulfill({ json: { itens: [], total: 0 } });
    if (path === "/api/solicitacoes" && method === "GET")
      return route.fulfill({
        json: { itens: [], total: 0, pagina: 1, limite: 20 },
      });
    if (path === "/api/solicitacoes" && method === "POST") {
      const body = route.request().postDataJSON();
      expect(body.servicoId).toBe(40);
      expect(route.request().headers()["x-hive-request"]).toBe("1");
      state.sent++;
      return route.fulfill({
        json: {
          idContratacao: 31,
          dataContratacao: "2026-10-02T12:00:00Z",
          status: "PENDENTE",
          valor: 125.75,
          formaPagamento: "PIX",
          contratante: user,
          prestador: {
            idUsuario: 12,
            nome: "Carlos Lima",
            areaAtuacao: "Marcenaria",
          },
          servico: detail.servicos[0],
          papel: "cliente",
          acoes: ["CANCELAR"],
          cancelamentoBloqueado: false,
          avaliacao: null,
          podeAvaliar: false,
        },
      });
    }
    return route.fulfill({ status: 404, json: { message: "Não encontrado." } });
  });
  return state;
}
test("catálogo público busca, filtra, pagina e mantém filtros ao voltar", async ({
  page,
}) => {
  await fixture(page);
  await page.goto("/profissionais");
  await expect(
    page.getByRole("heading", { name: "Profissionais", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Nome ou serviço").fill("Carlos");
  await page.getByLabel("Área de atuação", { exact: true }).fill("Marcenaria");
  await page.getByRole("button", { name: "Buscar", exact: true }).click();
  await expect(page).toHaveURL(/texto=Carlos.*areaAtuacao=Marcenaria/);
  await page.getByRole("link", { name: "Próxima", exact: true }).click();
  await expect(page).toHaveURL(/pagina=2/);
  await expect(
    page.getByRole("heading", { name: "Marina Teste" }),
  ).toBeVisible();
  await page.goBack();
  await expect(
    page.getByRole("heading", { name: "Carlos Lima", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Nome ou serviço").fill("inexistente");
  await page.getByRole("button", { name: "Buscar", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Nenhum profissional nesta página" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Limpar filtros" }).click();
  await expect(
    page.getByRole("heading", { name: "Carlos Lima", exact: true }),
  ).toBeVisible();
});
test("detalhes reais no painel, teclado, ausência de avaliações e conversa", async ({
  page,
}) => {
  await fixture(page);
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto("/profissionais");
  await page
    .getByRole("link", { name: "Ver detalhes de Carlos Lima" })
    .press("Enter");
  const panel = page.getByRole("region", { name: "Detalhes do profissional" });
  await expect(panel).toContainText("Sem avaliações");
  await expect(panel).toContainText("Certificações declaradas");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.screenshot({
    path: "test-results/professionals-desktop.png",
    fullPage: true,
  });
  await panel.getByRole("button", { name: "Conversar", exact: true }).click();
  await expect(page).toHaveURL(/mensagens\?conversa=9/);
});
test("pedido preserva serviço escolhido até confirmar o envio", async ({
  page,
}) => {
  const state = await fixture(page);
  await page.goto("/profissionais?profissional=12");
  await page
    .getByRole("button", { name: "Solicitar serviço: Montagem de estante" })
    .click();
  await expect(page).toHaveURL(
    /solicitacoes\?nova=1&profissional=12&servico=40/,
  );
  await expect(
    page.getByRole("heading", { name: "Montagem de estante", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Confirmar solicitação" }).click();
  await expect(page).toHaveURL(/pedido=31/);
  expect(state.sent).toBe(1);
});
test("ações exigem sessão e conta prestador não contrata", async ({ page }) => {
  const state = await fixture(page);
  state.anonymous = true;
  await page.goto("/profissionais?profissional=12");
  await page.getByRole("button", { name: "Conversar", exact: true }).click();
  await expect(
    page.getByRole("link", { name: "Entrar na conta", exact: true }),
  ).toBeVisible();
  state.anonymous = false;
  state.role = "PRESTADOR";
  await page
    .getByRole("button", { name: "Solicitar serviço: Montagem de estante" })
    .click();
  await expect(page.locator("#main-content").getByRole("alert")).toContainText(
    "somente de prestador",
  );
  expect(state.sent).toBe(0);
});
test("falhas recuperáveis e indisponibilidade não exibem ações", async ({
  page,
}) => {
  const state = await fixture(page);
  state.failList = true;
  await page.goto("/profissionais");
  await expect(page.locator("#main-content").getByRole("alert")).toContainText(
    "Falha temporária",
  );
  state.failList = false;
  await page.getByRole("button", { name: "Tentar novamente" }).click();
  await expect(
    page.getByRole("heading", { name: "Carlos Lima", exact: true }),
  ).toBeVisible();
  state.unavailable = true;
  await page.getByRole("link", { name: "Ver detalhes de Carlos Lima" }).click();
  await expect(page.locator("#main-content").getByRole("alert")).toContainText(
    "indisponível",
  );
  await expect(
    page.getByRole("button", { name: "Conversar", exact: true }),
  ).toHaveCount(0);
  state.unavailable = false;
  state.invalid = true;
  await page.getByRole("button", { name: "Tentar novamente" }).click();
  await expect(page.locator("#main-content").getByRole("alert")).toContainText(
    "Resposta de profissional inválida",
  );
  state.invalid = false;
  await page.getByRole("button", { name: "Tentar novamente" }).click();
  await expect(
    page.getByRole("button", { name: "Conversar", exact: true }),
  ).toBeVisible();
});
test("celular alterna detalhes sem transbordamento e link legado redireciona", async ({
  page,
}) => {
  await fixture(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/home?secao=Profissionais");
  await expect(page).toHaveURL(/profissionais$/);
  await page.getByRole("link", { name: "Ver detalhes de Carlos Lima" }).click();
  await expect(
    page.getByRole("region", { name: "Detalhes do profissional" }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Lista de profissionais" }),
  ).toBeHidden();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/professionals-mobile.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: "Voltar à lista" }).click();
  await expect(
    page.getByRole("region", { name: "Lista de profissionais" }),
  ).toBeVisible();
});
