import type { Page } from "@playwright/test";
export async function mockHomeApi(page: Page) {
  await page.route("**/api/favoritos", (r) =>
    r.fulfill({ json: { usuarioId: 7, itens: [] } }),
  );
  let account: {
    idUsuario: number;
    nome: string;
    email: string;
    tipoUsuario: string;
  } | null = null;
  page.on("response", async (response) => {
    if (response.url().endsWith("/api/login") && response.status() === 201) {
      const value: unknown = await response.json().catch(() => null);
      if (
        typeof value === "object" &&
        value !== null &&
        "idUsuario" in value &&
        "nome" in value
      )
        account = value as typeof account;
    }
  });
  await page.route("**/api/notificacoes/resumo", (r) =>
    r.fulfill({ json: { usuarioId: 7, naoLidas: 0, ateId: 0 } }),
  );
  await page.route("**/api/sessao", async (route) => {
    const stored = await page
      .evaluate(() => {
        try {
          return JSON.parse(
            sessionStorage.getItem("hive:viewer") || "null",
          ) as { id?: number; name?: string } | null;
        } catch {
          return null;
        }
      })
      .catch(() => null);
    const current =
      account ||
      (stored?.id && stored?.name
        ? {
            idUsuario: stored.id,
            nome: stored.name,
            email: "fixture@example.invalid",
            tipoUsuario: "CONTRATANTE",
          }
        : null);
    await route.fulfill(
      current
        ? { json: current }
        : { status: 401, json: { message: "Entre novamente para continuar." } },
    );
  });
  await page.route("**/api/servicos?*", (route) =>
    route.fulfill({ json: { itens: [], total: 0 } }),
  );
  await page.route("**/api/contratacoes/anteriores", (route) =>
    route.fulfill({ json: [] }),
  );
  await page.route("**/api/logout", (route) => {
    account = null;
    return route.fulfill({ status: 204 });
  });
}
