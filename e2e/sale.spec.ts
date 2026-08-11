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

async function createCategory(page: Page, name: string) {
	await page.goto("/products?tab=categories");
	await page.getByRole("button", { name: "Nueva categoría" }).click();
	await page.getByLabel("Nombre", { exact: true }).fill(name);
	await page.getByRole("button", { name: "Crear categoría" }).click();
	await expect(page.getByText(name)).toBeVisible();
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

test("aísla el desplazamiento horizontal de las categorías en móvil", async ({
	page,
}, testInfo) => {
	test.skip(testInfo.project.name !== "mobile-chrome");

	for (const category of ["Abarrotes", "Bebidas", "Lácteos", "Limpieza", "Panadería", "Snacks"]) {
		await createCategory(page, category);
	}

	await page.goto("/sale");
	const categoryFilter = page.getByRole("group", { name: "Filtrar por categoría" });
	await expect(categoryFilter).toBeVisible();

	const layout = await page.evaluate(() => {
		const filterViewport = document.querySelector('[data-slot="scroll-area-viewport"]');
		return {
			documentWidth: document.documentElement.scrollWidth,
			viewportWidth: document.documentElement.clientWidth,
			filterClientWidth: filterViewport?.clientWidth ?? 0,
			filterScrollWidth: filterViewport?.scrollWidth ?? 0,
		};
	});

	expect(layout.documentWidth).toBe(layout.viewportWidth);
	expect(layout.filterScrollWidth).toBeGreaterThan(layout.filterClientWidth);
	await expect(
		page.locator('[data-slot="scroll-area-scrollbar"][data-orientation="horizontal"]'),
	).toBeVisible();
});

test("mantiene fijo el resumen y desplaza solo los productos del carrito móvil", async ({
	page,
}, testInfo) => {
	test.skip(testInfo.project.name !== "mobile-chrome");

	const products = Array.from({ length: 7 }, (_, index) => ({
		name: `Producto carrito ${index + 1}`,
		barcode: `88000${index + 1}`,
		price: "1.00",
	}));
	for (const product of products) await createProductWithStock(page, product);
	await openCash(page);

	await page.goto("/sale");
	for (const product of products) {
		await addProductToCart(page, product.name, product.name);
		await page.getByLabel("Buscar producto").fill("");
	}
	await openMobileCart(page);

	const layout = await page.evaluate(() => {
		const sheet = document.querySelector('[data-slot="sheet-content"]');
		const list = document.querySelector('[aria-label="Ítems del carrito"]');
		const listViewport = list
			?.closest('[data-slot="scroll-area"]')
			?.querySelector('[data-slot="scroll-area-viewport"]');
		const actions = [...document.querySelectorAll("button")].find(
			(button) => button.textContent?.trim() === "Cobrar",
		)?.parentElement;
		return {
			viewportHeight: innerHeight,
			sheetHeight: sheet?.getBoundingClientRect().height ?? 0,
			listClientHeight: listViewport?.clientHeight ?? 0,
			listScrollHeight: listViewport?.scrollHeight ?? 0,
			actionsBottom: actions?.getBoundingClientRect().bottom ?? Number.POSITIVE_INFINITY,
			sheetBottom: sheet?.getBoundingClientRect().bottom ?? 0,
		};
	});

	expect(layout.sheetHeight).toBeLessThanOrEqual(layout.viewportHeight * 0.93);
	expect(layout.listScrollHeight).toBeGreaterThan(layout.listClientHeight);
	expect(layout.actionsBottom).toBeLessThanOrEqual(layout.sheetBottom);
});

test("abre el cobro desde arriba y no ofrece otro pago cuando el total está cubierto", async ({
	page,
}, testInfo) => {
	test.setTimeout(60_000);
	test.skip(testInfo.project.name !== "chromium");

	const products = Array.from({ length: 7 }, (_, index) => ({
		name: `Producto cobro ${index + 1}`,
		barcode: `99000${index + 1}`,
		price: "1.00",
	}));
	for (const product of products) await createProductWithStock(page, product);
	await openCash(page);

	await page.goto("/sale");
	for (const product of products) {
		await addProductToCart(page, product.name, product.name);
		await page.getByLabel("Buscar producto").fill("");
	}
	await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
	expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
	await page.getByRole("button", { name: "Cobrar" }).click();

	await expect(page.getByRole("heading", { name: "Cobrar" })).toBeVisible();
	await expect
		.poll(async () => (await page.getByRole("heading", { name: "Cobrar" }).boundingBox())?.y ?? 999)
		.toBeLessThan(100);
	await expect(page.getByRole("button", { name: "+ Agregar método de pago" })).toHaveCount(0);

	await page.getByLabel("Importe del pago 1").fill("3.00");
	await page.getByRole("button", { name: "+ Agregar método de pago" }).click();
	await expect(page.getByLabel("Importe del pago 2")).toHaveValue("4.00");
	await expect(page.getByText("Pago 2 · Yape")).toBeVisible();
	await expect(page.getByRole("button", { name: "+ Agregar método de pago" })).toHaveCount(0);

	await page.getByRole("combobox", { name: "Método" }).nth(1).click();
	await expect(page.getByRole("option", { name: "Efectivo" })).toHaveCount(0);
});
