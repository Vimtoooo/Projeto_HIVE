import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
const base = {
  idUsuario: 7,
  nome: "Ana Teste",
  email: "ana@example.invalid",
  tipoUsuario: "CONTRATANTE",
  telefone: "11999998888",
  endereco: "Rua das Flores, 123",
  cpfMascarado: "***.***.789-**",
  dataCadastro: "2026-09-01T12:00:00Z",
};
async function fixture(page: Page) {
  const state = {
    profile: { ...base },
    fail: false,
    expired: false,
    loadFail: false,
    bodies: [] as object[],
  };
  await page.route("**/api/notificacoes/resumo", (r) =>
    r.fulfill({ json: { usuarioId: 7, naoLidas: 0, ateId: 0 } }),
  );
  await page.route("**/api/sessao", (r) => r.fulfill({ json: state.profile }));
  await page.route("**/api/contratacoes/anteriores", (r) =>
    r.fulfill({ json: [] }),
  );
  await page.route("**/api/servicos?*", (r) =>
    r.fulfill({ json: { itens: [], total: 0 } }),
  );
  await page.route("**/api/perfil", async (r) => {
    if (state.expired)
      return r.fulfill({ status: 401, json: { message: "Sessão expirada." } });
    if (r.request().method() === "PATCH") {
      expect(r.request().headers()["x-hive-request"]).toBe("1");
      const input = r.request().postDataJSON() as {
        nome: string;
        telefone: string;
        endereco: string;
      };
      state.bodies.push(input);
      if (state.fail)
        return r.fulfill({
          status: 503,
          json: { message: "Banco indisponível. Tente novamente." },
        });
      state.profile = { ...state.profile, ...input };
    } else if (state.loadFail)
      return r.fulfill({
        status: 503,
        json: { message: "Falha ao carregar perfil." },
      });
    return r.fulfill({ json: state.profile });
  });
  return state;
}
test("perfil edita dados permitidos, persiste e atualiza nome na Home", async ({
  page,
}) => {
  const state = await fixture(page);
  await page.setViewportSize({ width: 1500, height: 1000 });
  await page.goto("/home");
  await page.getByRole("button", { name: "Meu perfil", exact: true }).click();
  await expect(page).toHaveURL(/perfil$/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByLabel("Nome completo", { exact: true })).toHaveValue(
    "Ana Teste",
  );
  await expect(page.getByText(base.cpfMascarado)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Meu perfil", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await page
    .getByLabel("Nome completo", { exact: true })
    .fill("  Marina Atualizada  ");
  await page.getByLabel("Telefone", { exact: true }).fill("(11) 3333-4444");
  await page.getByLabel("Endereço", { exact: true }).fill("Rua Nova, 45");
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(page.getByText("Alterações salvas com sucesso.")).toBeVisible();
  expect(state.bodies).toEqual([
    {
      nome: "Marina Atualizada",
      telefone: "1133334444",
      endereco: "Rua Nova, 45",
    },
  ]);
  await page.screenshot({
    path: "test-results/profile-desktop.png",
    fullPage: true,
  });
  await page.reload();
  await expect(page.getByLabel("Nome completo", { exact: true })).toHaveValue(
    "Marina Atualizada",
  );
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Início", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Olá, Marina!" }),
  ).toBeVisible();
});
test("cancelar restaura dados e falha de gravação preserva edição para retry", async ({
  page,
}) => {
  const state = await fixture(page);
  await page.goto("/perfil");
  const name = page.getByLabel("Nome completo", { exact: true });
  await name.fill("Nome temporário");
  await page.getByRole("button", { name: "Cancelar edição" }).click();
  await expect(name).toHaveValue(base.nome);
  expect(state.bodies).toHaveLength(0);
  state.fail = true;
  await name.fill("Nome Novo");
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Banco indisponível" }),
  ).toBeVisible();
  await expect(name).toHaveValue("Nome Novo");
  expect(state.profile.nome).toBe(base.nome);
  state.fail = false;
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(page.getByText("Alterações salvas com sucesso.")).toBeVisible();
});
test("valida telefone, trata sessão expirada e não mantém dados privados", async ({
  page,
}) => {
  const state = await fixture(page);
  await page.goto("/perfil");
  await page.getByLabel("Telefone", { exact: true }).fill("123");
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Confira os campos" }),
  ).toBeVisible();
  expect(state.bodies).toHaveLength(0);
  await page.getByLabel("Telefone", { exact: true }).fill("11988887777");
  state.expired = true;
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(
    page.getByRole("heading", { name: "Entre para acessar seu perfil" }),
  ).toBeVisible();
  await expect(page.getByRole("form")).toHaveCount(0);
  await expect(page.getByText(base.email)).toHaveCount(0);
});
test("erro de carga é recuperável e celular não transborda", async ({
  page,
}) => {
  const state = await fixture(page);
  state.loadFail = true;
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/perfil");
  await expect(
    page.getByRole("alert").filter({ hasText: "Falha ao carregar" }),
  ).toBeVisible();
  state.loadFail = false;
  await page.getByRole("button", { name: "Tentar novamente" }).click();
  await expect(page.getByLabel("Nome completo", { exact: true })).toHaveValue(
    base.nome,
  );
  await page.getByLabel("Nome completo", { exact: true }).focus();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Telefone", { exact: true })).toBeFocused();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/profile-mobile.png",
    fullPage: true,
  });
});
