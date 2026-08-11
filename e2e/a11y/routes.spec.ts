import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const ROUTES = ["/sale", "/products", "/inventory", "/cash", "/sales", "/summary", "/settings"];
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

for (const route of ROUTES) {
	test(`${route} no tiene violaciones Axe A/AA detectables`, async ({ page }) => {
		await page.goto(route);
		await expect(page.locator("main").first()).toBeVisible();
		const result = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
		expect(result.violations).toEqual([]);
	});
}

test("formulario de producto abierto no tiene violaciones Axe A/AA detectables", async ({
	page,
}) => {
	await page.goto("/products");
	await page.getByRole("button", { name: "Nuevo producto" }).click();
	await expect(page.getByRole("heading", { name: "Nuevo producto" })).toBeVisible();
	const result = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
	expect(result.violations).toEqual([]);
});
