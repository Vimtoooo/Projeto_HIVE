import { test, expect, type Page } from "@playwright/test";
const user = {
  idUsuario: 7,
  nome: "Ana Teste",
  email: "ana@example.invalid",
  tipoUsuario: "CONTRATANTE",
};
const review = {
  idAvaliacao: 1,
  nota: 5,
  comentario: "Excelente montagem!",
  dataAvaliacao: "2026-10-03T12:00:00Z",
};
async function fixture(page: Page) {
  const row = {
    idContratacao: 31,
    dataContratacao: "2026-10-01T12:00:00Z",
    status: "CONCLUIDA",
    valor: 125,
    formaPagamento: "PIX",
    contratante: user,
    prestador: {
      idUsuario: 12,
      nome: "Carlos Lima",
      areaAtuacao: "Marcenaria",
    },
    servico: {
      idServico: 4,
      titulo: "Montagem de estante",
      descricao: "Montagem cuidadosa",
    },
    papel: "cliente",
    acoes: [],
    cancelamentoBloqueado: false,
    avaliacao: null as typeof review | null,
    podeAvaliar: true,
  };
  const state = { row, user, sent: 0, fail: false };
  await page.route("**/api/**", async (r) => {
    const url = new URL(r.request().url());
    switch (url.pathname) {
      case "/api/sessao":
        return r.fulfill({ json: state.user });
      case "/api/conversas":
        return r.fulfill({ json: [] });
      case "/api/notificacoes/resumo":
        return r.fulfill({ json: { usuarioId: 7, naoLidas: 0, ateId: 0 } });
      case "/api/solicitacoes":
        return r.fulfill({
          json: { itens: [row], total: 1, pagina: 1, limite: 20 },
        });
      case "/api/solicitacoes/31":
        return r.fulfill({ json: row });
      case "/api/solicitacoes/31/avaliacao":
        state.sent++;
        expect(r.request().headers()["x-hive-request"]).toBe("1");
        expect(r.request().postDataJSON()).toEqual({
          nota: 5,
          comentario: "Excelente montagem!",
        });
        if (state.fail)
          return r.fulfill({
            status: 503,
            json: { message: "Falha temporária. Tente novamente." },
          });
        row.avaliacao = review;
        row.podeAvaliar = false;
        return r.fulfill({ status: 201, json: row });
      case "/api/profissionais":
        return r.fulfill({
          json: { itens: [], total: 0, pagina: 1, limite: 12 },
        });
      case "/api/profissionais/12":
        return r.fulfill({
          json: {
            idPrestador: 12,
            nome: "Carlos Lima",
            areaAtuacao: "Marcenaria",
            experiencia: "Cinco anos",
            certificacoes: [],
            avaliacao: { quantidade: 6, media: 5 },
            servicos: [{ ...row.servico, precoBase: 125 }],
          },
        });
      case "/api/profissionais/12/avaliacoes": {
        const pagina = Number(url.searchParams.get("pagina"));
        return r.fulfill({
          json: {
            itens: [
              {
                ...review,
                idAvaliacao: pagina,
                autor: pagina === 1 ? "Ana" : "Bruno",
                servico: row.servico.titulo,
              },
            ],
            total: 6,
            pagina,
            limite: 5,
          },
        });
      }
      default:
        return r.fulfill({ status: 404, json: { message: "Não encontrado." } });
    }
  });
  return state;
}
test("cliente confirma avaliação, recupera falha e vê registro após recarregar", async ({
  page,
}) => {
  const state = await fixture(page);
  await page.setViewportSize({ width: 1600, height: 1100 });
  await page.goto("/solicitacoes?pedido=31");
  await expect(
    page.getByRole("button", { name: "Enviar avaliação", exact: true }),
  ).toBeDisabled();
  await page.getByRole("radio", { name: "5 ★", exact: true }).check();
  await page.getByLabel("Comentário (opcional)").fill("Excelente montagem!");
  await page.screenshot({
    path: "test-results/reviews-desktop.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Enviar avaliação", exact: true })
    .click();
  expect(state.sent).toBe(0);
  state.fail = true;
  await page
    .getByRole("button", { name: "Confirmar avaliação", exact: true })
    .click();
  await expect(
    page
      .getByRole("region", { name: "Avaliar serviço", exact: true })
      .getByRole("alert"),
  ).toContainText("Falha temporária");
  state.fail = false;
  await page
    .getByRole("button", { name: "Confirmar avaliação", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Avaliação do serviço", exact: true }),
  ).toContainText("Excelente montagem!");
  await page.reload();
  await expect(
    page.getByRole("region", { name: "Avaliação do serviço", exact: true }),
  ).toContainText("5 de 5");
  await expect(
    page.getByRole("button", { name: "Enviar avaliação", exact: true }),
  ).toHaveCount(0);
  expect(state.sent).toBe(2);
});
test("não oferece avaliação em pedido pendente nem ao prestador", async ({
  page,
}) => {
  const state = await fixture(page);
  state.row.status = "PENDENTE";
  state.row.podeAvaliar = false;
  await page.goto("/solicitacoes?pedido=31");
  await expect(
    page.getByRole("heading", { name: "Montagem de estante" }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Avaliar serviço", exact: true }),
  ).toHaveCount(0);
  state.row.status = "CONCLUIDA";
  state.row.papel = "prestador";
  state.user = { ...user, idUsuario: 12, tipoUsuario: "PRESTADOR" };
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Montagem de estante" }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Avaliar serviço", exact: true }),
  ).toHaveCount(0);
});
test("troca de conta antes de confirmar impede envio", async ({ page }) => {
  const state = await fixture(page);
  await page.goto("/solicitacoes?pedido=31");
  await page.getByRole("radio", { name: "5 ★", exact: true }).check();
  await page
    .getByRole("button", { name: "Enviar avaliação", exact: true })
    .click();
  state.user = { ...user, idUsuario: 99 };
  await page
    .getByRole("button", { name: "Confirmar avaliação", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: "Entrar novamente" }),
  ).toBeVisible();
  expect(state.sent).toBe(0);
});
test("celular: formulário sem transbordamento e avaliações públicas paginadas", async ({
  page,
}) => {
  await fixture(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/solicitacoes?pedido=31");
  await expect(page.getByLabel("Comentário (opcional)")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/reviews-mobile.png",
    fullPage: true,
  });
  await page.goto("/profissionais?profissional=12");
  const panel = page.getByRole("region", { name: "Avaliações dos clientes" });
  await expect(panel).toContainText("Ana");
  await panel.getByRole("button", { name: "Próximas avaliações" }).click();
  await expect(panel).toContainText("Bruno");
  await expect(
    panel.getByRole("button", { name: "Próximas avaliações" }),
  ).toBeDisabled();
  await panel.getByRole("button", { name: "Avaliações anteriores" }).click();
  await expect(panel).toContainText("Ana");
});
