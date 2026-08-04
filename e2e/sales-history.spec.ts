import { expect, test } from "@playwright/test";

test.describe("Historial de Ventas", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
		// Esperar a que la base de datos esté lista
		await page.waitForSelector('[data-testid="app-ready"], text="Venta"', { timeout: 10000 });
	});

	test("debe mostrar la página de historial de ventas", async ({ page }) => {
		// Navegar a historial de ventas
		await page.click('a[href="/sales"]');
		await page.waitForURL("/sales");

		// Verificar elementos principales
		await expect(page.getByRole("heading", { name: "Historial de Ventas" })).toBeVisible();
		await expect(page.getByText("Consulta y gestiona las ventas registradas")).toBeVisible();

		// Verificar filtros
		await expect(
			page.getByPlaceholder("Buscar por número, producto o referencia..."),
		).toBeVisible();
		await expect(page.getByRole("button", { name: "Buscar" })).toBeVisible();
	});

	test("debe filtrar ventas por estado", async ({ page }) => {
		await page.goto("/sales");

		// Abrir selector de estado
		const statusSelect = page.locator('[aria-label="Estado"]').or(page.getByText("Todos").first());
		await statusSelect.click();

		// Seleccionar "Completadas"
		await page.getByRole("option", { name: "Completadas" }).click();

		// Verificar que la URL se actualiza
		await page.waitForURL(/\/sales\?.*status=completed/);
	});

	test("debe filtrar ventas por método de pago", async ({ page }) => {
		await page.goto("/sales");

		// Abrir selector de método
		const methodSelect = page
			.locator('[aria-label="Método de pago"]')
			.or(page.getByText("Todos los métodos").first());
		await methodSelect.click();

		// Seleccionar "Efectivo"
		await page.getByRole("option", { name: "Efectivo" }).click();

		// Verificar que la URL se actualiza
		await page.waitForURL(/\/sales\?.*method=cash/);
	});

	test("debe buscar ventas por texto", async ({ page }) => {
		await page.goto("/sales");

		// Ingresar texto de búsqueda
		const searchInput = page.getByPlaceholder("Buscar por número, producto o referencia...");
		await searchInput.fill("test");

		// Hacer clic en buscar
		await page.getByRole("button", { name: "Buscar" }).click();

		// Verificar que la URL se actualiza
		await page.waitForURL(/\/sales\?.*search=test/);
	});

	test("debe buscar ventas con Enter", async ({ page }) => {
		await page.goto("/sales");

		// Ingresar texto y presionar Enter
		const searchInput = page.getByPlaceholder("Buscar por número, producto o referencia...");
		await searchInput.fill("venta");
		await searchInput.press("Enter");

		// Verificar que la URL se actualiza
		await page.waitForURL(/\/sales\?.*search=venta/);
	});

	test("debe mostrar estado vacío cuando no hay ventas", async ({ page }) => {
		await page.goto("/sales?search=nonexistent12345");

		// Verificar mensaje de estado vacío
		await expect(page.getByText("No hay ventas")).toBeVisible();
		await expect(
			page.getByText("No se encontraron ventas con los filtros seleccionados"),
		).toBeVisible();
	});

	test("debe navegar entre páginas", async ({ page }) => {
		await page.goto("/sales");

		// Esperar a que carguen las ventas
		await page.waitForTimeout(500);

		// Verificar botones de paginación (si hay múltiples páginas)
		const nextButton = page.getByRole("button", { name: "Siguiente" });
		const prevButton = page.getByRole("button", { name: "Anterior" });

		// El botón anterior debe estar deshabilitado en página 1
		await expect(prevButton).toBeDisabled();

		// Si hay más páginas, probar navegación
		if (await nextButton.isEnabled()) {
			await nextButton.click();
			await page.waitForURL(/\/sales\?.*page=2/);
			await expect(prevButton).toBeEnabled();
		}
	});

	test("debe abrir el detalle de una venta al hacer clic", async ({ page }) => {
		// Crear una venta primero
		await page.goto("/sale");
		await page.waitForTimeout(500);

		// Verificar que hay productos o agregar uno si es necesario
		const productCard = page.locator('[role="button"]').first();
		if (await productCard.isVisible()) {
			await productCard.click();
		}

		// Si hay carrito, proceder al checkout (esto depende del flujo real)
		// Este test asume que ya hay ventas registradas

		// Ir al historial
		await page.goto("/sales");
		await page.waitForTimeout(500);

		// Hacer clic en la primera venta
		const firstSale = page.locator('[role="button"]').first();
		if (await firstSale.isVisible()) {
			await firstSale.click();

			// Verificar que se abre el Sheet de detalle
			await expect(page.getByText("Detalle de venta")).toBeVisible();
			await expect(page.getByRole("button", { name: "Cerrar" })).toBeVisible();
		}
	});

	test("debe cerrar el detalle al hacer clic en Cerrar", async ({ page }) => {
		await page.goto("/sales");
		await page.waitForTimeout(500);

		// Abrir detalle
		const firstSale = page.locator('[role="button"]').first();
		if (await firstSale.isVisible()) {
			await firstSale.click();
			await expect(page.getByText("Detalle de venta")).toBeVisible();

			// Cerrar
			await page.getByRole("button", { name: "Cerrar" }).click();

			// Verificar que se cerró
			await expect(page.getByText("Detalle de venta")).not.toBeVisible();
		}
	});

	test("debe ser accesible por teclado", async ({ page }) => {
		await page.goto("/sales");
		await page.waitForTimeout(500);

		// Navegar con Tab hasta la primera venta
		await page.keyboard.press("Tab");
		await page.keyboard.press("Tab");

		// Si hay una venta, debe poder abrirse con Enter
		const firstSale = page.locator('[role="button"]:focus').first();
		if (await firstSale.isVisible()) {
			await page.keyboard.press("Enter");
			await expect(page.getByText("Detalle de venta")).toBeVisible();

			// Cerrar con Escape
			await page.keyboard.press("Escape");
			await expect(page.getByText("Detalle de venta")).not.toBeVisible();
		}
	});

	test("debe mantener filtros al navegar de regreso", async ({ page }) => {
		await page.goto("/sales?status=completed&method=cash&search=test&page=1");

		// Verificar que los filtros se mantienen
		const statusSelect = page.locator('button:has-text("Completadas")');
		await expect(statusSelect).toBeVisible();

		const methodSelect = page.locator('button:has-text("Efectivo")');
		await expect(methodSelect).toBeVisible();

		const searchInput = page.getByPlaceholder("Buscar por número, producto o referencia...");
		await expect(searchInput).toHaveValue("test");
	});

	test("debe mostrar badge con total de ventas", async ({ page }) => {
		await page.goto("/sales");
		await page.waitForTimeout(500);

		// Verificar que hay un badge con el conteo
		const badge = page.locator('[class*="badge"]').filter({ hasText: /ventas?$/ });
		await expect(badge).toBeVisible();
	});
});
