import { test, expect } from "@playwright/test";
const user = {
  idUsuario: 7,
  nome: "Ana Teste",
  email: "ana@example.invalid",
  tipoUsuario: "CONTRATANTE",
};
const provider = {
  idPrestador: 12,
  nome: "Carlos do Banco",
  areaAtuacao: "Marcenaria",
};
const conversation = {
  id: 3,
  cliente: { idUsuario: 7, nome: "Ana Teste" },
  prestador: { idUsuario: 12, nome: provider.nome },
};
test.beforeEach(async ({ page }) => {
  await page.route("**/api/sessao", (route) => route.fulfill({ json: user }));
  await page.route("**/api/servicos?*", (route) =>
    route.fulfill({ json: { itens: [{ prestador: provider }], total: 1 } }),
  );
  await page.route("**/api/contratacoes/anteriores", (route) =>
    route.fulfill({
      json: [
        {
          prestadorId: 12,
          nome: provider.nome,
          areaAtuacao: "Marcenaria",
          ultimoServico: "Montagem de estante",
          dataContratacao: "2026-09-01T12:00:00Z",
          disponivel: true,
        },
      ],
    }),
  );
  await page.route("**/api/conversas", (route) =>
    route.fulfill({
      json: route.request().method() === "POST" ? conversation : [conversation],
    }),
  );
});
test("histórico real abre conversa, envia, preserva texto na falha e recupera após recarregar", async ({
  page,
}) => {
  const rows = [
    {
      id: 1,
      conversaId: 3,
      remetenteId: 12,
      conteudo: "Olá, posso ajudar?",
      enviadaEm: "2026-09-30T12:00:00Z",
    },
  ];
  let fail = true;
  const keys: string[] = [];
  await page.route("**/api/conversas/3/mensagens", async (route) => {
    if (route.request().method() === "POST") {
      expect(route.request().headers()["x-hive-request"]).toBe("1");
      const data = route.request().postDataJSON() as {
        conteudo: string;
        chave: string;
      };
      keys.push(data.chave);
      if (fail) {
        fail = false;
        await route.fulfill({
          status: 503,
          json: { message: "Servidor indisponível. Tente novamente." },
        });
        return;
      }
      const row = {
        id: 2,
        conversaId: 3,
        remetenteId: 7,
        conteudo: data.conteudo,
        enviadaEm: "2026-09-30T12:01:00Z",
      };
      rows.push(row);
      await route.fulfill({ status: 201, json: row });
    } else await route.fulfill({ json: { itens: rows, temMais: false } });
  });
  await page.goto("/home");
  await expect(page.getByRole("heading", { name: "Olá, Ana!" })).toBeVisible();
  await page.getByRole("button", { name: "Conversar novamente" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByText("Olá, posso ajudar?")).toBeVisible();
  const input = page.getByLabel("Sua mensagem");
  await input.fill("Pode montar outra estante?");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Enviar mensagem", exact: true })
    .click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText("Servidor indisponível");
  await expect(input).toHaveValue("Pode montar outra estante?");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Enviar mensagem", exact: true })
    .click();
  await expect(input).toHaveValue("");
  expect(keys[0]).toBe(keys[1]);
  await expect(page.getByRole("log")).toContainText(
    "Pode montar outra estante?",
  );
  await page.reload();
  await page.getByRole("button", { name: "Mensagens", exact: true }).click();
  await page
    .getByRole("navigation", { name: "Conversas" })
    .getByRole("button")
    .click();
  await expect(page.getByRole("log")).toContainText(
    "Pode montar outra estante?",
  );
  await expect(page.getByRole("dialog").getByRole("button", {name:"Enviar mensagem", exact:true})).toBeInViewport();
  await page.getByRole("dialog").screenshot({
    path: "test-results/messages-desktop.png",
    fullPage: true,
    animations: "disabled",
  });
});
test("perfil fictício não abre conversa real; visitante vê acesso ao login", async ({
  page,
}) => {
  await page.route("**/api/sessao", (route) =>
    route.fulfill({
      status: 401,
      json: { message: "Entre novamente para continuar." },
    }),
  );
  await page.goto("/home");
  await page
    .getByRole("button", { name: "Conversar com Rafael Martins" })
    .first()
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "Este perfil é fictício",
  );
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Mensagens", exact: true }).click();
  await expect(
    page.getByRole("dialog").getByRole("link", { name: "Entrar novamente" }),
  ).toBeVisible();
});
test("conversa no celular, histórico vazio, sessão expirada e retratos locais", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("**/api/contratacoes/anteriores", (route) =>
    route.fulfill({ json: [] }),
  );
  await page.route("**/api/conversas/3/mensagens", (route) =>
    route.fulfill({ json: { itens: [], temMais: false } }),
  );
  await page.goto("/home");
  await expect(
    page.getByText(
      "Quando um serviço seu for concluído, o profissional aparecerá aqui.",
    ),
  ).toBeVisible();
  expect((await page.request.get("/images/demo-professionals.webp")).ok()).toBe(
    true,
  );
  await page
    .getByRole("article", { name: "Profissional cadastrado: Carlos do Banco" })
    .getByRole("button", { name: "Enviar mensagem" })
    .click();
  await expect(page.getByLabel("Sua mensagem")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await expect(page.getByRole("dialog").getByRole("button", {name:"Enviar mensagem", exact:true})).toBeInViewport();
  await page.getByRole("dialog").screenshot({
    path: "test-results/messages-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.route("**/api/sessao", (route) =>
    route.fulfill({
      status: 401,
      json: { message: "Entre novamente para continuar." },
    }),
  );
  await expect(
    page.getByRole("dialog").getByRole("link", { name: "Entrar novamente" }),
  ).toBeVisible({ timeout: 10000 });
  await expect(page.getByLabel("Sua mensagem")).toHaveCount(0);
});
