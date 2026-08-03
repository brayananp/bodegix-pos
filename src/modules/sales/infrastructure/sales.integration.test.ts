import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { BodegixDatabase } from "@/shared/infrastructure/local-db";
import { initializeLocalDatabase } from "@/shared/infrastructure/local-db/initialize-local-database";
import { createProduct } from "../../catalog/application";
import { DexieCatalogStore } from "../../catalog/infrastructure/dexie-catalog-store";
import { openCashSession } from "../../cash/application";
import { DexieCashUnitOfWork } from "../../cash/infrastructure/dexie-cash-unit-of-work";
import { reviewSaleDraft } from "../application";
import { SaleError } from "../domain";
import { DexieCompleteSaleUnitOfWork } from "./dexie-complete-sale-unit-of-work";
import { DexieSaleDraftStore } from "./dexie-sale-draft-store";
import { DexieSaleResultQueries } from "./dexie-sale-result-queries";

let database: BodegixDatabase;
let draftStore: DexieSaleDraftStore;
let completeSale: DexieCompleteSaleUnitOfWork;
let cashUnitOfWork: DexieCashUnitOfWork;
let catalogStore: DexieCatalogStore;
let resultQueries: DexieSaleResultQueries;
let sequence = 0;

const deps = {
	createId: () => `sale-id-${++sequence}`,
	now: () => 1_000 + sequence,
};

beforeEach(async () => {
	sequence = 0;
	database = new BodegixDatabase(`sales-test-${crypto.randomUUID()}`);
	await database.open();
	await initializeLocalDatabase(database);
	draftStore = new DexieSaleDraftStore(database, () => deps.now());
	completeSale = new DexieCompleteSaleUnitOfWork(database, deps);
	cashUnitOfWork = new DexieCashUnitOfWork(database, deps);
	catalogStore = new DexieCatalogStore(database);
	resultQueries = new DexieSaleResultQueries(database);
});

afterEach(async () => {
	database.close();
	await database.delete();
});

async function createProductWithStock(input: {
	name: string;
	barcode?: string;
	salePriceCents: number;
	stock: number;
}) {
	const product = await createProduct(
		catalogStore,
		{
			name: input.name,
			barcode: input.barcode ?? null,
			categoryId: null,
			salePriceCents: input.salePriceCents,
			costPriceCents: 100,
			minimumStockQuantity: 0,
		},
		deps,
	);
	await database.products.update(product.id, { stockQuantity: input.stock });
	return product;
}

async function openCash(openingCashCents = 10_000) {
	return openCashSession(cashUnitOfWork, { openingCashCents });
}

describe("ventas Dexie", () => {
	it("persiste el borrador y permite agregar, incrementar y limpiar", async () => {
		const product = await createProductWithStock({
			name: "Coca Cola",
			salePriceCents: 350,
			stock: 10,
		});
		await draftStore.addProduct(product.id, 350, 10);
		let draft = await draftStore.get();
		expect(draft?.items).toHaveLength(1);
		expect(draft?.items[0]).toMatchObject({ quantity: 1, expectedUnitPriceCents: 350 });

		await draftStore.addProduct(product.id, 350, 10);
		draft = await draftStore.get();
		expect(draft?.items[0]?.quantity).toBe(2);

		await draftStore.setQuantity(product.id, 0, 10);
		expect(await draftStore.get()).toMatchObject({ items: [] });

		await draftStore.addProduct(product.id, 350, 10);
		await draftStore.clear();
		expect(await database.saleDrafts.get("main")).toBeUndefined();
	});

	it("completa venta en efectivo con snapshots, stock y correlativo", async () => {
		await openCash();
		const product = await createProductWithStock({
			name: "Pan",
			salePriceCents: 200,
			stock: 10,
		});
		await draftStore.addProduct(product.id, 200, 10);
		await draftStore.setQuantity(product.id, 2, 10);

		const result = await completeSale.execute({
			paymentIntents: [
				{
					method: "cash",
					amountCents: 400,
					cashReceivedCents: 500,
					operationReference: null,
					manuallyVerified: false,
				},
			],
		});

		expect(result).toMatchObject({
			saleNumber: 1,
			totalCents: 400,
			changeCents: 100,
			itemCount: 2,
			lineCount: 1,
		});
		expect(await database.products.get(product.id)).toMatchObject({ stockQuantity: 8 });
		expect(await database.saleDrafts.get("main")).toBeUndefined();
		expect(await database.appSettings.get("main")).toMatchObject({ nextSaleNumber: 2 });

		const saleItem = await database.saleItems.where("saleId").equals(result.saleId).first();
		expect(saleItem).toMatchObject({
			productName: "Pan",
			unitPriceCents: 200,
			quantity: 2,
			subtotalCents: 400,
		});

		const movement = await database.inventoryMovements
			.where("[referenceType+referenceId]")
			.equals(["sale", result.saleId])
			.first();
		expect(movement).toMatchObject({
			type: "sale",
			quantityDelta: -2,
			stockBefore: 10,
			stockAfter: 8,
		});

		const view = await resultQueries.getSaleResult(result.saleId);
		expect(view?.formattedSaleNumber).toBe("V-000001");
	});

	it("completa venta mixta y registra pagos separados", async () => {
		await openCash();
		const product = await createProductWithStock({
			name: "Galletas",
			salePriceCents: 1000,
			stock: 5,
		});
		await draftStore.addProduct(product.id, 1000, 5);
		await draftStore.setQuantity(product.id, 2, 5);

		const result = await completeSale.execute({
			paymentIntents: [
				{
					method: "cash",
					amountCents: 800,
					cashReceivedCents: 1000,
					operationReference: null,
					manuallyVerified: false,
				},
				{
					method: "yape",
					amountCents: 1200,
					cashReceivedCents: null,
					operationReference: "OP123",
					manuallyVerified: true,
				},
			],
		});

		expect(result.totalCents).toBe(2000);
		expect(result.changeCents).toBe(200);
		const payments = await database.salePayments.where("saleId").equals(result.saleId).toArray();
		expect(payments).toHaveLength(2);
		expect(payments.find((p) => p.method === "cash")).toMatchObject({
			amountCents: 800,
			cashReceivedCents: 1000,
			changeCents: 200,
			status: "confirmed",
		});
		expect(payments.find((p) => p.method === "yape")).toMatchObject({
			amountCents: 1200,
			status: "manually_verified",
			providerLabel: "Yape",
			operationReference: "OP123",
		});
	});

	it("rechaza venta sin caja abierta", async () => {
		const product = await createProductWithStock({
			name: "Agua",
			salePriceCents: 150,
			stock: 5,
		});
		await draftStore.addProduct(product.id, 150, 5);
		await expect(
			completeSale.execute({
				paymentIntents: [
					{
						method: "cash",
						amountCents: 150,
						cashReceivedCents: 200,
						operationReference: null,
						manuallyVerified: false,
					},
				],
			}),
		).rejects.toMatchObject({ code: "CASH_SESSION_REQUIRED" });
		expect(await database.sales.count()).toBe(0);
		expect(await draftStore.get()).not.toBeNull();
	});

	it("rechaza stock insuficiente y precio cambiado", async () => {
		await openCash();
		const product = await createProductWithStock({
			name: "Leche",
			salePriceCents: 500,
			stock: 2,
		});
		await draftStore.addProduct(product.id, 500, 2);
		await draftStore.setQuantity(product.id, 2, 2);
		await database.saleDrafts.put({
			id: "main",
			items: [{ productId: product.id, quantity: 3, expectedUnitPriceCents: 500 }],
			updatedAt: deps.now(),
		});
		await expect(
			completeSale.execute({
				paymentIntents: [
					{
						method: "cash",
						amountCents: 1500,
						cashReceivedCents: 1500,
						operationReference: null,
						manuallyVerified: false,
					},
				],
			}),
		).rejects.toMatchObject({ code: "INSUFFICIENT_STOCK" });

		await draftStore.clear();
		await draftStore.addProduct(product.id, 500, 2);
		await database.products.update(product.id, { salePriceCents: 600 });
		await expect(
			completeSale.execute({
				paymentIntents: [
					{
						method: "cash",
						amountCents: 1000,
						cashReceivedCents: 1000,
						operationReference: null,
						manuallyVerified: false,
					},
				],
			}),
		).rejects.toMatchObject({ code: "PRODUCT_PRICE_CHANGED" });
	});

	it("impide doble confirmación y ventas concurrentes sobre stock limitado", async () => {
		await openCash();
		const product = await createProductWithStock({
			name: "Yogurt",
			salePriceCents: 300,
			stock: 5,
		});
		await draftStore.addProduct(product.id, 300, 5);
		await draftStore.setQuantity(product.id, 4, 5);

		const payment = {
			method: "cash" as const,
			amountCents: 1200,
			cashReceivedCents: 1200,
			operationReference: null,
			manuallyVerified: false,
		};

		const results = await Promise.allSettled([
			completeSale.execute({ paymentIntents: [payment] }),
			completeSale.execute({ paymentIntents: [payment] }),
		]);
		expect(results.filter(({ status }) => status === "fulfilled")).toHaveLength(1);
		expect(await database.sales.count()).toBe(1);
		expect(await database.products.get(product.id)).toMatchObject({ stockQuantity: 1 });
	});

	it("rechaza carrito vacío en segunda confirmación", async () => {
		await openCash();
		const product = await createProductWithStock({
			name: "Arroz",
			salePriceCents: 800,
			stock: 3,
		});
		await draftStore.addProduct(product.id, 800, 3);
		await completeSale.execute({
			paymentIntents: [
				{
					method: "cash",
					amountCents: 800,
					cashReceivedCents: 800,
					operationReference: null,
					manuallyVerified: false,
				},
			],
		});
		await expect(
			completeSale.execute({
				paymentIntents: [
					{
						method: "cash",
						amountCents: 800,
						cashReceivedCents: 800,
						operationReference: null,
						manuallyVerified: false,
					},
				],
			}),
		).rejects.toMatchObject({ code: "SALE_DRAFT_EMPTY" });
	});

	it("revisa el borrador sin modificar precios silenciosamente", async () => {
		const product = await createProductWithStock({
			name: "Aceite",
			salePriceCents: 1200,
			stock: 4,
		});
		await draftStore.addProduct(product.id, 1200, 4);
		const draft = await draftStore.get();
		expect(draft).not.toBeNull();
		if (!draft) return;
		const review = reviewSaleDraft(
			draft,
			new Map([
				[
					product.id,
					{
						id: product.id,
						name: product.name,
						barcode: null,
						categoryId: null,
						categoryName: null,
						salePriceCents: 1500,
						stockQuantity: 4,
						isActive: true,
						canSell: true,
					},
				],
			]),
		);
		expect(review.valid).toBe(false);
		expect(review.issues[0]).toMatchObject({ code: "PRODUCT_PRICE_CHANGED" });
	});
});

describe("errores del borrador", () => {
	it("rechaza agregar producto agotado", async () => {
		const product = await createProductWithStock({
			name: "Vacio",
			salePriceCents: 100,
			stock: 0,
		});
		await expect(draftStore.addProduct(product.id, 100, 0)).rejects.toBeInstanceOf(SaleError);
	});
});
