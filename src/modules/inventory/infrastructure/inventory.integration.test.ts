import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { BodegixDatabase, type ProductRecord } from "@/shared/infrastructure/local-db";
import {
	initializeProductStock,
	reconcileProductStock,
	registerStockEntry,
	registerStockLoss,
} from "../application";
import { DexieInventoryQueries } from "./dexie-inventory-queries";
import { DexieInventoryUnitOfWork } from "./dexie-inventory-unit-of-work";

let database: BodegixDatabase;
let unitOfWork: DexieInventoryUnitOfWork;
let queries: DexieInventoryQueries;
let sequence = 0;

function product(overrides: Partial<ProductRecord> = {}): ProductRecord {
	return {
		id: "product-1",
		barcode: "0001",
		name: "Coca Cola 500 ml",
		normalizedName: "coca cola 500 ml",
		categoryId: null,
		salePriceCents: 350,
		costPriceCents: null,
		stockQuantity: 0,
		minimumStockQuantity: 5,
		isActive: true,
		createdAt: 100,
		updatedAt: 100,
		...overrides,
	};
}

beforeEach(async () => {
	sequence = 0;
	database = new BodegixDatabase(`inventory-test-${crypto.randomUUID()}`);
	await database.open();
	unitOfWork = new DexieInventoryUnitOfWork(database, {
		createId: () => `movement-${++sequence}`,
		now: () => 1_000 + sequence,
	});
	queries = new DexieInventoryQueries(database);
	await database.products.add(product());
});

afterEach(async () => {
	database.close();
	await database.delete();
});

describe("inventario Dexie", () => {
	it("registra stock inicial actualizando saldo y ledger atómicamente", async () => {
		const result = await initializeProductStock(unitOfWork, {
			productId: "product-1",
			quantity: 10,
			note: "Conteo de apertura",
		});

		expect(result).toMatchObject({ stockQuantity: 10 });
		expect(await database.products.get("product-1")).toMatchObject({
			stockQuantity: 10,
			updatedAt: 1_000,
		});
		expect(await database.inventoryMovements.toArray()).toEqual([
			expect.objectContaining({
				id: "movement-1",
				type: "initial_stock",
				quantityDelta: 10,
				stockBefore: 0,
				stockAfter: 10,
				referenceType: "setup",
				reason: "Conteo de apertura",
			}),
		]);
	});

	it("impide registrar stock inicial más de una vez", async () => {
		await initializeProductStock(unitOfWork, {
			productId: "product-1",
			quantity: 10,
			note: null,
		});
		await expect(
			initializeProductStock(unitOfWork, {
				productId: "product-1",
				quantity: 3,
				note: null,
			}),
		).rejects.toMatchObject({ code: "INITIAL_STOCK_ALREADY_REGISTERED" });
		expect(await database.inventoryMovements.count()).toBe(1);
	});

	it("impide stock inicial cuando hubo movimientos aunque el saldo vuelva a cero", async () => {
		await initializeProductStock(unitOfWork, {
			productId: "product-1",
			quantity: 2,
			note: null,
		});
		await registerStockLoss(unitOfWork, {
			productId: "product-1",
			quantity: 2,
			lossType: "expired",
			reason: null,
		});
		await expect(
			initializeProductStock(unitOfWork, {
				productId: "product-1",
				quantity: 4,
				note: null,
			}),
		).rejects.toMatchObject({ code: "INITIAL_STOCK_ALREADY_REGISTERED" });
	});

	it("registra entradas y rechaza entradas en productos inactivos", async () => {
		const entry = await registerStockEntry(unitOfWork, {
			productId: "product-1",
			quantity: 5,
			reference: "FAC-001",
			note: "Recepción manual",
		});
		expect(entry.movement).toMatchObject({
			type: "purchase",
			quantityDelta: 5,
			referenceId: "FAC-001",
			reason: "Recepción manual",
		});
		await database.products.update("product-1", { isActive: false });
		await expect(
			registerStockEntry(unitOfWork, {
				productId: "product-1",
				quantity: 1,
				reference: null,
				note: null,
			}),
		).rejects.toMatchObject({ code: "PRODUCT_INACTIVE_FOR_STOCK_ENTRY" });
	});

	it("concilia productos activos e inactivos y rechaza conteos sin diferencia", async () => {
		await registerStockEntry(unitOfWork, {
			productId: "product-1",
			quantity: 10,
			reference: null,
			note: null,
		});
		await database.products.update("product-1", { isActive: false });
		const adjustment = await reconcileProductStock(unitOfWork, {
			productId: "product-1",
			countedQuantity: 7,
			reason: "Conteo físico semanal",
		});
		expect(adjustment.movement).toMatchObject({
			type: "adjustment_out",
			quantityDelta: -3,
			stockAfter: 7,
		});
		await expect(
			reconcileProductStock(unitOfWork, {
				productId: "product-1",
				countedQuantity: 7,
				reason: "Segundo conteo",
			}),
		).rejects.toMatchObject({ code: "NO_STOCK_CHANGE" });
	});

	it.each([
		["damaged", "damaged", null],
		["expired", "expired", "Fecha vencida"],
		["other", "adjustment_out", "Merma identificada"],
	] as const)("registra pérdida %s sin permitir saldo negativo", async (lossType, type, reason) => {
		await registerStockEntry(unitOfWork, {
			productId: "product-1",
			quantity: 5,
			reference: null,
			note: null,
		});
		const loss = await registerStockLoss(unitOfWork, {
			productId: "product-1",
			quantity: 2,
			lossType,
			reason,
		});
		expect(loss.movement).toMatchObject({ type, quantityDelta: -2, stockAfter: 3 });
		await expect(
			registerStockLoss(unitOfWork, {
				productId: "product-1",
				quantity: 4,
				lossType,
				reason,
			}),
		).rejects.toMatchObject({ code: "INSUFFICIENT_STOCK" });
	});

	it("revierte el saldo cuando falla la inserción del movimiento", async () => {
		await database.inventoryMovements.add({
			id: "duplicate",
			productId: "product-1",
			type: "purchase",
			quantityDelta: 1,
			stockBefore: 0,
			stockAfter: 1,
			referenceType: "manual",
			referenceId: null,
			reason: null,
			createdAt: 10,
		});
		const failingUnitOfWork = new DexieInventoryUnitOfWork(database, {
			createId: () => "duplicate",
			now: () => 2_000,
		});
		await expect(
			registerStockEntry(failingUnitOfWork, {
				productId: "product-1",
				quantity: 5,
				reference: null,
				note: null,
			}),
		).rejects.toMatchObject({ code: "INVENTORY_PERSISTENCE_FAILED" });
		expect((await database.products.get("product-1"))?.stockQuantity).toBe(0);
	});

	it("serializa entradas concurrentes sin perder actualizaciones", async () => {
		const concurrentUnitOfWork = new DexieInventoryUnitOfWork(database, {
			createId: () => `concurrent-${++sequence}`,
			now: () => 5_000,
		});
		await Promise.all([
			registerStockEntry(concurrentUnitOfWork, {
				productId: "product-1",
				quantity: 5,
				reference: null,
				note: null,
			}),
			registerStockEntry(concurrentUnitOfWork, {
				productId: "product-1",
				quantity: 3,
				reference: null,
				note: null,
			}),
		]);
		expect((await database.products.get("product-1"))?.stockQuantity).toBe(8);
		const movements = await database.inventoryMovements.orderBy("createdAt").toArray();
		expect(movements.map(({ stockAfter }) => stockAfter)).toEqual([5, 8]);
		expect(movements.map(({ createdAt }) => createdAt)).toEqual([5_000, 5_001]);
	});

	it("consulta inventario por estado con categoría y resumen sin reconstruir el saldo", async () => {
		await database.categories.add({
			id: "category-1",
			name: "Bebidas",
			normalizedName: "bebidas",
			isActive: true,
			createdAt: 1,
			updatedAt: 1,
		});
		await database.products.bulkAdd([
			product({
				id: "product-2",
				name: "Agua mineral",
				normalizedName: "agua mineral",
				categoryId: "category-1",
				stockQuantity: 10,
			}),
			product({
				id: "product-3",
				name: "Jugo de naranja",
				normalizedName: "jugo de naranja",
				categoryId: "category-1",
				stockQuantity: 4,
			}),
		]);
		await database.inventoryMovements.bulkAdd([
			{
				id: "movement-p2",
				productId: "product-2",
				type: "initial_stock",
				quantityDelta: 10,
				stockBefore: 0,
				stockAfter: 10,
				referenceType: "setup",
				referenceId: null,
				reason: null,
				createdAt: 20,
			},
			{
				id: "movement-p3",
				productId: "product-3",
				type: "initial_stock",
				quantityDelta: 4,
				stockBefore: 0,
				stockAfter: 4,
				referenceType: "setup",
				referenceId: null,
				reason: null,
				createdAt: 30,
			},
		]);

		const lowStock = await queries.searchInventory({
			search: "jugo",
			categoryId: "category-1",
			productStatus: "active",
			stockStatus: "low_stock",
			page: 1,
			pageSize: 25,
			sort: "stock-asc",
		});
		expect(lowStock).toMatchObject({ total: 1, page: 1, totalPages: 1 });
		expect(lowStock.items[0]).toMatchObject({
			id: "product-3",
			categoryName: "Bebidas",
			stockStatus: "low_stock",
			hasInventoryMovements: true,
			lastMovementAt: 30,
		});

		expect(await queries.getInventorySummary()).toEqual({
			activeProducts: 3,
			productsInStock: 1,
			lowStockProducts: 1,
			outOfStockProducts: 1,
			productsWithoutMovements: 1,
		});
	});

	it("pagina el historial por fecha y filtra mediante tipo compuesto", async () => {
		await registerStockEntry(unitOfWork, {
			productId: "product-1",
			quantity: 10,
			reference: "FAC-001",
			note: null,
		});
		await reconcileProductStock(unitOfWork, {
			productId: "product-1",
			countedQuantity: 7,
			reason: "Conteo físico",
		});
		await registerStockEntry(unitOfWork, {
			productId: "product-1",
			quantity: 2,
			reference: "FAC-002",
			note: null,
		});

		const all = await queries.listInventoryMovements({
			productId: null,
			movementType: "all",
			page: 1,
			pageSize: 25,
		});
		expect(all.items.map(({ quantityDelta }) => quantityDelta)).toEqual([2, -3, 10]);
		expect(all.items[0]).toMatchObject({ productName: "Coca Cola 500 ml" });

		const entries = await queries.listInventoryMovements({
			productId: null,
			movementType: "purchase",
			page: 1,
			pageSize: 25,
		});
		expect(entries).toMatchObject({ total: 2, totalPages: 1, page: 1 });
		expect(entries.items[0]?.referenceId).toBe("FAC-002");
	});
});
