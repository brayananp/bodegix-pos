import { expect, type Page, test } from "@playwright/test";

function captureBrowserErrors(page: Page): string[] {
	const errors: string[] = [];
	page.on("pageerror", (error) => errors.push(error.message));
	page.on("console", (message) => {
		if (message.type() === "error") errors.push(message.text());
	});
	return errors;
}

async function createCategory(page: Page, name: string) {
	await page.goto("/products?tab=categories");
	await page.getByRole("button", { name: "Nueva categoría" }).click();
	await page.getByLabel("Nombre", { exact: true }).fill(name);
	await page.getByRole("button", { name: "Crear categoría" }).click();
	await expect(page.getByText(name)).toBeVisible();
}

async function createProduct(
	page: Page,
	input: { name: string; minimumStock: string; category?: string },
) {
	await page.goto("/products");
	await page.getByRole("button", { name: "Nuevo producto" }).click();
	await page.getByLabel("Nombre", { exact: true }).fill(input.name);
	await page.getByLabel("Precio de venta").fill("3.50");
	await page.getByLabel("Stock mínimo").fill(input.minimumStock);
	if (input.category) {
		await page.getByLabel("Categoría", { exact: true }).click();
		await page.getByRole("option", { name: input.category }).click();
	}
	await page.getByRole("button", { name: "Crear producto" }).click();
	await expect(page.getByRole("heading", { name: "Nuevo producto" })).not.toBeVisible();
}

async function openInventoryDetail(page: Page, productName: string) {
	await page.locator("button:visible", { hasText: productName }).first().click();
	await expect(page.getByRole("heading", { name: "Detalle de inventario" })).toBeVisible();
}

async function initializeStock(page: Page, quantity: string) {
	await page.getByRole("button", { name: "Registrar stock inicial" }).click();
	await page.getByLabel("Cantidad inicial").fill(quantity);
	await page.getByRole("button", { name: "Registrar stock inicial" }).last().click();
	await expect(page.getByRole("heading", { name: "Detalle de inventario" })).toBeVisible();
}

async function reconcileStock(page: Page, quantity: string, reason: string) {
	await page.getByRole("button", { name: "Ajustar por conteo" }).click();
	await page.getByLabel("Cantidad contada").fill(quantity);
	await page.getByLabel("Motivo del conteo").fill(reason);
	await page.getByRole("button", { name: "Aplicar conciliación" }).click();
	await expect(page.getByRole("heading", { name: "Detalle de inventario" })).toBeVisible();
}

test("gestiona el ledger completo y conserva contexto, historial y cambios sin guardar", async ({
	page,
}, testInfo) => {
	const browserErrors = captureBrowserErrors(page);
	await createCategory(page, "Bebidas frías");
	await createProduct(page, {
		name: "Coca Cola 500 ml",
		minimumStock: "5",
		category: "Bebidas frías",
	});

	await page.goto("/inventory");
	await expect(page.getByRole("heading", { name: "Inventario" })).toBeVisible();
	await expect(page.locator("button:visible", { hasText: "Coca Cola 500 ml" })).toBeVisible();
	await expect(page.getByText("Sin movimientos").filter({ visible: true })).toBeVisible();
	await openInventoryDetail(page, "Coca Cola 500 ml");

	const sheetBox = await page.locator('[data-slot="sheet-content"]').boundingBox();
	expect(sheetBox).not.toBeNull();
	if (sheetBox) {
		const viewportWidth = await page.evaluate(() => innerWidth);
		if (testInfo.project.name === "mobile-chrome") {
			expect(sheetBox.width).toBeGreaterThanOrEqual(viewportWidth - 1);
		} else {
			expect(sheetBox.width).toBeGreaterThanOrEqual(560);
			expect(sheetBox.width).toBeLessThanOrEqual(720);
		}
	}

	await initializeStock(page, "10");
	let detail = page.getByRole("dialog", { name: "Detalle de inventario" });
	await expect(detail.getByText("Stock actual").locator("..")).toContainText("10");

	await page.getByRole("button", { name: "Registrar entrada" }).click();
	await page.getByLabel("Cantidad recibida").fill("5");
	await page.getByLabel("Referencia").fill("FAC-001");
	await page.getByRole("button", { name: "Registrar entrada" }).last().click();
	detail = page.getByRole("dialog", { name: "Detalle de inventario" });
	await expect(detail.getByText("Stock actual").locator("..")).toContainText("15");

	await reconcileStock(page, "12", "Conteo físico semanal");
	detail = page.getByRole("dialog", { name: "Detalle de inventario" });
	await expect(detail.getByText("-3")).toBeVisible();
	await page.getByRole("button", { name: "Registrar pérdida" }).click();
	await page.getByLabel("Cantidad retirada").fill("2");
	await page.getByLabel("Motivo").fill("Envase dañado");
	await page.getByRole("button", { name: "Registrar pérdida" }).last().click();
	detail = page.getByRole("dialog", { name: "Detalle de inventario" });
	await expect(detail.getByText("Stock actual").locator("..")).toContainText("10");

	await page.reload();
	detail = page.getByRole("dialog", { name: "Detalle de inventario" });
	await expect(detail.getByText("Stock actual").locator("..")).toContainText("10");
	await page.getByRole("button", { name: "Cerrar" }).first().click();

	await page.getByRole("tab", { name: "Movimientos" }).click();
	await expect(
		page.getByText("Entrada de mercadería").filter({ visible: true }).first(),
	).toBeVisible();
	await page.getByLabel("Tipo").click();
	await page.getByRole("option", { name: "Dañado" }).click();
	await expect(page.getByText("Dañado").filter({ visible: true }).first()).toBeVisible();
	await expect(page.getByText("Entrada de mercadería")).toHaveCount(0);

	await page.getByRole("tab", { name: "Stock" }).click();
	const search = page.getByLabel("Buscar producto");
	await search.fill("Coca Cola");
	await expect(page.locator("button:visible", { hasText: "Coca Cola 500 ml" })).toBeVisible();
	await openInventoryDetail(page, "Coca Cola 500 ml");
	await page.goBack();
	await expect(page.getByRole("heading", { name: "Detalle de inventario" })).not.toBeVisible();
	await expect(search).toHaveValue("Coca Cola");

	await openInventoryDetail(page, "Coca Cola 500 ml");
	await page.getByRole("button", { name: "Registrar entrada" }).click();
	await page.getByLabel("Cantidad recibida").fill("7");
	await page.getByRole("button", { name: "Cerrar" }).click();
	await expect(page.getByRole("heading", { name: "¿Descartar cambios?" })).toBeVisible();
	await page.getByRole("button", { name: "Seguir editando" }).click();
	await expect(page.getByLabel("Cantidad recibida")).toHaveValue("7");
	await page.getByRole("button", { name: "Cerrar" }).click();
	await page.getByRole("button", { name: "Descartar cambios" }).click();
	await expect(page.getByRole("heading", { name: "Registrar entrada" })).not.toBeVisible();
	expect(browserErrors).toEqual([]);
});

test("clasifica un producto como stock bajo y después como agotado", async ({ page }) => {
	const browserErrors = captureBrowserErrors(page);
	await createProduct(page, { name: "Producto de alerta", minimumStock: "5" });
	await page.goto("/inventory");
	await openInventoryDetail(page, "Producto de alerta");
	await initializeStock(page, "10");
	await reconcileStock(page, "4", "Conteo para alerta baja");
	await page.getByRole("button", { name: "Cerrar" }).first().click();
	await page.getByRole("combobox", { name: "Stock" }).click();
	await page.getByRole("option", { name: "Stock bajo" }).click();
	await expect(page.locator("button:visible", { hasText: "Producto de alerta" })).toBeVisible();
	await expect(
		page.locator('[data-slot="badge"]:visible').filter({ hasText: "Stock bajo" }),
	).toBeVisible();

	await openInventoryDetail(page, "Producto de alerta");
	await reconcileStock(page, "0", "Conteo confirmó agotamiento");
	await page.getByRole("button", { name: "Cerrar" }).first().click();
	await page.getByRole("combobox", { name: "Stock" }).click();
	await page.getByRole("option", { name: "Agotados" }).click();
	await expect(page.locator("button:visible", { hasText: "Producto de alerta" })).toBeVisible();
	await expect(
		page.locator('[data-slot="badge"]:visible').filter({ hasText: "Agotado" }),
	).toBeVisible();
	expect(browserErrors).toEqual([]);
});
