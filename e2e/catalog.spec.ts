import { expect, test } from "@playwright/test";

test("gestiona categorías y productos desde overlays conservando contexto", async ({
	page,
}, testInfo) => {
	const browserErrors: string[] = [];
	page.on("pageerror", (error) => browserErrors.push(error.message));
	page.on("console", (message) => {
		if (message.type() === "error") browserErrors.push(message.text());
	});
	await page.goto("/products");
	await expect(page.getByRole("heading", { name: "Productos", exact: true })).toBeVisible();

	await page.getByRole("tab", { name: "Categorías" }).click();
	await page.getByRole("button", { name: "Nueva categoría" }).click();
	await expect(page.getByRole("heading", { name: "Nueva categoría" })).toBeVisible();
	if (testInfo.project.name === "mobile-chrome") {
		await expect(page.locator('[data-slot="drawer-popup"]')).toBeVisible();
		await expect(page.locator('[data-slot="dialog-content"]')).toHaveCount(0);
	} else {
		await expect(page.locator('[data-slot="dialog-content"]')).toBeVisible();
		await expect(page.locator('[data-slot="drawer-popup"]')).toHaveCount(0);
	}
	await page.getByLabel("Nombre", { exact: true }).fill("Bebidas frías");
	await page.getByRole("button", { name: "Crear categoría" }).click();
	await expect(page.getByText("Bebidas frías")).toBeVisible();

	await page.getByRole("tab", { name: "Productos" }).click();
	await page.getByRole("button", { name: "Nuevo producto" }).click();
	await expect(page.getByRole("heading", { name: "Nuevo producto" })).toBeVisible();
	const sheetBox = await page.locator('[data-slot="sheet-content"]').boundingBox();
	expect(sheetBox).not.toBeNull();
	if (sheetBox) {
		if (testInfo.project.name === "mobile-chrome") {
			expect(sheetBox.width).toBeGreaterThanOrEqual((await page.evaluate(() => innerWidth)) - 1);
		} else {
			expect(sheetBox.width).toBeGreaterThanOrEqual(560);
			expect(sheetBox.width).toBeLessThanOrEqual(720);
		}
	}
	await page.getByLabel("Nombre", { exact: true }).fill("Agua mineral 500 ml");
	await page.getByLabel("Código de barras").fill("00012345");
	await page.getByLabel("Categoría", { exact: true }).click();
	await page.getByRole("option", { name: "Bebidas frías" }).click();
	await page.getByLabel("Precio de venta").fill("3.50");
	await page.getByLabel("Costo").fill("1.20");
	await page.getByLabel("Stock mínimo").fill("4");
	await expect(page.getByText("Stock actual: 0")).toBeVisible();
	await page.getByRole("button", { name: "Crear producto" }).click();
	await expect(page.getByRole("heading", { name: "Nuevo producto" })).not.toBeVisible();

	await page.getByRole("button", { name: "Ver" }).click();
	await expect(page.getByRole("heading", { name: "Detalle del producto" })).toBeVisible();
	await expect(page.getByText("Stock actual").last()).toBeVisible();
	await page.getByRole("button", { name: "Editar producto" }).click();
	await expect(page.getByRole("heading", { name: "Editar producto" })).toBeVisible();
	await page.getByLabel("Precio de venta").fill("4.20");
	await page.getByRole("button", { name: "Guardar cambios" }).click();
	await expect(page.getByRole("heading", { name: "Detalle del producto" })).toBeVisible();
	await expect(
		page.getByRole("dialog", { name: "Detalle del producto" }).getByText(/4[,.]20/),
	).toBeVisible();
	await page.getByRole("button", { name: "Cerrar" }).first().click();

	await page.reload();
	await expect(page.locator("button:visible", { hasText: "Agua mineral 500 ml" })).toBeVisible();
	const search = page.getByLabel("Buscar productos por nombre o código");
	await search.fill("00012345");
	await expect(page.locator("button:visible", { hasText: "Agua mineral 500 ml" })).toBeVisible();
	await search.fill("Agua mineral");
	await expect(page.locator("button:visible", { hasText: "Agua mineral 500 ml" })).toBeVisible();

	await page.getByRole("button", { name: "Desactivar" }).click();
	await expect(page.getByRole("heading", { name: "¿Desactivar registro?" })).toBeVisible();
	await page.getByRole("button", { name: "Desactivar", exact: true }).last().click();
	await page.getByLabel("Filtrar por estado").click();
	await page.getByRole("option", { name: "Todos" }).click();
	await expect(
		page.locator('[data-slot="badge"]:visible').filter({ hasText: /^Inactivo$/ }),
	).toBeVisible();
	await page
		.getByRole("tabpanel", { name: "Productos" })
		.getByRole("button", { name: "Reactivar" })
		.click();
	await page.locator('[data-slot="alert-dialog-action"]').click();
	await expect(
		page.locator('[data-slot="badge"]:visible').filter({ hasText: /^Activo$/ }),
	).toBeVisible();

	await page
		.getByRole("tabpanel", { name: "Productos" })
		.getByRole("button", { name: "Editar" })
		.click();
	await page.getByLabel("Nombre", { exact: true }).fill("Agua modificada sin guardar");
	await page.getByRole("button", { name: "Cerrar" }).click();
	await expect(page.getByRole("heading", { name: "¿Descartar cambios?" })).toBeVisible();
	await page.getByRole("button", { name: "Seguir editando" }).click();
	await expect(page.getByLabel("Nombre", { exact: true })).toHaveValue(
		"Agua modificada sin guardar",
	);
	await page.getByRole("button", { name: "Cerrar" }).click();
	await page.getByRole("button", { name: "Descartar cambios" }).click();
	await expect(page.getByRole("heading", { name: "Editar producto" })).not.toBeVisible();

	await page.getByRole("button", { name: "Ver" }).click();
	await page.goBack();
	await expect(page.getByRole("heading", { name: "Detalle del producto" })).not.toBeVisible();
	await expect(page.locator("button:visible", { hasText: "Agua mineral 500 ml" })).toBeVisible();

	await search.fill("");
	await page.getByRole("tab", { name: "Categorías" }).click();
	await page
		.getByRole("tabpanel", { name: "Categorías" })
		.getByRole("button", { name: "Editar" })
		.click();
	await expect(page.getByRole("heading", { name: "Editar categoría" })).toBeVisible();
	await page.getByLabel("Nombre", { exact: true }).fill("Bebidas y jugos");
	await page.getByRole("button", { name: "Guardar cambios" }).click();
	await expect(page.getByText("Bebidas y jugos")).toBeVisible();
	await page.getByRole("button", { name: "Desactivar" }).click();
	await page.getByRole("button", { name: "Desactivar", exact: true }).last().click();
	await expect(
		page.locator('[data-slot="badge"]:visible').filter({ hasText: /^Inactiva$/ }),
	).toBeVisible();
	await page
		.getByRole("tabpanel", { name: "Categorías" })
		.getByRole("button", { name: "Reactivar" })
		.click();
	await page.locator('[data-slot="alert-dialog-action"]').click();
	await expect(
		page.locator('[data-slot="badge"]:visible').filter({ hasText: /^Activa$/ }),
	).toBeVisible();
	expect(browserErrors).toEqual([]);
});
