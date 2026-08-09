import { expect, type Page, test } from "@playwright/test";

test.setTimeout(60_000);

function captureBrowserErrors(page: Page): string[] {
	const errors: string[] = [];
	page.on("pageerror", (error) => errors.push(error.message));
	page.on("console", (message) => {
		if (message.type() === "error") errors.push(message.text());
	});
	return errors;
}

async function createProductWithStock(page: Page) {
	await page.goto("/products");
	await page.getByRole("button", { name: "Nuevo producto" }).click();
	await page.getByLabel("Nombre", { exact: true }).fill("Producto para anular");
	await page.getByLabel("Código de barras").fill("880006");
	await page.getByLabel("Precio de venta").fill("3.50");
	await page.getByLabel("Stock mínimo").fill("0");
	await page.getByRole("button", { name: "Crear producto" }).click();

	await page.goto("/inventory");
	await page.locator("button:visible", { hasText: "Producto para anular" }).first().click();
	await page.getByRole("button", { name: "Registrar stock inicial" }).click();
	await page.getByLabel("Cantidad inicial").fill("10");
	await page.getByRole("button", { name: "Registrar stock inicial" }).last().click();
	await expect(page.getByText("Stock actual").locator("..")).toContainText("10");
}

async function openCash(page: Page) {
	await page.goto("/cash");
	await page.getByRole("button", { name: "Abrir caja", exact: true }).click();
	await page.getByLabel("Efectivo inicial").fill("100");
	await page
		.getByRole("dialog", { name: "Abrir caja" })
		.getByRole("button", { name: "Abrir caja", exact: true })
		.click();
	await expect(page.getByRole("heading", { name: "Caja operativa" })).toBeVisible();
}

async function completeCashSale(page: Page, mobile: boolean) {
	await createProductWithStock(page);
	await openCash(page);
	await page.goto("/sale");
	await page.getByLabel("Buscar producto").fill("Producto para anular");
	await page.getByRole("button", { name: /Agregar Producto para anular/i }).click();
	if (mobile) await page.getByRole("button", { name: "Ver carrito" }).click();
	await page.getByRole("button", { name: "Cobrar" }).click();
	await page.getByLabel("Efectivo que entrega el cliente").fill("5.00");
	await page.getByRole("button", { name: "Confirmar venta" }).click();
	await expect(page.getByText("V-000001", { exact: true })).toBeVisible();
}

async function openFirstSale(page: Page, mobile: boolean) {
	await page.goto("/sales");
	await expect(page.getByRole("heading", { name: "Historial de ventas" })).toBeVisible();
	if (mobile) await page.getByRole("button", { name: /V-000001/ }).click();
	else await page.getByRole("button", { name: "Ver detalle" }).click();
	await expect(page.getByRole("heading", { name: "Detalle de venta" })).toBeVisible();
}

test("historial vacío, filtros tipados y estados distintos", async ({ page }) => {
	await page.goto("/sales");
	await expect(page.getByText("Todavía no hay ventas registradas.")).toBeVisible();
	await page.getByLabel("Estado").click();
	await page.getByRole("option", { name: "Anuladas" }).click();
	await expect(page).toHaveURL(/status=voided/);
	await page.getByRole("textbox", { name: "Buscar venta" }).fill("999");
	await page.getByRole("button", { name: "Buscar venta" }).click();
	await expect.poll(() => new URL(page.url()).searchParams.get("q")).toBe('"999"');
	await expect(page.getByText("Todavía no hay ventas registradas.")).toBeVisible();
});

test("consulta snapshots y anula en efectivo sin overlays anidados", async ({ page }, testInfo) => {
	const browserErrors = captureBrowserErrors(page);
	const mobile = testInfo.project.name === "mobile-chrome";
	await completeCashSale(page, mobile);
	await openFirstSale(page, mobile);
	await expect(page.getByText("Producto para anular", { exact: true }).first()).toBeVisible();
	await expect(page.getByText("Salida por venta")).toBeVisible();
	await page.reload();
	await expect(page.getByRole("heading", { name: "Detalle de venta" })).toBeVisible();

	await page.getByRole("button", { name: "Preparar anulación completa" }).click();
	await expect(page.getByRole("heading", { name: "Anular venta" })).toBeVisible();
	await expect(page.locator('[data-slot="sheet-content"]')).toHaveCount(1);
	await page.getByLabel("Motivo de anulación").click();
	await page.getByRole("option", { name: "Cliente canceló" }).click();
	await page.getByRole("checkbox", { name: /Confirmo que devolví/ }).click();
	await page.getByRole("button", { name: "Anular venta y restaurar stock" }).click();

	await expect(page.getByRole("heading", { name: "Venta anulada" })).toBeVisible();
	await expect(page.getByText("V-000001 fue anulada")).toBeVisible();
	await page.reload();
	await expect(page.getByText("V-000001 fue anulada")).toBeVisible();
	await page.getByRole("button", { name: "Volver al historial" }).click();
	await expect(
		page.locator('[data-slot="badge"]:visible').filter({ hasText: "Anulada" }),
	).toBeVisible();

	await page.goto("/inventory");
	await page.locator("button:visible", { hasText: "Producto para anular" }).first().click();
	await expect(page.getByText("Stock actual").locator("..")).toContainText("10");
	await page.goto("/cash");
	await expect(
		page.getByText("Efectivo esperado", { exact: true }).first().locator(".."),
	).toContainText(/100\.00/);
	expect(browserErrors).toEqual([]);
});

test("una caja cerrada no expone ninguna acción de anulación", async ({ page }, testInfo) => {
	const mobile = testInfo.project.name === "mobile-chrome";
	await completeCashSale(page, mobile);
	await page.goto("/cash");
	await page.getByRole("button", { name: "Cerrar caja" }).click();
	await page.getByLabel("Efectivo contado").fill("103.50");
	await page.getByRole("button", { name: "Confirmar cierre" }).click();
	await expect(page.locator('[data-slot="sheet-content"]')).toHaveCount(0);
	await openFirstSale(page, mobile);
	await expect(page.getByText("Anulación no disponible")).toBeVisible();
	await expect(page.getByRole("button", { name: "Preparar anulación completa" })).toHaveCount(0);
});
