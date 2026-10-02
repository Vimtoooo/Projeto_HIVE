import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import type { NotificationItem } from "../../src/services/NotificationsApi";
const user = {
  idUsuario: 7,
  nome: "Ana Teste",
  email: "ana@example.invalid",
  tipoUsuario: "CONTRATANTE",
};
const base: NotificationItem[] = [
  {
    id: 3,
    tipo: "SOLICITACAO_ACEITA",
    titulo: "Solicitação aceita",
    descricao: "Carlos Lima atualizou o pedido de montagem de estante.",
    criadaEm: "2026-10-01T14:00:00Z",
    lidaEm: null,
    destino: "/solicitacoes?pedido=31&papel=cliente",
  },
  {
    id: 2,
    tipo: "NOVA_MENSAGEM",
    titulo: "Nova mensagem",
    descricao: "Carlos Lima enviou uma mensagem para você.",
    criadaEm: "2026-10-01T13:30:00Z",
    lidaEm: null,
    destino: "/mensagens?conversa=9",
  },
  {
    id: 1,
    tipo: "SOLICITACAO_CONCLUIDA",
    titulo: "Serviço concluído",
    descricao: "Marina concluiu seu serviço de limpeza.",
    criadaEm: "2026-10-01T12:00:00Z",
    lidaEm: "2026-10-01T12:15:00Z",
    destino: "/solicitacoes?pedido=30&papel=cliente",
  },
];
async function fixture(page: Page) {
  const state = {
    rows: structuredClone(base),
    failRead: false,
    failList: false,
    expired: false,
    user: 7,
    batches: [] as number[],
    summaries: 0,
  };
  await page.route("**/api/sessao", (r) => r.fulfill({ json: user }));
  await page.route("**/api/servicos?*", (r) =>
    r.fulfill({ json: { itens: [], total: 0 } }),
  );
  await page.route("**/api/contratacoes/anteriores", (r) =>
    r.fulfill({ json: [] }),
  );
  await page.route("**/api/notificacoes**", async (r) => {
    if (state.expired)
      return r.fulfill({ status: 401, json: { message: "Sessão expirada." } });
    const url = new URL(r.request().url()),
      path = url.pathname;
    if (path.endsWith("/resumo")) {
      state.summaries++;
      return r.fulfill({
        json: {
          usuarioId: state.user,
          naoLidas: state.rows.filter((n) => !n.lidaEm).length,
          ateId: Math.max(0, ...state.rows.map((n) => n.id)),
        },
      });
    }
    if (path.endsWith("/ler-todas")) {
      const body = r.request().postDataJSON() as { ateId: number };
      state.batches.push(body.ateId);
      state.rows = state.rows.map((n) =>
        n.id <= body.ateId
          ? { ...n, lidaEm: n.lidaEm || "2026-10-01T15:00:00Z" }
          : n,
      );
      return r.fulfill({ json: { atualizadas: 2 } });
    }
    const id = Number(path.split("/")[3]);
    if (id) {
      const n = state.rows.find((n) => n.id === id);
      if (!n)
        return r.fulfill({
          status: 404,
          json: { message: "Notificação indisponível ou removida." },
        });
      if (path.endsWith("/lida")) {
        if (state.failRead)
          return r.fulfill({
            status: 503,
            json: { message: "Falha de conexão. Tente novamente." },
          });
        n.lidaEm ??= "2026-10-01T15:00:00Z";
      }
      return r.fulfill({ json: n });
    }
    if (state.failList)
      return r.fulfill({
        status: 503,
        json: { message: "Falha ao carregar a lista." },
      });
    let rows = state.rows;
    const category = url.searchParams.get("categoria");
    if (category)
      rows = rows.filter(
        (n) => (n.tipo === "NOVA_MENSAGEM") === (category === "mensagens"),
      );
    if (url.searchParams.get("naoLidas") === "true")
      rows = rows.filter((n) => !n.lidaEm);
    const top = Number(
      url.searchParams.get("ateId") ??
        Math.max(0, ...state.rows.map((n) => n.id)),
    );
    const before = Number(url.searchParams.get("antes") ?? 2147483647);
    rows = rows
      .filter((n) => n.id <= top && n.id < before)
      .sort((a, b) => b.id - a.id);
    return r.fulfill({
      json: {
        usuarioId: state.user,
        itens: rows.slice(0, 20),
        ateId: top,
        proximoCursor: rows.length > 20 ? rows[19].id : null,
      },
    });
  });
  return state;
}
test("navega sem modal, lê, mantém contadores e abre o pedido; desktop", async ({
  page,
}) => {
  const state = await fixture(page);
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto("/home");
  await page
    .getByRole("navigation")
    .getByRole("button", { name: /Notificações/ })
    .click();
  await expect(page).toHaveURL(/notificacoes$/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const list = page.getByRole("region", { name: "Lista de notificações" });
  await expect(
    list.getByRole("button", { name: /Solicitação aceita/ }),
  ).toBeVisible();
  await list.getByRole("button", { name: /Solicitação aceita/ }).click();
  await expect(
    page.getByRole("region", { name: "Detalhes da notificação" }),
  ).toContainText("Lida em");
  await expect(page.getByText("1 não lida", { exact: true })).toBeVisible();
  expect(state.rows[0].lidaEm).not.toBeNull();
  await expect(
    page.getByRole("navigation").getByRole("button", { name: /Notificações/ }),
  ).toHaveAttribute("aria-current", "page");
  await page.screenshot({
    path: "test-results/notifications-desktop.png",
    fullPage: true,
  });
  await expect(
    page.getByRole("link", { name: "Ver solicitação" }),
  ).toHaveAttribute("href", "/solicitacoes?pedido=31&papel=cliente");
  await page.reload();
  await expect(
    list.getByRole("button", { name: /Solicitação aceita/ }),
  ).toContainText("· Lida");
});
test("combina categoria e leitura, abre conversa por teclado e marca lote com limite", async ({
  page,
}) => {
  const state = await fixture(page);
  await page.goto("/notificacoes");
  await page
    .getByRole("group", { name: "Filtrar notificações" })
    .getByRole("button", { name: "Mensagens", exact: true })
    .click();
  await page.getByRole("checkbox", { name: "Não lidas" }).check();
  const item = page
    .getByRole("region", { name: "Lista de notificações" })
    .getByRole("button", { name: /Nova mensagem/ });
  await item.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("link", { name: "Abrir conversa" }),
  ).toHaveAttribute("href", "/mensagens?conversa=9");
  await expect(
    page.getByText("Você não tem avisos não lidos neste filtro."),
  ).toBeVisible();
  state.rows.unshift({ ...base[0], id: 4, titulo: "Nova solicitação" });
  await page.getByRole("button", { name: "Marcar todas como lidas" }).click();
  await expect.poll(() => state.batches.length).toBe(1);
  expect(state.batches).toEqual([3]);
  expect(state.rows[0].lidaEm).toBeNull();
  await expect(page.getByText("1 não lida", { exact: true })).toBeVisible();
});
test("falha de leitura preserva não lida e permite tentar novamente", async ({
  page,
}) => {
  const state = await fixture(page);
  state.failRead = true;
  await page.goto("/notificacoes");
  await page
    .getByRole("region", { name: "Lista de notificações" })
    .getByRole("button", { name: /Nova mensagem/ })
    .click();
  await expect(
    page.getByRole("button", { name: "Tentar marcar como lida" }),
  ).toBeVisible();
  expect(state.rows[1].lidaEm).toBeNull();
  await expect(page.getByText("2 não lidas", { exact: true })).toBeVisible();
  state.failRead = false;
  await page.getByRole("button", { name: "Tentar marcar como lida" }).click();
  await expect(
    page.getByRole("region", { name: "Detalhes da notificação" }),
  ).toContainText("Lida em");
});
test("lista recupera erro e mostra origem removida sem confundir com estado vazio", async ({
  page,
}) => {
  const state = await fixture(page);
  state.failList = true;
  await page.goto("/notificacoes");
  await expect(
    page.getByRole("alert").filter({ hasText: "Falha ao carregar" }),
  ).toContainText("Falha ao carregar");
  await expect(page.getByText("Tudo em dia por aqui")).toHaveCount(0);
  state.failList = false;
  await page.getByRole("button", { name: "Tentar novamente" }).click();
  const item = page
    .getByRole("region", { name: "Lista de notificações" })
    .getByRole("button", { name: /Solicitação aceita/ });
  await expect(item).toBeVisible();
  state.rows = state.rows.filter((n) => n.id !== 3);
  await item.click();
  await expect(
    page.getByRole("status").filter({ hasText: "indisponível ou removida" }),
  ).toContainText("indisponível ou removida");
});
test("celular alterna lista e detalhe, sem transbordamento horizontal", async ({
  page,
}) => {
  await fixture(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/notificacoes");
  await page
    .getByRole("region", { name: "Lista de notificações" })
    .getByRole("button", { name: /Nova mensagem/ })
    .click();
  await expect(
    page.getByRole("region", { name: "Lista de notificações" }),
  ).toBeHidden();
  await expect(
    page.getByRole("link", { name: "Abrir conversa" }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/notifications-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Voltar às notificações" }).click();
  await expect(
    page.getByRole("region", { name: "Lista de notificações" }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/notifications-mobile-list.png",
    fullPage: true,
  });
});
test("foco atualiza conta e sessão expirada limpa dados e contadores", async ({
  page,
}) => {
  const state = await fixture(page);
  await page.goto("/notificacoes");
  await expect(page.getByText("2 não lidas", { exact: true })).toBeVisible();
  state.user = 12;
  state.rows = [];
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(page.getByText("Tudo em dia por aqui")).toBeVisible();
  await expect(page.getByText("0 não lidas", { exact: true })).toBeVisible();
  state.expired = true;
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(
    page.getByRole("heading", { name: "Entre para ver suas notificações" }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Lista de notificações" }),
  ).toHaveCount(0);
});

test("paginação conserva snapshot com novos avisos e volta ao início", async ({
  page,
}) => {
  const state = await fixture(page);
  state.rows = Array.from({ length: 25 }, (_, i) => ({
    ...base[0],
    id: 25 - i,
    titulo: `Pedido ${25 - i}`,
  }));
  await page.goto("/notificacoes");
  const list = page.getByRole("region", { name: "Lista de notificações" });
  await expect(list.getByRole("button", { name: /Pedido 25 / })).toBeVisible();
  state.rows.unshift({ ...base[0], id: 26, titulo: "Pedido 26" });
  await page.getByRole("button", { name: "Mais antigas" }).click();
  await expect(list.getByRole("button", { name: /Pedido 5 / })).toBeVisible();
  await expect(list.getByRole("button", { name: /Pedido 26 / })).toHaveCount(0);
  await page.getByRole("button", { name: "Mais recentes" }).click();
  await expect(list.getByRole("button", { name: /Pedido 26 / })).toBeVisible();
});
test("resposta inválida não renderiza destino externo e permite recuperação", async ({
  page,
}) => {
  const state = await fixture(page);
  state.rows[0].destino = "https://example.invalid";
  await page.goto("/notificacoes");
  await expect(
    page.getByRole("alert").filter({ hasText: "Resposta inesperada" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Ver solicitação" })).toHaveCount(
    0,
  );
  state.rows[0].destino = base[0].destino;
  await page.getByRole("button", { name: "Tentar novamente" }).click();
  await expect(
    page
      .getByRole("region", { name: "Lista de notificações" })
      .getByRole("button", { name: /Solicitação aceita/ }),
  ).toBeVisible();
});
