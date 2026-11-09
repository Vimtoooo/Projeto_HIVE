import { test, expect, type Page } from "@playwright/test";
import { mockHomeApi } from "./ApiFixture";

async function fixture(page: Page) {
  await mockHomeApi(page);
  const state = {
    id: 7,
    active: false,
    anonymous: false,
    failSession: false,
    calls: 0,
    fail: false,
    lost: false,
    failAfterWrite: false,
  };
  const user = () => ({
    idUsuario: state.id,
    nome: "Ana Teste",
    email: "ana@example.invalid",
    tipoUsuario: state.active ? "AMBOS" : "CONTRATANTE",
    possuiPerfilProfissional: state.active,
  });
  await page.route("**/api/sessao", (r) =>
    r.fulfill({
      status: state.failSession ? 503 : state.anonymous ? 401 : 200,
      json: user(),
    }),
  );
  await page.route("**/api/perfil", (r) =>
    r.fulfill({
      json: {
        ...user(),
        telefone: "11999998888",
        endereco: "Rua de Teste",
        cpfMascarado: "***.***.000-**",
        dataCadastro: "2026-01-01T00:00:00Z",
      },
    }),
  );
  await page.route("**/api/perfil/prestador", async (r) => {
    state.calls++;
    const input = r.request().postDataJSON();
    expect(Object.keys(input).sort()).toEqual(
      ["cnpj", "areaAtuacao", "experiencia", "certificacoes", "servico"].sort(),
    );
    expect(input.certificacoes).toEqual([]);
    expect(r.request().headers()["x-hive-request"]).toBe("1");
    if (state.fail)
      return r.fulfill({
        status: 409,
        json: {
          code: "CNPJ_DUPLICADO",
          message: "Este CNPJ já possui cadastro profissional.",
        },
      });
    state.active = true;
    if (state.failAfterWrite) state.failSession = true;
    if (state.lost) return r.abort();
    return r.fulfill({
      status: 201,
      json: {
        idServico: 20,
        ...input.servico,
        prestador: {
          idPrestador: state.id,
          nome: "Ana Teste",
          areaAtuacao: input.areaAtuacao,
          avaliacaoMedia: 0,
        },
      },
    });
  });
  return state;
}
async function fill(page: Page) {
  for (const [name, value] of Object.entries({
    cnpj: "12345678000199",
    areaAtuacao: "Montagem",
    experiencia: "Cinco anos",
    titulo: "Montagem de mesa",
    descricao: "Montagem completa",
    precoBase: "100,00",
  }))
    await page.locator(`[name="${name}"]`).fill(value);
}
test("home e perfil levam à ativação; conta ativa retorna ao perfil sem novo login", async ({
  page,
}) => {
  const state = await fixture(page);
  await page.goto("/home");
  await page.getByRole("link", { name: "Quero ser profissional" }).click();
  await expect(page).toHaveURL(/perfil\/prestador$/);
  await expect(
    page.getByRole("heading", { name: "Ativar perfil profissional" }),
  ).toBeVisible();
  await expect(
    page.locator('[name="senha"], [name="cpf"], [name="email"]'),
  ).toHaveCount(0);
  await expect(page.getByLabel("Certificações (opcional)")).not.toHaveAttribute(
    "required",
  );
  await fill(page);
  await page
    .getByRole("button", { name: "Ativar perfil profissional" })
    .click();
  await expect(page).toHaveURL(/perfil\?ativado=1$/);
  await expect(
    page.getByText("Perfil profissional ativo.", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Quero ser profissional" }),
  ).toHaveCount(0);
  expect(state.calls).toBe(1);
  await page.goto("/cadastro/prestador");
  await expect(page).toHaveURL(/\/perfil$/);
});
test("cadastro público encaminha cliente para ativação e Meu perfil oferece a mesma entrada", async ({
  page,
}) => {
  await fixture(page);
  await page.goto("/cadastro/prestador");
  await expect(page).toHaveURL(/perfil\/prestador$/);
  await page.getByRole("link", { name: "← Meu perfil" }).click();
  await page.getByRole("link", { name: "Quero ser profissional" }).click();
  await expect(page).toHaveURL(/perfil\/prestador$/);
});
test("resposta perdida consulta sessão e não duplica envio", async ({
  page,
}) => {
  const state = await fixture(page);
  state.lost = true;
  await page.goto("/perfil/prestador");
  await fill(page);
  await page
    .getByRole("button", { name: "Ativar perfil profissional" })
    .click();
  await expect(page).toHaveURL(/perfil\?ativado=1$/);
  expect(state.calls).toBe(1);
});
test("CNPJ duplicado preserva campos, permite correção e não anuncia ativação", async ({
  page,
}) => {
  const state = await fixture(page);
  state.fail = true;
  await page.goto("/perfil/prestador");
  await fill(page);
  await page
    .getByRole("button", { name: "Ativar perfil profissional" })
    .click();
  await expect(page.locator("#main-content").getByRole("alert")).toContainText(
    "CNPJ",
  );
  await expect(page.getByLabel("Experiência", { exact: true })).toHaveValue(
    "Cinco anos",
  );
  expect(state.calls).toBe(1);
  state.fail = false;
  await page
    .getByRole("button", { name: "Ativar perfil profissional" })
    .click();
  await expect(page).toHaveURL(/perfil\?ativado=1$/);
});
test("troca de conta limpa formulário e foco revalida capacidades", async ({
  page,
}) => {
  const state = await fixture(page);
  await page.goto("/perfil/prestador");
  await fill(page);
  state.id = 9;
  await page.evaluate(() =>
    window.dispatchEvent(new Event("hive:display-change")),
  );
  await expect(page.getByLabel("CNPJ", { exact: true })).toHaveValue("");
  state.active = true;
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(
    page.getByText("Seu perfil profissional já está ativo.", { exact: false }),
  ).toBeVisible();
  expect(state.calls).toBe(0);
});
test("visitante e falha de sessão não liberam formulário", async ({ page }) => {
  const state = await fixture(page);
  state.anonymous = true;
  await page.goto("/perfil/prestador");
  await expect(
    page.getByRole("link", { name: "Entrar", exact: true }),
  ).toBeVisible();
  await expect(page.locator('[name="cnpj"]')).toHaveCount(0);
  state.anonymous = false;
  state.failSession = true;
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(page.locator("#main-content").getByRole("alert")).toContainText(
    "sessão",
  );
  state.failSession = false;
  await page.getByRole("button", { name: "Tentar novamente" }).click();
  await expect(page.getByLabel("CNPJ", { exact: true })).toBeVisible();
});
for (const width of [320, 390, 768, 1440])
  test(`ativação acessível sem sobreposição em ${width}px`, async ({
    page,
  }) => {
    await fixture(page);
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/perfil/prestador");
    await page
      .getByRole("button", { name: "Ativar perfil profissional" })
      .click();
    await expect(page.getByLabel("CNPJ", { exact: true })).toBeFocused();
    await fill(page);
    await page.getByLabel("CNPJ", { exact: true }).focus();
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Área de atuação")).toBeFocused();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await expect(
      page.getByRole("button", { name: "Ativar perfil profissional" }),
    ).toHaveCSS("background-color", "rgb(245, 184, 0)");
    expect(
      await page
        .getByLabel("CNPJ", { exact: true })
        .evaluate((el) => parseFloat(getComputedStyle(el).borderTopWidth)),
    ).toBeGreaterThan(0);
    await page.screenshot({
      animations: "disabled",
      path: `test-results/activation-${width}.png`,
      fullPage: true,
    });
  });

test("consulta indisponível após envio não causa novo POST quando sessão confirma ativação", async ({
  page,
}) => {
  const state = await fixture(page);
  state.lost = true;
  state.failAfterWrite = true;
  await page.goto("/perfil/prestador");
  await fill(page);
  await page
    .getByRole("button", { name: "Ativar perfil profissional" })
    .click();
  await expect(page.locator("#main-content").getByRole("status")).toContainText(
    "pode ter sido concluída",
  );
  expect(state.calls).toBe(1);
  state.failSession = false;
  await page
    .getByRole("button", { name: "Consultar e tentar novamente" })
    .click();
  await expect(page).toHaveURL(/perfil\?ativado=1$/);
  expect(state.calls).toBe(1);
});

test("envio duplo e resposta atrasada de outra conta não reaproveitam formulário", async ({
  page,
}) => {
  const state = await fixture(page);
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/perfil/prestador", async (r) => {
    state.calls++;
    await gate;
    await r.fulfill({
      status: 409,
      json: {
        code: "PERFIL_PROFISSIONAL_EXISTENTE",
        message: "Perfil existente",
      },
    });
  });
  await page.goto("/perfil/prestador");
  await fill(page);
  await page
    .getByRole("button", { name: "Ativar perfil profissional" })
    .click();
  await expect.poll(() => state.calls).toBe(1);
  await page
    .locator("form")
    .evaluate((el: HTMLFormElement) => el.requestSubmit());
  expect(state.calls).toBe(1);
  state.id = 9;
  await page.evaluate(() =>
    window.dispatchEvent(new Event("hive:display-change")),
  );
  await expect(page.getByLabel("CNPJ", { exact: true })).toHaveValue("");
  release();
  await expect(page).toHaveURL(/perfil\/prestador$/);
  await expect(
    page.getByRole("button", { name: "Ativar perfil profissional" }),
  ).toBeEnabled();
  expect(state.calls).toBe(1);
});

test("todos os campos profissionais têm entrada suave e respeitam movimento reduzido", async ({
  page,
}) => {
  await fixture(page);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/perfil/prestador");
  await expect(page.locator('[name="cnpj"]')).toBeVisible();
  for (const name of [
    "cnpj",
    "areaAtuacao",
    "experiencia",
    "certificacoes",
    "titulo",
    "descricao",
    "precoBase",
  ]) {
    const group = page.locator(`[name="${name}"]`).locator("../..");
    expect(
      await group.evaluate((el) => getComputedStyle(el).animationName),
    ).toContain("professional-enter");
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(
    await page
      .locator('[name="cnpj"]')
      .locator("../..")
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("none");
});
