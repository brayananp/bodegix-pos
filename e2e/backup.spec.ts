import { expect, test } from "@playwright/test";

test.setTimeout(90_000);

test.beforeEach(async ({ page }) => {
	await page.addInitScript(() => {
		Object.defineProperty(window, "showSaveFilePicker", { configurable: true, value: undefined });
		Object.defineProperty(window, "showOpenFilePicker", { configurable: true, value: undefined });
	});
});

test("crea, valida y restaura un respaldo completo", async ({ page, isMobile }) => {
	const browserErrors: string[] = [];
	page.on("pageerror", (error) => browserErrors.push(error.message));
	page.on("console", (message) => {
		if (message.type() === "error") browserErrors.push(message.text());
	});

	await page.goto("/settings?section=data&panel=null");
	await expect(page.getByRole("tab", { name: "Datos y respaldos" })).toHaveAttribute(
		"data-active",
		"",
	);
	await expect(page.getByText("Sin respaldo")).toBeVisible();

	await page.getByRole("button", { name: "Crear respaldo", exact: true }).click();
	await expect(page.getByRole("dialog", { name: "Crear respaldo" })).toBeVisible();
	const backupDownloadPromise = page.waitForEvent("download");
	await page.getByRole("button", { name: "Crear y guardar respaldo" }).click();
	const backupDownload = await backupDownloadPromise;
	expect(backupDownload.suggestedFilename()).toMatch(/^bodegix-backup-.+\.bodegix$/);
	await expect(page.getByText("Respaldo guardado")).toBeVisible();
	await page.getByRole("button", { name: "Cerrar" }).click();
	await expect(page.getByText("Sin respaldo")).toHaveCount(0);
	await expect(page.getByText("Nunca", { exact: true })).toHaveCount(0);

	await page.getByRole("button", { name: "Restaurar desde archivo" }).click();
	await expect(page.getByRole("dialog", { name: "Restaurar respaldo" })).toBeVisible();
	const chooserPromise = page.waitForEvent("filechooser");
	await page.getByRole("button", { name: "Seleccionar y validar archivo" }).click();
	const chooser = await chooserPromise;
	const backupPath = await backupDownload.path();
	expect(backupPath).not.toBeNull();
	await chooser.setFiles(backupPath ?? "");

	await expect(page.getByText("Respaldo seleccionado")).toBeVisible();
	await expect(page.getByText("Instalación actual")).toBeVisible();
	await expect(page.getByText(/10 tablas/)).toBeVisible();

	const safetyDownloadPromise = page.waitForEvent("download");
	await page.getByRole("button", { name: "Guardar copia previa y continuar" }).click();
	const safetyDownload = await safetyDownloadPromise;
	expect(safetyDownload.suggestedFilename()).toMatch(/^bodegix-pre-restore-.+\.bodegix$/);

	await page
		.getByRole("checkbox", { name: "Entiendo que se reemplazarán todos los datos actuales" })
		.setChecked(true);
	await page
		.getByRole("checkbox", {
			name: "Confirmo que el respaldo previo terminó de descargarse",
		})
		.setChecked(true);
	await page.getByLabel("Escribe RESTAURAR para confirmar").fill("RESTAURAR");
	await page.getByRole("button", { name: "Restaurar y reemplazar datos" }).click();

	await expect(page.getByText("Restauración completada y verificada")).toBeVisible();
	await expect(
		page.getByRole("button", { name: "Reiniciar Bodegix y revisar resumen" }),
	).toBeVisible();
	if (isMobile) {
		const viewport = page.viewportSize();
		expect(viewport).not.toBeNull();
		expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
			viewport?.width ?? 0,
		);
	}
	expect(browserErrors).toEqual([]);
});
