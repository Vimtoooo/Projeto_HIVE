import { test, expect } from "@playwright/test";
const user = {
  idUsuario: 7,
  nome: "Ana Teste",
  email: "ana@example.invalid",
  tipoUsuario: "CONTRATANTE",
};
const base = {
  idContratacao: 31,
  dataContratacao: "2026-10-01T12:00:00Z",
  status: "PENDENTE",
  valor: 125.75,
  formaPagamento: "PIX",
  contratante: { idUsuario: 7, nome: "Ana Teste" },
  prestador: { idUsuario: 12, nome: "Carlos Lima", areaAtuacao: "Marcenaria" },
  servico: {
    idServico: 4,
    titulo: "Montagem de estante",
    descricao: "Montagem e ajuste de uma estante de madeira.",
  },
  papel: "cliente",
  acoes: ["CANCELAR"],
  cancelamentoBloqueado: false,
  avaliacao: null,
  podeAvaliar: false,
};
test.beforeEach(async ({ page }) => {
  await page.route("**/api/notificacoes/resumo", (r) =>
    r.fulfill({ json: { usuarioId: 7, naoLidas: 0, ateId: 0 } }),
  );
  await page.route("**/api/conversas", (r) => r.fulfill({ json: [] }));
  await page.route("**/api/sessao", (r) => r.fulfill({ json: user }));
  await page.route("**/api/solicitacoes?*", (r) =>
    r.fulfill({ json: { itens: [base], total: 1, pagina: 1, limite: 20 } }),
  );
  await page.route("**/api/solicitacoes/31", (r) => r.fulfill({ json: base }));
  await page.route("**/api/servicos?*", (r) =>
    r.fulfill({
      json: {
        itens: [
          {
            idServico: 4,
            titulo: base.servico.titulo,
            descricao: base.servico.descricao,
            precoBase: 125.75,
            prestador: { idPrestador: 12, nome: "Carlos Lima" },
          },
        ],
        total: 1,
      },
    }),
  );
});
test("lista abre detalhes sem modal, filtra e conversa; desktop", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto("/solicitacoes");
  await expect(
    page.getByRole("button", { name: "Minhas solicitações", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await page
    .getByRole("region", { name: "Lista de solicitações" })
    .getByRole("button", { name: /Montagem de estante/ })
    .click();
  await expect(page).toHaveURL(/pedido=31/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Montagem de estante", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Detalhes da solicitação" }),
  ).toContainText("125,75");
  await page.screenshot({
    path: "test-results/requests-desktop.png",
    fullPage: true,
  });
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Cancelar pedido", exact: true }),
  ).toBeVisible();
  await page.route("**/api/solicitacoes/31/conversa", (r) =>
    r.fulfill({ json: { id: 9 } }),
  );
  await page.getByRole("button", { name: "Conversar", exact: true }).click();
  await expect(page).toHaveURL(/mensagens\?conversa=9/);
  await page.goto("/solicitacoes");
  await page.getByRole("button", { name: "Concluída", exact: true }).click();
  await expect(page).toHaveURL(/status=CONCLUIDA/);
});
test("nova solicitação preserva a chave após falha e envia apenas o contrato permitido", async ({
  page,
}) => {
  let fails = true;
  const keys: string[] = [];
  await page.route("**/api/solicitacoes", async (r) => {
    const data = r.request().postDataJSON() as {
      chave: string;
      servicoId: number;
      formaPagamento: string;
    };
    keys.push(data.chave);
    expect(Object.keys(data).sort()).toEqual([
      "chave",
      "formaPagamento",
      "servicoId",
    ]);
    expect(data.servicoId).toBe(4);
    expect(r.request().headers()["x-hive-request"]).toBe("1");
    if (fails) {
      fails = false;
      await r.fulfill({ status: 503, json: { message: "Tente novamente." } });
    } else await r.fulfill({ status: 201, json: base });
  });
  await page.goto("/solicitacoes?nova=1");
  await page.getByRole("button", { name: /Montagem de estante/ }).click();
  await page
    .getByRole("button", { name: "Confirmar solicitação", exact: true })
    .click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "Tente novamente",
  );
  await page
    .getByRole("button", { name: "Confirmar solicitação", exact: true })
    .click();
  await expect(page).toHaveURL(/pedido=31/);
  expect(keys[0]).toBe(keys[1]);
});
test("prestador aceita e conclui com confirmação dentro do painel", async ({
  page,
}) => {
  const row = { ...base, papel: "prestador", acoes: ["ACEITAR", "RECUSAR"] };
  await page.route("**/api/sessao", (r) =>
    r.fulfill({
      json: {
        ...user,
        idUsuario: 12,
        nome: "Carlos Lima",
        tipoUsuario: "PRESTADOR",
      },
    }),
  );
  await page.route("**/api/solicitacoes/31", (r) => r.fulfill({ json: row }));
  await page.route("**/api/solicitacoes/31/acao", (r) => {
    const { acao } = r.request().postDataJSON() as { acao: string };
    row.status = acao === "ACEITAR" ? "EM_ANDAMENTO" : "CONCLUIDA";
    row.acoes = acao === "ACEITAR" ? ["CONCLUIR", "CANCELAR"] : [];
    return r.fulfill({ json: row });
  });
  await page.goto("/solicitacoes?papel=prestador&pedido=31");
  await page
    .getByRole("button", { name: "Aceitar pedido", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirmar: Aceitar pedido", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Concluir serviço", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirmar: Concluir serviço", exact: true })
    .click();
  await expect(page.getByRole("main").getByRole("status")).toContainText(
    "Concluída",
  );
  await expect(
    page.getByRole("button", { name: "Concluir serviço", exact: true }),
  ).toHaveCount(0);
});
test("celular exibe detalhes e permite voltar à lista; cancelamento e sessão expirada", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const row = { ...base };
  await page.route("**/api/solicitacoes/31", (r) => r.fulfill({ json: row }));
  await page.route("**/api/solicitacoes/31/acao", (r) => {
    row.status = "CANCELADA";
    row.acoes = [];
    return r.fulfill({ json: row });
  });
  await page.goto("/solicitacoes?pedido=31");
  await expect(
    page.getByRole("region", { name: "Lista de solicitações" }),
  ).not.toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Montagem de estante" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/requests-mobile.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Cancelar pedido", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirmar: Cancelar pedido", exact: true })
    .click();
  await expect(page.getByRole("main").getByRole("status")).toContainText(
    "Cancelada",
  );
  await page
    .getByRole("button", { name: "Voltar à lista", exact: false })
    .click();
  await expect(
    page.getByRole("region", { name: "Lista de solicitações" }),
  ).toBeVisible();
  await page.route("**/api/sessao", (r) =>
    r.fulfill({ status: 401, json: { message: "Entre novamente." } }),
  );
  await page.reload();
  await expect(
    page.getByRole("link", { name: "Entrar novamente" }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Detalhes da solicitação" }),
  ).toHaveCount(0);
});
test("erro de acesso e lista vazia são recuperáveis", async ({ page }) => {
  await page.route("**/api/solicitacoes/31", (r) =>
    r.fulfill({
      status: 404,
      json: { message: "Solicitação não encontrada." },
    }),
  );
  await page.goto("/solicitacoes?pedido=31");
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "não encontrada",
  );
  await page.route("**/api/solicitacoes?*", (r) =>
    r.fulfill({ json: { itens: [], total: 0, pagina: 1, limite: 20 } }),
  );
  await page.getByRole("link", { name: "Voltar à lista" }).click();
  await expect(page.getByText(/Nenhuma solicitação nesta lista/)).toBeVisible();
});
