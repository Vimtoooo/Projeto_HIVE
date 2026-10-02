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
  await page.route("**/api/notificacoes/resumo", (r) =>
    r.fulfill({ json: { usuarioId: 7, naoLidas: 0, ateId: 0 } }),
  );
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
  await page.setViewportSize({ width: 1600, height: 1000 });
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
  await expect(page).toHaveURL(/\/mensagens\?conversa=3/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByText("Olá, posso ajudar?")).toBeVisible();
  const input = page.getByLabel("Sua mensagem");
  await input.fill("Pode montar outra estante?");
  await page
    .getByRole("button", { name: "Enviar mensagem", exact: true })
    .click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "Servidor indisponível",
  );
  await expect(input).toHaveValue("Pode montar outra estante?");
  await page
    .getByRole("button", { name: "Enviar mensagem", exact: true })
    .click();
  await expect(input).toHaveValue("");
  expect(keys[0]).toBe(keys[1]);
  await expect(page.getByRole("log")).toContainText(
    "Pode montar outra estante?",
  );
  await page.reload();
  await expect(page).toHaveURL(/\/mensagens\?conversa=3/);
  await expect(page.getByRole("log")).toContainText(
    "Pode montar outra estante?",
  );
  await expect(
    page.getByRole("button", { name: "Enviar mensagem", exact: true }),
  ).toBeInViewport();
  await page.screenshot({
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
    page.getByRole("link", { name: "Entrar novamente" }),
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
  await expect(
    page.getByRole("button", { name: "Enviar mensagem", exact: true }),
  ).toBeInViewport();
  await page.screenshot({
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
    page.getByRole("link", { name: "Entrar novamente" }),
  ).toBeVisible({ timeout: 10000 });
  await expect(page.getByLabel("Sua mensagem")).toHaveCount(0);
});

test("busca contatos, navega pelo histórico e volta à Home", async ({
  page,
}) => {
  await page.route("**/api/conversas/3/mensagens", (route) =>
    route.fulfill({ json: { itens: [], temMais: false } }),
  );
  await page.goto("/mensagens");
  await expect(
    page.getByRole("button", { name: "Mensagens", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await expect(
    page.getByRole("heading", { name: "Uma boa conversa começa aqui." }),
  ).toBeVisible();
  await page.getByLabel("Buscar conversa").fill("ninguém");
  await expect(
    page.getByText("Nenhum contato encontrado. Tente outro nome."),
  ).toBeVisible();
  await page.getByLabel("Buscar conversa").fill("CARLOS");
  await page
    .getByRole("navigation", { name: "Conversas" })
    .getByRole("button")
    .click();
  await expect(page.getByLabel("Sua mensagem")).toBeVisible();
  await page.goBack();
  await expect(
    page.getByRole("heading", { name: "Uma boa conversa começa aqui." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Início", exact: true }).click();
  await expect(page).toHaveURL(/\/home$/);
});

test("celular alterna lista e chat; conversa inválida e caixa vazia têm orientação", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("**/api/conversas/3/mensagens", (route) =>
    route.fulfill({ json: { itens: [], temMais: false } }),
  );
  await page.goto("/mensagens?conversa=3");
  await expect(page.getByLabel("Sua mensagem")).toBeVisible();
  await page
    .getByRole("button", { name: "Voltar às conversas", exact: true })
    .click();
  await expect(page.getByLabel("Buscar conversa")).toBeVisible();
  await expect(page.getByLabel("Sua mensagem")).toHaveCount(0);
  await page.goto("/mensagens?conversa=999");
  await expect(
    page.getByRole("heading", { name: "Conversa indisponível" }),
  ).toBeVisible();
  await page.route("**/api/conversas", (route) => route.fulfill({ json: [] }));
  await page.goto("/mensagens");
  await expect(
    page.getByRole("link", { name: "Explorar profissionais" }),
  ).toBeVisible();
});

test("paginação carrega mensagens anteriores sem duplicar e trocar contato isola histórico", async ({
  page,
}) => {
  const second = {
    id: 4,
    cliente: conversation.cliente,
    prestador: { idUsuario: 13, nome: "Beatriz Jardim" },
  };
  await page.route("**/api/conversas", (route) =>
    route.fulfill({ json: [conversation, second] }),
  );
  const message = {
    id: 52,
    conversaId: 3,
    remetenteId: 12,
    conteudo: "Mensagem recente",
    enviadaEm: "2026-09-30T12:00:00Z",
  };
  await page.route("**/api/conversas/3/mensagens*", (route) =>
    route.fulfill({
      json: route.request().url().includes("?")
        ? {
            itens: [{ ...message, id: 1, conteudo: "Mensagem antiga" }],
            temMais: false,
          }
        : { itens: [message], temMais: true },
    }),
  );
  await page.route("**/api/conversas/4/mensagens", (route) =>
    route.fulfill({ json: { itens: [], temMais: false } }),
  );
  await page.goto("/mensagens?conversa=3");
  await page
    .getByRole("button", { name: "Carregar mensagens anteriores" })
    .click();
  await expect(page.getByRole("log")).toContainText("Mensagem antiga");
  await expect(
    page.getByRole("log").getByText("Mensagem recente", { exact: true }),
  ).toHaveCount(1);
  await page
    .getByRole("navigation", { name: "Conversas" })
    .getByRole("button", { name: /Beatriz Jardim/ })
    .click();
  await expect(page.getByRole("log")).not.toContainText("Mensagem recente");
  await expect(page.getByRole("log")).not.toContainText("Mensagem antiga");
});
