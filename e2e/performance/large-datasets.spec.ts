import { expect, test } from "@playwright/test";

const PRODUCT_COUNT = 10_000;
const SALE_COUNT = 50_000;

async function waitForDatabase(page: import("@playwright/test").Page) {
	await page.goto("/sale");
	await expect(page.getByText("Caja cerrada").first()).toBeVisible();
}

test("catálogo funciona con 10 000 productos sintéticos", async ({ page }, testInfo) => {
	await waitForDatabase(page);
	const seedStarted = Date.now();
	await page.evaluate(async (productCount) => {
		const database = await new Promise<IDBDatabase>((resolve, reject) => {
			const request = indexedDB.open("bodegix-pos");
			request.onsuccess = () => resolve(request.result);
			request.onerror = () => reject(request.error);
		});
		await new Promise<void>((resolve, reject) => {
			const transaction = database.transaction("products", "readwrite");
			transaction.oncomplete = () => resolve();
			transaction.onerror = () => reject(transaction.error);
			const products = transaction.objectStore("products");
			for (let index = 0; index < productCount; index += 1) {
				products.put({
					id: `performance-product-${index}`,
					barcode: `775${index.toString().padStart(9, "0")}`,
					name: `Producto sintético ${index}`,
					normalizedName: `producto sintetico ${index}`,
					categoryId: null,
					salePriceCents: 100 + index,
					costPriceCents: 50,
					stockQuantity: index % 100,
					minimumStockQuantity: 5,
					isActive: true,
					createdAt: index + 1,
					updatedAt: index + 1,
				});
			}
		});
		database.close();
	}, PRODUCT_COUNT);
	const seededAt = Date.now();

	await page.goto("/products?q=producto%20sintetico%209999");
	await expect(
		page.getByText("Producto sintético 9999", { exact: true }).filter({ visible: true }),
	).toBeVisible();
	const catalogMetrics = {
		products: PRODUCT_COUNT,
		seedMs: seededAt - seedStarted,
		queryAndRenderMs: Date.now() - seededAt,
	};
	console.info(`PERFORMANCE ${JSON.stringify(catalogMetrics)}`);
	await testInfo.attach("catalog-performance.json", {
		body: JSON.stringify(catalogMetrics),
		contentType: "application/json",
	});
});

test("historial pagina 50 000 ventas sintéticas", async ({ page }, testInfo) => {
	await waitForDatabase(page);
	const seedStarted = Date.now();
	const batchDurations = await page.evaluate(
		async ({ saleCount, batchSize }) => {
			const database = await new Promise<IDBDatabase>((resolve, reject) => {
				const request = indexedDB.open("bodegix-pos");
				request.onsuccess = () => resolve(request.result);
				request.onerror = () => reject(request.error);
			});
			const durations: number[] = [];
			for (let start = 0; start < saleCount; start += batchSize) {
				const started = performance.now();
				await new Promise<void>((resolve, reject) => {
					const transaction = database.transaction(
						["sales", "saleItems", "salePayments"],
						"readwrite",
					);
					transaction.oncomplete = () => resolve();
					transaction.onerror = () => reject(transaction.error);
					const sales = transaction.objectStore("sales");
					const items = transaction.objectStore("saleItems");
					const payments = transaction.objectStore("salePayments");
					for (let index = start; index < Math.min(start + batchSize, saleCount); index += 1) {
						const id = `performance-sale-${index}`;
						sales.put({
							id,
							saleNumber: index + 1,
							cashSessionId: "performance-cash",
							subtotalCents: 100 + index,
							totalCents: 100 + index,
							status: "completed",
							createdAt: index + 1,
							voidedAt: null,
							voidReason: null,
						});
						if (index >= saleCount - 25) {
							items.put({
								id: `performance-item-${index}`,
								saleId: id,
								productId: `historical-${index}`,
								productName: `Producto histórico ${index}`,
								unitPriceCents: 100 + index,
								unitCostCents: 50,
								quantity: 1,
								subtotalCents: 100 + index,
							});
							payments.put({
								id: `performance-payment-${index}`,
								saleId: id,
								method: "cash",
								amountCents: 100 + index,
								status: "confirmed",
								providerLabel: null,
								operationReference: null,
								cashReceivedCents: 100 + index,
								changeCents: 0,
								verifiedAt: index + 1,
								voidedAt: null,
								voidOperationReference: null,
								createdAt: index + 1,
							});
						}
					}
				});
				durations.push(Math.round(performance.now() - started));
			}
			database.close();
			return durations;
		},
		{ saleCount: SALE_COUNT, batchSize: 5_000 },
	);
	const seededAt = Date.now();

	await page.goto("/sales?range=all");
	await expect(page.getByText("V-050000", { exact: true }).filter({ visible: true })).toBeVisible();
	const salesMetrics = {
		sales: SALE_COUNT,
		seedMs: seededAt - seedStarted,
		batchDurations,
		queryAndRenderMs: Date.now() - seededAt,
	};
	console.info(`PERFORMANCE ${JSON.stringify(salesMetrics)}`);
	await testInfo.attach("sales-performance.json", {
		body: JSON.stringify(salesMetrics),
		contentType: "application/json",
	});
});
