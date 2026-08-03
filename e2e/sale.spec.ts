import { expect, type Page, test } from "@playwright/test";

function captureBrowserErrors(page: Page): string[] {
	const errors: string[] = [];
	page.on("pageerror", (error) => errors.push(error.message));
	page.on("console", (message) => {
		if (message.type() === "error") errors.push(message.text());
	});
	return errors;
}

async function createProductWithStock(
	page: Page,
	input: { name: string; barcode: string; price: string; stock?: string },
) {
	await page.goto("/products");
	await page.getByRole("button", { name: "Nuevo producto" }).click();
	await page.getByLabel("Nombre", { exact: true }).fill(input.name);
	await page.getByLabel("Código de barras").fill(input.barcode);
	await page.getByLabel("Precio de venta").fill(input.price);
	await page.getByLabel("Stock mínimo").fill("0");
	await page.getByRole("button", { name: "Crear producto" }).click();
	await expect(page.getByRole("heading", { name: "Nuevo producto" })).not.toBeVisible();

	await page.goto("/inventory");
	await page.locator("button:visible", { hasText: input.name }).first().click();
	await expect(page.getByRole("heading", { name: "Detalle de inventario" })).toBeVisible();
	await page.getByRole("button", { name: "Registrar stock inicial" }).click();
	await page.getByLabel("Cantidad inicial").fill(input.stock ?? "10");
	await page.getByRole("button", { name: "Registrar stock inicial" }).last().click();
	await expect(page.getByRole("heading", { name: "Detalle de inventario" })).toBeVisible();
}

async function openCash(page: Page, amount = "100") {
	await page.goto("/cash");
	await page.getByRole("button", { name: "Abrir caja", exact: true }).click();
	await page.getByLabel("Efectivo inicial").fill(amount);
	await page
		.getByRole("dialog", { name: "Abrir caja" })
		.getByRole("button", { name: "Abrir caja", exact: true })
		.click();
	await expect(page.getByRole("heading", { name: "Caja operativa" })).toBeVisible();
}

async function addProductToCart(page: Page, search: string, productName: string) {
	await page.getByLabel("Buscar producto").fill(search);
	await page.getByRole("button", { name: new RegExp(`Agregar ${productName}`, "i") }).click();
}

async function openMobileCart(page: Page) {
	await page.getByRole("button", { name: "Ver carrito" }).click();
	await expect(page.getByRole("heading", { name: "Carrito" })).toBeVisible();
}

test("completa venta en efectivo con carrito persistido", async ({ page }, testInfo) => {
	const browserErrors = captureBrowserErrors(page);
	await createProductWithStock(page, {
		name: "Agua mineral 500 ml",
		barcode: "770001",
		price: "3.50",
	});
	await openCash(page);

	await page.goto("/sale");
	await expect(page.getByRole("heading", { name: "Punto de Venta" })).toBeVisible();
	await addProductToCart(page, "Agua mineral", "Agua mineral");

	if (testInfo.project.name === "mobile-chrome") {
		await openMobileCart(page);
	}

	await page.getByRole("button", { name: "Cobrar" }).click();
	await expect(page.getByText("Total a cobrar")).toBeVisible();
	await page.getByLabel("Efectivo que entrega el cliente").fill("10.00");
	await expect(page.getByText(/Vuelto:/)).toBeVisible();
	await page.getByRole("button", { name: "Confirmar venta" }).click();
	// Verificar que la venta se completó buscando el número de venta
	await expect(page.getByText("V-000001", { exact: true })).toBeVisible();
	await expect(
		page.getByLabel("Venta completada").getByText("V-000001", { exact: true }),
	).toBeVisible();

	await page.reload();
	await expect(page.getByLabel("Buscar producto")).toBeVisible();
	await page.getByRole("button", { name: "Nueva venta" }).click();
	expect(browserErrors).toEqual([]);
});

test("rechaza cobro sin caja abierta", async ({ page }, testInfo) => {
	await createProductWithStock(page, {
		name: "Pan integral",
		barcode: "770002",
		price: "2.00",
	});
	await page.goto("/sale");
	await addProductToCart(page, "Pan integral", "Pan integral");

	if (testInfo.project.name === "mobile-chrome") {
		await openMobileCart(page);
	}

	await expect(page.getByRole("button", { name: "Cobrar" })).toBeDisabled();
	await expect(page.getByText(/Abrir caja/i)).toBeVisible();
});
