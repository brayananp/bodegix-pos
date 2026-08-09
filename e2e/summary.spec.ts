import { expect, type Page, test } from "@playwright/test";

test.setTimeout(60_000);

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

async function completeSale(page: Page, mobile: boolean) {
	await page.goto("/products");
	await page.getByRole("button", { name: "Nuevo producto" }).click();
	await page.getByLabel("Nombre", { exact: true }).fill("Producto resumen");
	await page.getByLabel("Código de barras").fill("880007");
	await page.getByLabel("Precio de venta").fill("3.50");
	await page.getByLabel("Stock mínimo").fill("2");
	await page.getByRole("button", { name: "Crear producto" }).click();
	await expect(page.getByText("Producto creado")).toBeVisible();

	await page.goto("/inventory");
	const product = page.locator("button:visible", { hasText: "Producto resumen" }).first();
	await expect(product).toBeVisible();
	await product.click();
	await page.getByRole("button", { name: "Registrar stock inicial" }).click();
	await page.getByLabel("Cantidad inicial").fill("10");
	await page.getByRole("button", { name: "Registrar stock inicial" }).last().click();
	await expect(page.getByText("Stock actual").locator("..")).toContainText("10");

	await openCash(page);
	await page.goto("/sale");
	await page.getByLabel("Buscar producto").fill("Producto resumen");
	await page.getByRole("button", { name: /Agregar Producto resumen/i }).click();
	if (mobile) await page.getByRole("button", { name: "Ver carrito" }).click();
	await page.getByRole("button", { name: "Cobrar" }).click();
	await page.getByLabel("Efectivo que entrega el cliente").fill("5.00");
	await page.getByRole("button", { name: "Confirmar venta" }).click();
	await expect(page.getByText("V-000001", { exact: true })).toBeVisible();
}

test("resumen vacío, fecha en URL y navegación sin futuro", async ({ page }) => {
	await page.goto("/summary");
	await expect(page.getByRole("heading", { name: "Resumen operativo" })).toBeVisible();
	await expect(page.getByText("Sin actividad registrada")).toBeVisible();
	await expect(page.getByRole("button", { name: "Día siguiente" })).toBeDisabled();
	await page.getByRole("button", { name: "Día anterior" }).click();
	await expect.poll(() => new URL(page.url()).searchParams.has("date")).toBe(true);
	await expect(page.getByRole("button", { name: "Día siguiente" })).toBeEnabled();
	await page.getByRole("button", { name: "Hoy" }).click();
	await expect(page.getByRole("button", { name: "Día siguiente" })).toBeDisabled();
});

test("una caja abierta aparece en el checklist y enlaza a Caja", async ({ page }) => {
	await openCash(page);
	await page.goto("/summary");
	await expect(page.getByText("Caja pendiente de cierre")).toBeVisible();
	await page.getByText("Ir a caja", { exact: true }).click();
	await expect(page).toHaveURL(/\/cash/);
	await expect(page.getByRole("heading", { name: "Caja operativa" })).toBeVisible();
});

test("proyecta una venta real y conserva enlaces cruzados", async ({ page }, testInfo) => {
	await completeSale(page, testInfo.project.name === "mobile-chrome");
	await page.goto("/summary");
	await expect(page.getByText("Ventas válidas", { exact: true }).locator("..")).toContainText("1");
	await expect(page.getByText("Total vendido", { exact: true }).locator("..")).toContainText(
		/3[.,]50/,
	);
	await expect(page.getByText("Producto resumen")).toBeVisible();
	await page.getByRole("link", { name: "Ver todas las ventas" }).click();
	await expect(page).toHaveURL(/\/sales/);
	await expect.poll(() => new URL(page.url()).searchParams.get("range")).toBe("custom");
	await expect(
		page
			.locator("strong:visible, td:visible")
			.filter({ hasText: /^V-000001$/ })
			.first(),
	).toBeVisible();
});

test("las secciones responden sin desbordar el viewport", async ({ page }) => {
	await page.goto("/summary?section=inventory&date=2999-01-01");
	await expect(page.getByRole("tab", { name: "Inventario" })).toHaveAttribute("data-active");
	await expect(page.getByText("Estado actual del inventario")).toBeVisible();
	const overflow = await page.evaluate(
		() => document.documentElement.scrollWidth - window.innerWidth,
	);
	expect(overflow).toBeLessThanOrEqual(1);
});
