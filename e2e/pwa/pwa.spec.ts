import { expect, type BrowserContext, type Page, test } from "@playwright/test";

async function setAppOffline(context: BrowserContext, page: Page) {
	await context.setOffline(true);
	await page.evaluate(() => window.dispatchEvent(new Event("offline")));
}

async function preparePwa(page: Page) {
	await page.goto("/sale");
	await page.evaluate(async () => {
		await navigator.serviceWorker.ready;
	});
	if (!(await page.evaluate(() => navigator.serviceWorker.controller !== null))) {
		await page.reload();
	}
	await expect
		.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null))
		.toBe(true);
	await expect
		.poll(() =>
			page.evaluate(async () => {
				for (const key of await caches.keys()) {
					const cache = await caches.open(key);
					if ((await cache.keys()).some((request) => new URL(request.url).pathname === "/")) {
						return true;
					}
				}
				return false;
			}),
		)
		.toBe(true);
}

async function createProductWithStock(page: Page) {
	await page.goto("/products");
	await page.getByRole("button", { name: "Nuevo producto" }).click();
	await page.getByLabel("Nombre", { exact: true }).fill("Agua offline");
	await page.getByLabel("Código de barras").fill("990001");
	await page.getByLabel("Precio de venta").fill("3.50");
	await page.getByLabel("Stock mínimo").fill("0");
	await page.getByRole("button", { name: "Crear producto" }).click();
	await expect(page.getByRole("heading", { name: "Nuevo producto" })).not.toBeVisible();
	await page.goto("/inventory");
	await page.locator("button:visible", { hasText: "Agua offline" }).first().click();
	await page.getByRole("button", { name: "Registrar stock inicial" }).click();
	await page.getByLabel("Cantidad inicial").fill("10");
	await page.getByRole("button", { name: "Registrar stock inicial" }).last().click();
	await expect(page.getByRole("heading", { name: "Registrar stock inicial" })).not.toBeVisible();
}

test("manifest, registro, control y precache son válidos", async ({ page, request }) => {
	await preparePwa(page);
	const manifestResponse = await request.get("/manifest.webmanifest");
	expect(manifestResponse.ok()).toBe(true);
	expect(manifestResponse.headers()["content-type"]).toContain("application/manifest+json");
	const manifest = await manifestResponse.json();
	expect(manifest).toMatchObject({
		id: "/",
		name: "Bodegix POS",
		short_name: "Bodegix",
		start_url: "/sale",
		scope: "/",
		display: "standalone",
		orientation: "any",
		lang: "es-PE",
		theme_color: "#16a34a",
		background_color: "#ffffff",
	});
	for (const icon of manifest.icons) {
		const response = await request.get(icon.src);
		expect(response.ok(), icon.src).toBe(true);
		expect(response.headers()["content-type"]).toBe("image/png");
	}
	expect(manifest.icons).toEqual(
		expect.arrayContaining([
			expect.objectContaining({ sizes: "192x192" }),
			expect.objectContaining({ sizes: "512x512" }),
			expect.objectContaining({ sizes: "512x512", purpose: "maskable" }),
		]),
	);

	const cacheUrls = await page.evaluate(async () => {
		const urls: string[] = [];
		for (const key of await caches.keys()) {
			const cache = await caches.open(key);
			urls.push(...(await cache.keys()).map((request) => new URL(request.url).pathname));
		}
		return urls;
	});
	expect(cacheUrls).toContain("/");
	expect(cacheUrls.some((url) => url.endsWith(".bodegix"))).toBe(false);
	expect(cacheUrls.some((url) => url.startsWith("/api/"))).toBe(false);
});

test("navega rutas directas y conserva IndexedDB offline", async ({ page, context }) => {
	await createProductWithStock(page);
	await preparePwa(page);
	await setAppOffline(context, page);

	const routes = [
		["/sale", "Punto de Venta"],
		["/products", "Productos"],
		["/inventory", "Inventario"],
		["/cash", "Caja"],
		["/sales", "Historial de Ventas"],
		["/summary", "Resumen"],
		["/settings", "Configuración"],
	] as const;
	for (const [route, heading] of routes) {
		await page.goto(route);
		await expect(page.getByRole("heading", { name: heading }).first()).toBeVisible();
	}
	await page.goto("/products");
	await page.evaluate(() => window.dispatchEvent(new Event("offline")));
	await expect(page.getByText("Agua offline").first()).toBeVisible();
	await expect(page.getByText(/Bodegix continúa funcionando/)).toBeVisible();
});

test("venta, caja y respaldo funcionan offline", async ({ page, context }) => {
	await page.addInitScript(() => {
		Object.defineProperty(window, "showSaveFilePicker", { configurable: true, value: undefined });
	});
	await createProductWithStock(page);
	await preparePwa(page);
	await setAppOffline(context, page);

	await page.goto("/cash");
	await page.getByRole("button", { name: "Abrir caja", exact: true }).click();
	await page.getByLabel("Efectivo inicial").fill("100");
	await page
		.getByRole("dialog", { name: "Abrir caja" })
		.getByRole("button", { name: "Abrir caja", exact: true })
		.click();
	await expect(page.getByRole("heading", { name: "Caja operativa" })).toBeVisible();

	await page.goto("/sale");
	await page.getByLabel("Buscar producto").fill("Agua offline");
	await page.getByRole("button", { name: /Agregar Agua offline/i }).click();
	await page.getByRole("button", { name: "Cobrar" }).click();
	await page.getByLabel("Efectivo que entrega el cliente").fill("10.00");
	await page.getByRole("button", { name: "Confirmar venta" }).click();
	await expect(page.getByText("V-000001", { exact: true })).toBeVisible();

	await page.goto("/cash");
	await page.getByRole("button", { name: "Registrar depósito" }).click();
	await page.getByLabel("Importe del depósito").fill("20");
	await page.getByLabel("Motivo").fill("Operación offline");
	await page
		.getByRole("dialog", { name: "Registrar depósito" })
		.getByRole("button", { name: "Registrar depósito", exact: true })
		.click();
	await expect(
		page.getByText("Efectivo esperado", { exact: true }).first().locator(".."),
	).toContainText(/123\.50/);

	await page.getByRole("link", { name: "Configuración" }).click();
	await page.getByRole("tab", { name: "Datos y respaldos" }).click();
	await page.getByRole("button", { name: "Crear respaldo", exact: true }).click();
	const downloadPromise = page.waitForEvent("download");
	await page.getByRole("button", { name: "Crear y guardar respaldo" }).click();
	const download = await downloadPromise;
	expect(download.suggestedFilename()).toMatch(/\.bodegix$/);
	await page.getByRole("button", { name: "Cerrar", exact: true }).click();

	await page.getByRole("link", { name: "Inventario" }).click();
	await expect(page.getByText("Agua offline").first()).toBeVisible();
});
