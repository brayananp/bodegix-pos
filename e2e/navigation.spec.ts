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

test.describe("Bodegix POS — Navegación móvil", () => {
	test.use({ viewport: { width: 390, height: 844 } });

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
