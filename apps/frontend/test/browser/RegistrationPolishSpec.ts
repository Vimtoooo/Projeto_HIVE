import { test, expect } from "@playwright/test";
import { mockHomeApi } from "./ApiFixture";
test.beforeEach(async ({ page }) => {
  await page.route("**/api/sessao", (r) =>
    r.fulfill({ status: 401, json: {} }),
  );
});

for (const path of ["/cadastro", "/cadastro/prestador"]) {
  test(`${path}: erros por campo, foco, edição e placeholders`, async ({
    page,
  }) => {
    let calls = 0;
    await page.route("**/api/clientes", (route) => {
      calls++;
      return route.fulfill({ status: 400, json: {} });
    });
    await page.route("**/api/prestadores", (route) => {
      calls++;
      return route.fulfill({ status: 400, json: {} });
    });
    await page.goto(path);
    await expect(page.locator("form")).toHaveAttribute("novalidate", "");
    await expect(page.getByText("🐝 Bem-vindo ao HIVE")).toBeVisible();
    await page.locator('button[type="submit"]').click();
    await expect(page.getByLabel("Nome completo")).toBeFocused();
    const required = page.locator(
      "form input[required], form textarea[required]",
    );
    for (const field of await required.all()) {
      await expect(field).toHaveAttribute("aria-invalid", "true");
      expect(await field.getAttribute("placeholder")).toBeTruthy();
      await expect(field).toHaveCSS("border-top-color", "rgb(185, 28, 28)");
    }
    await page.getByLabel("Nome completo").fill("Pedro123");
    await expect(page.locator("#nome-error")).toContainText("letras");
    await page.getByLabel("Nome completo").fill("Ana-Maria D’Ávila");
    await expect(page.getByLabel("Nome completo")).toHaveAttribute(
      "aria-invalid",
      "false",
    );
    await expect(page.locator("#nome-error")).toHaveCount(0);
    await page.getByLabel("Senha", { exact: true }).fill("Senha!2026");
    await page.getByLabel("Confirmar senha").fill("Outra!2026");
    await expect(page.locator("#confirmarSenha-error")).toContainText(
      "não coincidem",
    );
    await page.getByLabel("Confirmar senha").fill("Senha!2026");
    await expect(page.locator("#confirmarSenha-error")).toHaveCount(0);
    expect(calls).toBe(0);
    await page.reload();
    await page.getByLabel("Nome completo").fill("123");
    await page.getByLabel("Nome completo").press("Tab");
    await expect(page.locator("#nome-error")).toBeVisible();
    await expect(page.locator("#cpf-error")).toHaveCount(0);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(page.getByLabel("Nome completo")).toHaveCSS(
      "transition-duration",
      "0s",
    );
  });
}
test("cadastros e login mantêm dimensões e breakpoint, sem sobreposição", async ({
  page,
}) => {
  for (const width of [320, 390, 768, 769, 860, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    const sizes: number[] = [];
    for (const path of ["/login", "/cadastro", "/cadastro/prestador"]) {
      await page.goto(path);
      await expect(page.locator("aside")).toBeVisible({ visible: width > 768 });
      const email = page.getByLabel("E-mail", { exact: true });
      const box = await email.boundingBox();
      expect(box).not.toBeNull();
      sizes.push(box!.width);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      const back = await page
        .getByRole("link", { name: "Voltar", exact: true })
        .boundingBox();
      const greeting = await page.locator("main h2").first().boundingBox();
      expect(greeting!.y).toBeGreaterThan(back!.y + back!.height);
      if (path === "/cadastro/prestador")
        await page.screenshot({
          path: `test-results/polish-provider-${width}.png`,
          fullPage: true,
          animations: "disabled",
        });
    }
    expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThan(2);
  }
});
test("convite usa sessão real, oculta prestadores e acompanha troca de conta", async ({
  page,
}) => {
  await mockHomeApi(page);
  let role: string | null = null;
  await page.route("**/api/sessao", (route) =>
    route.fulfill(
      role
        ? {
            json: {
              idUsuario: 7,
              nome: "Ana",
              email: "ana@example.invalid",
              tipoUsuario: role,
              possuiPerfilProfissional: role !== "CONTRATANTE",
            },
          }
        : { status: 401, json: {} },
    ),
  );
  await page.goto("/home");
  const invitation = page.getByRole("link", { name: "Quero ser profissional" });
  await expect(invitation).toBeVisible();
  await invitation.click();
  await expect(page).toHaveURL(/cadastro\/prestador$/);
  role = "PRESTADOR";
  await page.goto("/home");
  await expect(invitation).toHaveCount(0);
  await expect(page.getByText("Seu talento tem")).toHaveCount(0);
  role = "CONTRATANTE";
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(invitation).toBeVisible();
  role = "AMBOS";
  await page.evaluate(() =>
    window.dispatchEvent(new Event("hive:display-change")),
  );
  await expect(invitation).toHaveCount(0);
  role = null;
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(invitation).toBeVisible();
});
test("cards reais usam preço, avaliações e paginação; falha preserva resultados", async ({
  page,
}) => {
  await mockHomeApi(page);
  const row = {
    idPrestador: 12,
    nome: "Carolina Silva",
    areaAtuacao: "Marcenaria",
    quantidadeServicos: 2,
    precoInicial: 123.45,
    avaliacao: { media: 4.5, quantidade: 3 },
  };
  let fail = true;
  await page.route("**/api/profissionais?*", (route) => {
    const second =
      new URL(route.request().url()).searchParams.get("pagina") === "2";
    return route.fulfill(
      second && fail
        ? { status: 503, json: { message: "Falha de teste" } }
        : {
            json: {
              itens: second
                ? [
                    {
                      ...row,
                      idPrestador: 13,
                      nome: "Bruno Silva",
                      avaliacao: { media: null, quantidade: 0 },
                    },
                  ]
                : [row],
              total: 13,
              pagina: second ? 2 : 1,
              limite: 12,
            },
          },
    );
  });
  await page.goto("/home");
  const card = page.getByRole("article", {
    name: "Profissional cadastrado: Carolina Silva",
  });
  await expect(card).toContainText("123,45");
  await expect(card).toContainText("4,5 (3 avaliações)");
  await expect(card).toContainText("Distância indisponível");
  await expect(card.locator("img")).toHaveCount(0);
  await expect(
    card.getByRole("link", { name: "Ver detalhes de Carolina Silva" }),
  ).toHaveAttribute("href", "/profissionais?profissional=12");
  await page.getByRole("button", { name: "Ver mais profissionais" }).click();
  await expect(page.getByText("Falha de teste")).toBeVisible();
  await expect(card).toBeVisible();
  fail = false;
  await page
    .locator('section[aria-labelledby="registered-title"]')
    .getByRole("button", { name: "Tentar novamente" })
    .click();
  await expect(
    page.getByRole("article", { name: "Profissional cadastrado: Bruno Silva" }),
  ).toContainText("Sem avaliações");
  await expect(card).toHaveCount(1);
  await page.locator('section[aria-labelledby="registered-title"]').screenshot({
    path: "test-results/polish-real-cards.png",
    animations: "disabled",
  });
  await page.route("**/api/conversas", (route) =>
    route.fulfill({ status: 401, json: {} }),
  );
  await card
    .getByRole("button", { name: "Conversar com Carolina Silva" })
    .click();
  await expect(
    page.getByText("Entre novamente para enviar mensagens."),
  ).toBeVisible();
});

test("catálogo distingue carregamento, vazio e falha, e abre detalhes reais", async ({
  page,
}) => {
  await mockHomeApi(page);
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/profissionais?*", async (route) => {
    await gate;
    await route.fulfill({
      json: { itens: [], total: 0, pagina: 1, limite: 12 },
    });
  });
  await page.goto("/home");
  await expect(page.getByText("Carregando profissionais…")).toBeVisible();
  await expect(
    page.getByText("Nenhum profissional disponível nesta lista."),
  ).toHaveCount(0);
  release();
  await expect(
    page.getByText("Nenhum profissional disponível nesta lista."),
  ).toBeVisible();
  await page.route("**/api/profissionais?*", (route) =>
    route.fulfill({ status: 503, json: { message: "Catálogo indisponível" } }),
  );
  await page.reload();
  await expect(page.getByText("Catálogo indisponível")).toBeVisible();
  await expect(
    page.getByText("Nenhum profissional disponível nesta lista."),
  ).toHaveCount(0);
  const summary = {
    idPrestador: 12,
    nome: "Carolina Silva",
    areaAtuacao: "Marcenaria",
    quantidadeServicos: 1,
    precoInicial: 123.45,
    avaliacao: { media: null, quantidade: 0 },
  };
  await page.route("**/api/profissionais?*", (route) =>
    route.fulfill({
      json: { itens: [summary], total: 1, pagina: 1, limite: 12 },
    }),
  );
  await page.route("**/api/profissionais/12", (route) =>
    route.fulfill({
      json: {
        ...summary,
        experiencia: "Montagem de móveis",
        certificacoes: ["Montagem"],
        servicos: [
          {
            idServico: 1,
            titulo: "Montagem de mesa",
            descricao: "Montagem completa",
            precoBase: 123.45,
          },
        ],
      },
    }),
  );
  await page.route("**/api/profissionais/12/avaliacoes?*", (route) =>
    route.fulfill({ json: { itens: [], total: 0, pagina: 1, limite: 5 } }),
  );
  await page
    .locator('section[aria-labelledby="registered-title"]')
    .getByRole("button", { name: "Tentar novamente" })
    .click();
  await page
    .getByRole("link", { name: "Ver detalhes de Carolina Silva" })
    .click();
  await expect(page).toHaveURL(/profissionais\?profissional=12$/);
  await expect(
    page.getByText("Montagem completa", { exact: true }),
  ).toBeVisible();
});

test("login cabe na viewport e cadastro apresenta etapas para clientes", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/api/login", (route) =>
    route.fulfill({
      status: 401,
      json: { message: "E-mail ou senha inválidos." },
    }),
  );
  for (const [width, height] of [
    [320, 568],
    [390, 844],
    [768, 768],
    [769, 720],
    [860, 720],
    [1366, 768],
    [1440, 900],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto("/login");
    await page
      .getByLabel("E-mail", { exact: true })
      .fill("teste@example.invalid");
    await page.getByLabel("Senha", { exact: true }).fill("Senha!123");
    await page.getByRole("button", { name: "Logar", exact: true }).click();
    await expect(page.locator("form [role='alert']")).toContainText(
      "E-mail ou senha inválidos",
    );
    expect(
      await page.evaluate(() => document.documentElement.scrollHeight),
    ).toBeLessThanOrEqual(height);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    await expect(
      page.getByRole("link", { name: "Sou prestador", exact: true }),
    ).toBeInViewport();
    await page.screenshot({
      path: `test-results/login-compacto-${width}.png`,
      fullPage: true,
    });
  }
  await page.goto("/cadastro");
  await expect(page.locator("aside li")).toHaveCount(3);
  await expect(page.locator("aside")).toContainText("Compare os serviços");
  await expect(page.locator("aside blockquote")).toHaveCount(0);
  await page.screenshot({
    path: "test-results/cadastro-cliente-etapas.png",
    fullPage: true,
  });
});

test("topo permanece alinhado entre login e cadastros", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const [width, height] of [
    [320, 568],
    [390, 844],
    [768, 768],
    [769, 720],
    [860, 720],
    [1440, 900],
  ]) {
    await page.setViewportSize({ width, height });
    let reference: { x: number; y: number }[] | undefined;
    for (const path of ["/login", "/cadastro", "/cadastro/prestador"]) {
      await page.goto(path);
      const anchors = [
        page.getByRole("link", { name: "Voltar", exact: true }),
        page.locator("main h2").first(),
      ];
      if (width > 768)
        anchors.push(
          page.locator("aside a").first(),
          page.locator("aside h1"),
          page.locator("aside h1 + p"),
        );
      const positions = [];
      for (const anchor of anchors) {
        const box = await anchor.boundingBox();
        expect(box).not.toBeNull();
        positions.push({ x: box!.x, y: box!.y });
      }
      if (reference)
        positions.forEach((position, index) => {
          expect(Math.abs(position.x - reference![index].x)).toBeLessThan(2);
          expect(Math.abs(position.y - reference![index].y)).toBeLessThan(2);
        });
      else reference = positions;
      const back = await anchors[0].boundingBox();
      const account = await page.locator("main > a").nth(1).boundingBox();
      expect(back!.x + back!.width).toBeLessThanOrEqual(account!.x);
      if (width === 1440 || width === 320)
        await page.screenshot({
          path: `test-results/alinhamento-${path.replaceAll("/", "-")}-${width}.png`,
          fullPage: true,
        });
    }
  }
});
