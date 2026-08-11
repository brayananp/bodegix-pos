import { expect, test } from "@playwright/test";

/**
 * Tests E2E de navegación principal de Bodegix POS.
 *
 * Convención: buscamos el h1 del PageHeader (el título principal de la página),
 * no los h2 internos de los placeholders de contenido.
 */

test.describe("Bodegix POS — Navegación principal", () => {
	test("/ redirige automáticamente a /sale", async ({ page }) => {
		await page.goto("/");
		await expect(page).toHaveURL(/\/sale/);
	});

	test("la página de venta carga con el título correcto", async ({ page }) => {
		await page.goto("/sale");
		await expect(page).toHaveTitle(/Bodegix/);
		// h1 del PageHeader
		await expect(page.locator("h1").first()).toContainText("Punto de Venta");
	});

	test("navega a /products", async ({ page }) => {
		await page.goto("/products");
		await expect(page).toHaveURL(/\/products/);
		await expect(page.locator("h1").first()).toContainText("Productos");
	});

	test("navega a /inventory", async ({ page }) => {
		await page.goto("/inventory");
		await expect(page).toHaveURL(/\/inventory/);
		await expect(page.locator("h1").first()).toContainText("Inventario");
	});

	test("navega a /cash", async ({ page }) => {
		await page.goto("/cash");
		await expect(page).toHaveURL(/\/cash/);
		await expect(page.locator("h1").first()).toContainText("Caja");
	});

	test("navega a /summary", async ({ page }) => {
		await page.goto("/summary");
		await expect(page).toHaveURL(/\/summary/);
		await expect(page.locator("h1").first()).toContainText("Resumen");
	});

	test("navega a /settings", async ({ page }) => {
		await page.goto("/settings");
		await expect(page).toHaveURL(/\/settings/);
		await expect(page.locator("h1").first()).toContainText("Configuración");
	});

	test("vuelve a /sale desde otra ruta", async ({ page }) => {
		await page.goto("/settings");
		await page.goto("/sale");
		await expect(page).toHaveURL(/\/sale/);
		await expect(page.locator("h1").first()).toContainText("Punto de Venta");
	});

	test("muestra página 404 para rutas inexistentes", async ({ page }) => {
		await page.goto("/ruta-que-no-existe");
		await expect(page.getByText(/no encontrada/i).first()).toBeVisible();
	});
});

test.describe("Bodegix POS — Sidebar desktop", () => {
	test.use({ viewport: { width: 1280, height: 800 } });

	test("el sidebar de desktop está visible", async ({ page }) => {
		await page.goto("/sale");
		await expect(page.getByRole("complementary", { name: "Navegación principal" })).toBeVisible();
	});

	test("el link activo en sidebar tiene aria-current=page", async ({ page }) => {
		await page.goto("/sale");
		// El link de Venta debe estar marcado como página actual
		const activeLink = page
			.getByRole("complementary", { name: "Navegación principal" })
			.getByRole("link", { name: "Venta", exact: true });
		await expect(activeLink).toHaveAttribute("aria-current", "page");
	});

	test("/sales activa solo Historial y no Venta", async ({ page }) => {
		await page.goto("/sales");
		const sidebar = page.getByRole("complementary", { name: "Navegación principal" });
		await expect(sidebar.getByRole("link", { name: "Historial" })).toHaveAttribute(
			"aria-current",
			"page",
		);
		await expect(sidebar.getByRole("link", { name: "Venta", exact: true })).not.toHaveAttribute(
			"aria-current",
		);
	});

	test("navegar via clic en el sidebar", async ({ page }) => {
		await page.goto("/sale");
		await page
			.getByRole("complementary", { name: "Navegación principal" })
			.getByRole("link", { name: "Productos" })
			.click();
		await expect(page).toHaveURL(/\/products/);
	});

	test("el nombre Bodegix aparece en el sidebar", async ({ page }) => {
		await page.goto("/sale");
		await expect(
			page.getByRole("complementary", { name: "Navegación principal" }).getByText("Bodegix"),
		).toBeVisible();
	});
});

test.describe("Bodegix POS — Configuración responsive", () => {
	test.use({ viewport: { width: 887, height: 698 } });

	test("las pestañas no crean barras de desplazamiento internas", async ({ page }) => {
		await page.goto("/settings?section=general&panel=null");
		const tabs = page.getByRole("tablist");
		await expect(tabs).toBeVisible();

		const overflow = await tabs.evaluate((element) => ({
			horizontal: element.scrollWidth - element.clientWidth,
			verticalBehavior: getComputedStyle(element).overflowY,
		}));

		expect(overflow.horizontal).toBeLessThanOrEqual(0);
		expect(overflow.verticalBehavior).toBe("visible");
	});

	test("las pestañas no se superponen en pantallas muy estrechas", async ({ page }) => {
		await page.setViewportSize({ width: 319, height: 698 });
		await page.goto("/settings?section=general&panel=null");
		const tabs = page.getByRole("tablist");

		const layout = await tabs.evaluate((element) => ({
			pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
			containerVerticalOverflow: element.scrollHeight - element.clientHeight,
			tabs: [...element.children].map((tab) => ({
				clientWidth: tab.clientWidth,
				scrollWidth: tab.scrollWidth,
			})),
		}));

		expect(layout.pageOverflow).toBeLessThanOrEqual(0);
		expect(layout.containerVerticalOverflow).toBeLessThanOrEqual(0);
		for (const tab of layout.tabs) {
			expect(tab.scrollWidth).toBeLessThanOrEqual(tab.clientWidth);
		}
	});
});

test.describe("Bodegix POS — Navegación móvil", () => {
	test.use({ viewport: { width: 390, height: 844 } });

	test("prioriza operaciones abajo y mueve administración al encabezado", async ({ page }) => {
		await page.goto("/settings?section=general&panel=null");
		const bottomNav = page.getByRole("navigation", { name: "Navegación principal" });
		const bottomLinks = bottomNav.getByRole("link");

		await expect(bottomLinks).toHaveCount(5);
		await expect(bottomNav.getByRole("link", { name: "Ajustes de la bodega" })).toHaveCount(0);
		await expect(bottomNav.getByRole("link", { name: "Resumen y reportes diarios" })).toHaveCount(
			0,
		);

		const overflow = await bottomNav.evaluate(
			(element) => element.scrollWidth - element.clientWidth,
		);
		expect(overflow).toBeLessThanOrEqual(0);

		const headerNav = page.getByRole("navigation", { name: "Accesos secundarios" });
		await expect(headerNav.getByRole("link", { name: "Resumen y reportes diarios" })).toBeVisible();
		await expect(headerNav.getByRole("link", { name: "Ajustes de la bodega" })).toBeVisible();
	});

	test("la barra inferior está presente en móvil", async ({ page }) => {
		await page.goto("/sale");
		await expect(page.locator("nav").last()).toBeVisible();
	});

	test("navegar via barra inferior en móvil", async ({ page }) => {
		await page.goto("/sale");
		await page
			.locator("nav")
			.last()
			.getByRole("link", { name: /Catálogo de productos/i })
			.click();
		await expect(page).toHaveURL(/\/products/);
	});
});
