import { expect, type Page, test } from "@playwright/test";

const ROUTES = ["/", "/products", "/inventory", "/cash", "/sales", "/summary", "/settings"];

function guardBrowser(page: Page) {
	const errors: string[] = [];
	const externalRequests: string[] = [];
	page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
	page.on("console", (message) => {
		if (message.type() === "error") errors.push(`console: ${message.text()}`);
	});
	page.on("request", (request) => {
		const target = new URL(request.url());
		if (target.hostname !== "localhost" && target.hostname !== "127.0.0.1") {
			externalRequests.push(request.url());
		}
	});
	return { errors, externalRequests };
}

test("build real navega rutas críticas sin errores ni dependencias externas", async ({ page }) => {
	const guard = guardBrowser(page);
	for (const route of ROUTES) {
		const response = await page.goto(route);
		expect(response?.ok()).toBe(true);
		await expect(page.locator("body")).toContainText(
			/Bodegix|Venta|Productos|Inventario|Caja|Historial|Resumen|Configuración/,
		);
	}
	expect(guard.errors).toEqual([]);
	expect(guard.externalRequests).toEqual([]);
});

test("servidor entrega CSP y headers de seguridad compatibles", async ({ request }) => {
	const response = await request.get("/");
	expect(response.ok()).toBe(true);
	const headers = response.headers();
	expect(headers["content-security-policy"]).toContain("default-src 'self'");
	expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
	expect(headers["content-security-policy"]).not.toContain("unsafe-eval");
	expect(headers["x-content-type-options"]).toBe("nosniff");
	expect(headers["x-frame-options"]).toBe("DENY");
	expect(headers["referrer-policy"]).toBe("no-referrer");
});
