import { expect, test } from "@playwright/test";

test("inicializa y conserva la instalación local", async ({ page }) => {
	const consoleErrors: string[] = [];
	page.on("console", (message) => {
		if (message.type() === "error") consoleErrors.push(message.text());
	});

	await page.goto("/settings?section=storage&panel=null");
	await expect(page.getByText("Almacenamiento local")).toBeVisible();
	await expect(page.getByText("Versión del esquema")).toBeVisible();
	await expect(page.getByText("Aprobado")).toBeVisible();

	const installation = page.getByTestId("installation-id");
	const firstInstallationId = await installation.getAttribute("data-installation-id");
	await page.reload();
	await expect(page.getByText("Almacenamiento local")).toBeVisible();
	await expect(page.getByTestId("installation-id")).toHaveAttribute(
		"data-installation-id",
		firstInstallationId ?? "",
	);
	await expect(page.getByText(/No se pudo preparar/)).toHaveCount(0);
	expect(consoleErrors).toEqual([]);
});
