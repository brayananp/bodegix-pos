import { expect, type Page, test } from "@playwright/test";

function captureBrowserErrors(page: Page): string[] {
	const errors: string[] = [];
	page.on("pageerror", (error) => errors.push(error.message));
	page.on("console", (message) => {
		if (message.type() === "error") errors.push(message.text());
	});
	return errors;
}

async function submitCashDialog(page: Page, name: string) {
	await page.getByRole("dialog", { name }).getByRole("button", { name, exact: true }).click();
}

test("completa apertura, movimientos, arqueo, historial y persistencia", async ({
	page,
}, testInfo) => {
	const browserErrors = captureBrowserErrors(page);
	await page.goto("/cash");
	await expect(page.getByRole("heading", { name: "Caja cerrada" })).toBeVisible();

	await page.getByRole("button", { name: "Abrir caja", exact: true }).click();
	if (testInfo.project.name === "mobile-chrome") {
		await expect(page.locator('[data-slot="drawer-popup"]')).toBeVisible();
		await expect(page.locator('[data-slot="dialog-content"]')).toHaveCount(0);
	} else {
		await expect(page.locator('[data-slot="dialog-content"]')).toBeVisible();
	}
	await page.getByLabel("Efectivo inicial").fill("100");
	await submitCashDialog(page, "Abrir caja");
	await expect(page.getByRole("heading", { name: "Caja operativa" })).toBeVisible();
	await expect(
		page.getByText("Efectivo esperado", { exact: true }).first().locator(".."),
	).toContainText(/100\.00/);

	await page.getByRole("button", { name: "Registrar depósito" }).click();
	await page.getByLabel("Importe del depósito").fill("20");
	await page.getByLabel("Motivo").fill("Agregar sencillo");
	await submitCashDialog(page, "Registrar depósito");
	await expect(
		page.getByText("Efectivo esperado", { exact: true }).first().locator(".."),
	).toContainText(/120\.00/);

	await page.getByRole("button", { name: "Registrar retiro" }).click();
	await page.getByLabel("Importe del retiro").fill("30");
	await page.getByLabel("Motivo").fill("Pago manual a proveedor");
	await submitCashDialog(page, "Registrar retiro");
	await expect(
		page.getByText("Efectivo esperado", { exact: true }).first().locator(".."),
	).toContainText(/90\.00/);

	await page.getByRole("button", { name: "Registrar retiro" }).click();
	await page.getByLabel("Importe del retiro").fill("100");
	await page.getByLabel("Motivo").fill("Retiro excesivo de prueba");
	await expect(page.getByText("El retiro supera el efectivo esperado disponible.")).toBeVisible();
	await expect(
		page.getByRole("button", { name: "Registrar retiro", exact: true }).last(),
	).toBeDisabled();
	await page.getByRole("button", { name: "Cancelar" }).click();
	await expect(page.getByRole("heading", { name: "¿Descartar cambios?" })).toBeVisible();
	await page.getByRole("button", { name: "Seguir editando" }).click();
	await expect(page.getByLabel("Importe del retiro")).toHaveValue("100");
	await page.getByRole("button", { name: "Cancelar" }).click();
	await page.getByRole("button", { name: "Descartar cambios" }).click();

	await page.getByRole("button", { name: "Cerrar caja" }).click();
	const sheetBox = await page.locator('[data-slot="sheet-content"]').boundingBox();
	expect(sheetBox).not.toBeNull();
	if (sheetBox) {
		const viewportWidth = await page.evaluate(() => innerWidth);
		if (testInfo.project.name === "mobile-chrome")
			expect(sheetBox.width).toBeGreaterThanOrEqual(viewportWidth - 1);
		else {
			expect(sheetBox.width).toBeGreaterThanOrEqual(620);
			expect(sheetBox.width).toBeLessThanOrEqual(720);
		}
	}
	await page.getByLabel("Efectivo contado").fill("88");
	await expect(page.getByText("Faltante", { exact: true })).toBeVisible();
	await expect(page.getByRole("status")).toContainText(/2\.00/);
	await page.getByRole("button", { name: "Confirmar cierre" }).click();
	await expect(page.locator('[data-slot="sheet-content"]')).toHaveCount(0);

	await expect(page.getByRole("tab", { name: "Historial" })).toHaveAttribute(
		"aria-selected",
		"true",
	);
	const historyItem = page.getByRole("button", { name: /Inicial S\/ 100\.00/ });
	await historyItem.click();
	await expect(page).toHaveURL(/panel=detail/);
	await expect(page.getByRole("heading", { name: "Detalle de sesión" })).toBeVisible();
	await expect(page.getByRole("status")).toContainText("Faltante");
	await page.reload();
	await expect(page.getByRole("heading", { name: "Detalle de sesión" })).toBeVisible();
	await page.goBack();
	await expect(page.getByRole("heading", { name: "Detalle de sesión" })).not.toBeVisible();
	expect(browserErrors).toEqual([]);
});
