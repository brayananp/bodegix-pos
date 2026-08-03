import "fake-indexeddb/auto";
import Dexie from "dexie";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BodegixDatabase } from "./bodegix-database";
import { initializeLocalDatabase } from "./initialize-local-database";
import { runDatabaseDiagnostics } from "./diagnostics";
import {
	DATABASE_SCHEMA_VERSION,
	registerSchemaV1,
	registerSchemaV2,
	registerSchemaV3,
	SCHEMA_V4,
} from "./schema";

let database: BodegixDatabase | undefined;

function createTestDatabase(): BodegixDatabase {
	database = new BodegixDatabase(`bodegix-test-${crypto.randomUUID()}`);
	return database;
}

afterEach(async () => {
	vi.unstubAllGlobals();
	if (database) {
		database.close();
		await database.delete();
		database = undefined;
	}
});

describe("Dexie e IndexedDB", () => {
	it("abre una base nueva con versión, tablas e índices v1", async () => {
		const db = createTestDatabase();
		await db.open();

		expect(db.verno).toBe(DATABASE_SCHEMA_VERSION);
		expect(db.tables.map(({ name }) => name).sort()).toEqual(Object.keys(SCHEMA_V4).sort());
		expect(db.categories.schema.indexes.map(({ name }) => name)).toEqual([
			"normalizedName",
			"isActive",
			"updatedAt",
		]);
		expect(db.products.schema.indexes.map(({ name }) => name)).toContain(
			"[isActive+normalizedName]",
		);
		expect(db.sales.schema.indexes.find(({ name }) => name === "saleNumber")?.unique).toBe(true);
		const expectedIndexes: Record<string, string[]> = {
			categories: ["normalizedName", "isActive", "updatedAt"],
			products: [
				"barcode",
				"normalizedName",
				"categoryId",
				"isActive",
				"[isActive+normalizedName]",
				"updatedAt",
			],
			inventoryMovements: [
				"productId",
				"type",
				"referenceType",
				"referenceId",
				"createdAt",
				"[productId+createdAt]",
				"[referenceType+referenceId]",
				"[type+createdAt]",
				"[productId+type+createdAt]",
			],
			sales: [
				"saleNumber",
				"cashSessionId",
				"status",
				"createdAt",
				"[status+createdAt]",
				"[cashSessionId+createdAt]",
			],
			saleItems: ["saleId", "productId", "[saleId+productId]"],
			salePayments: [
				"saleId",
				"method",
				"status",
				"createdAt",
				"[saleId+status]",
				"[method+createdAt]",
			],
			cashSessions: ["status", "openedAt", "closedAt"],
			cashMovements: ["cashSessionId", "type", "createdAt", "[cashSessionId+createdAt]"],
			appSettings: [],
			saleDrafts: ["updatedAt"],
		};
		for (const table of db.tables) {
			expect(table.schema.indexes.map(({ name }) => name)).toEqual(expectedIndexes[table.name]);
		}
	});

	it("migra una instalación v1 a v2 conservando productos y movimientos", async () => {
		const databaseName = `bodegix-migration-${crypto.randomUUID()}`;
		const legacy = new Dexie(databaseName);
		registerSchemaV1(legacy);
		await legacy.open();
		await legacy.table("products").add({
			id: "product-legacy",
			barcode: null,
			name: "Producto legado",
			normalizedName: "producto legado",
			categoryId: null,
			salePriceCents: 100,
			costPriceCents: null,
			stockQuantity: 3,
			minimumStockQuantity: 1,
			isActive: true,
			createdAt: 1,
			updatedAt: 1,
		});
		await legacy.table("inventoryMovements").add({
			id: "movement-legacy",
			productId: "product-legacy",
			type: "initial_stock",
			quantityDelta: 3,
			stockBefore: 0,
			stockAfter: 3,
			referenceType: "setup",
			referenceId: null,
			reason: null,
			createdAt: 2,
		});
		legacy.close();

		database = new BodegixDatabase(databaseName);
		await database.open();
		expect(database.verno).toBe(DATABASE_SCHEMA_VERSION);
		expect(await database.products.get("product-legacy")).toMatchObject({ stockQuantity: 3 });
		expect(await database.inventoryMovements.get("movement-legacy")).toMatchObject({
			stockAfter: 3,
		});
		expect(database.inventoryMovements.schema.indexes.map(({ name }) => name)).toContain(
			"[type+createdAt]",
		);
	});

	it("migra sesiones v2 a v3 inicializando el snapshot sin inventar totales", async () => {
		const databaseName = `bodegix-cash-migration-${crypto.randomUUID()}`;
		const legacy = new Dexie(databaseName);
		registerSchemaV1(legacy);
		registerSchemaV2(legacy);
		await legacy.open();
		await legacy.table("cashSessions").add({
			id: "legacy-cash",
			status: "closed",
			openingCashCents: 5_000,
			expectedCashCents: 5_000,
			countedCashCents: 4_900,
			differenceCents: -100,
			openedAt: 1,
			closedAt: 2,
		});
		legacy.close();

		database = new BodegixDatabase(databaseName);
		await database.open();
		expect(await database.cashSessions.get("legacy-cash")).toMatchObject({
			expectedCashCents: 5_000,
			countedCashCents: 4_900,
			differenceCents: -100,
			completedSalesCount: null,
			cashSalesCents: null,
			manualDepositsCents: null,
		});
	});

	it("migra instalación v3 a v4 agregando saleDrafts sin datos de ejemplo", async () => {
		const databaseName = `bodegix-sale-draft-migration-${crypto.randomUUID()}`;
		const legacy = new Dexie(databaseName);
		registerSchemaV1(legacy);
		registerSchemaV2(legacy);
		registerSchemaV3(legacy);
		await legacy.open();
		await legacy.table("products").add({
			id: "product-v3",
			barcode: null,
			name: "Producto v3",
			normalizedName: "producto v3",
			categoryId: null,
			salePriceCents: 500,
			costPriceCents: null,
			stockQuantity: 4,
			minimumStockQuantity: 0,
			isActive: true,
			createdAt: 1,
			updatedAt: 1,
		});
		legacy.close();

		database = new BodegixDatabase(databaseName);
		await database.open();
		expect(database.verno).toBe(DATABASE_SCHEMA_VERSION);
		expect(database.saleDrafts.schema.indexes.map(({ name }) => name)).toEqual(["updatedAt"]);
		expect(await database.saleDrafts.count()).toBe(0);
		expect(await database.products.get("product-v3")).toMatchObject({ stockQuantity: 4 });
	});

	it("crea appSettings/main y conserva installationId y nextSaleNumber", async () => {
		const db = createTestDatabase();
		const first = await initializeLocalDatabase(db);
		await db.appSettings.update("main", { nextSaleNumber: 42 });
		const second = await initializeLocalDatabase(db);

		expect(first.createdSettings).toBe(true);
		expect(second.createdSettings).toBe(false);
		expect(second.installationId).toBe(first.installationId);
		expect((await db.appSettings.get("main"))?.nextSaleNumber).toBe(42);
		expect(await db.appSettings.count()).toBe(1);
	});

	it("es idempotente ante inicializaciones concurrentes", async () => {
		const db = createTestDatabase();
		const results = await Promise.all([
			initializeLocalDatabase(db),
			initializeLocalDatabase(db),
			initializeLocalDatabase(db),
		]);

		expect(new Set(results.map(({ installationId }) => installationId)).size).toBe(1);
		expect(results.filter(({ createdSettings }) => createdSettings)).toHaveLength(1);
		expect(await db.appSettings.count()).toBe(1);
	});

	it("rechaza categorías con normalizedName duplicado", async () => {
		const db = createTestDatabase();
		await db.open();
		const base = {
			name: "Bebidas",
			normalizedName: "bebidas",
			isActive: true,
			createdAt: 1,
			updatedAt: 1,
		};
		await db.categories.add({ id: "category-1", ...base });
		await expect(db.categories.add({ id: "category-2", ...base })).rejects.toMatchObject({
			name: "ConstraintError",
		});
	});

	it("rechaza números de venta duplicados", async () => {
		const db = createTestDatabase();
		await db.open();
		const base = {
			saleNumber: 1,
			cashSessionId: "cash-1",
			subtotalCents: 100,
			totalCents: 100,
			status: "completed" as const,
			createdAt: 1,
			voidedAt: null,
			voidReason: null,
		};
		await db.sales.add({ id: "sale-1", ...base });
		await expect(db.sales.add({ id: "sale-2", ...base })).rejects.toMatchObject({
			name: "ConstraintError",
		});
	});

	it("revierte por completo una transacción ante un error no controlado", async () => {
		const db = createTestDatabase();
		await db.open();

		await expect(
			db.transaction("rw", db.categories, async () => {
				await db.categories.add({
					id: "category-1",
					name: "Bebidas",
					normalizedName: "bebidas",
					isActive: true,
					createdAt: 1,
					updatedAt: 1,
				});
				throw new Error("abort transaction");
			}),
		).rejects.toThrow("abort transaction");
		expect(await db.categories.count()).toBe(0);
	});

	it("aprueba el diagnóstico de una base recién inicializada", async () => {
		const db = createTestDatabase();
		const result = await initializeLocalDatabase(db);
		const deep = await runDatabaseDiagnostics(db, "deep");

		expect(result.diagnostics.status).toBe("pass");
		expect(deep.status).toBe("pass");
		expect(deep.checks).toHaveLength(14);
	});

	it("detecta configuración inválida sin repararla", async () => {
		const db = createTestDatabase();
		await initializeLocalDatabase(db);
		await db.table("appSettings").update("main", { nextSaleNumber: 0 });

		const report = await runDatabaseDiagnostics(db, "basic");
		expect(report.status).toBe("fail");
		expect(report.checks.find(({ id }) => id === "app-settings-valid")?.status).toBe("fail");
		expect((await db.appSettings.get("main"))?.nextSaleNumber).toBe(0);
	});

	it("rechaza el bootstrap cuando la configuración existente es inválida", async () => {
		const db = createTestDatabase();
		await initializeLocalDatabase(db);
		await db.table("appSettings").update("main", { nextSaleNumber: 0 });

		await expect(initializeLocalDatabase(db)).rejects.toMatchObject({
			code: "APP_SETTINGS_INVALID",
		});
	});

	it("detecta relaciones huérfanas en diagnóstico profundo", async () => {
		const db = createTestDatabase();
		await initializeLocalDatabase(db);
		await db.saleItems.add({
			id: "item-1",
			saleId: "missing-sale",
			productId: "missing-product",
			productName: "Producto histórico",
			unitPriceCents: 100,
			unitCostCents: null,
			quantity: 1,
			subtotalCents: 100,
		});

		const report = await runDatabaseDiagnostics(db, "deep");
		expect(report.status).toBe("fail");
		expect(report.checks.find(({ id }) => id === "sale-items-references")?.status).toBe("warning");
		expect(report.checks.find(({ id }) => id === "sales-integrity")?.status).toBe("fail");
	});

	it("detecta inconsistencias del ledger sin reparar datos", async () => {
		const db = createTestDatabase();
		await initializeLocalDatabase(db);
		await db.products.add({
			id: "product-1",
			barcode: null,
			name: "Producto",
			normalizedName: "producto",
			categoryId: null,
			salePriceCents: 100,
			costPriceCents: null,
			stockQuantity: 5,
			minimumStockQuantity: 1,
			isActive: true,
			createdAt: 1,
			updatedAt: 1,
		});

		const report = await runDatabaseDiagnostics(db, "deep");
		const inventoryCheck = report.checks.find(({ id }) => id === "inventory-ledger-integrity");
		expect(report.status).toBe("fail");
		expect(inventoryCheck).toMatchObject({
			status: "fail",
			details: { issueCount: 1 },
		});
		expect((await db.products.get("product-1"))?.stockQuantity).toBe(5);
	});

	it("detecta inconsistencias de caja sin reparar sesiones ni movimientos", async () => {
		const db = createTestDatabase();
		await initializeLocalDatabase(db);
		await db.cashSessions.bulkAdd([
			{
				id: "cash-open-1",
				status: "open",
				openingCashCents: 100,
				completedSalesCount: null,
				totalSalesCents: null,
				cashSalesCents: null,
				yapeSalesCents: null,
				plinSalesCents: null,
				cardSalesCents: null,
				bankTransferSalesCents: null,
				manualDepositsCents: null,
				manualWithdrawalsCents: null,
				expectedCashCents: null,
				countedCashCents: null,
				differenceCents: null,
				openedAt: 100,
				closedAt: null,
			},
			{
				id: "cash-open-2",
				status: "open",
				openingCashCents: 100,
				completedSalesCount: null,
				totalSalesCents: null,
				cashSalesCents: null,
				yapeSalesCents: null,
				plinSalesCents: null,
				cardSalesCents: null,
				bankTransferSalesCents: null,
				manualDepositsCents: null,
				manualWithdrawalsCents: null,
				expectedCashCents: null,
				countedCashCents: null,
				differenceCents: null,
				openedAt: 101,
				closedAt: null,
			},
			{
				id: "cash-closed",
				status: "closed",
				openingCashCents: 100,
				completedSalesCount: 0,
				totalSalesCents: 0,
				cashSalesCents: 0,
				yapeSalesCents: 0,
				plinSalesCents: 0,
				cardSalesCents: 0,
				bankTransferSalesCents: 0,
				manualDepositsCents: 0,
				manualWithdrawalsCents: 0,
				expectedCashCents: 100,
				countedCashCents: 90,
				differenceCents: 10,
				openedAt: 10,
				closedAt: 20,
			},
			{
				id: "cash-bad-snapshot",
				status: "closed",
				openingCashCents: 100,
				completedSalesCount: 0,
				totalSalesCents: 0,
				cashSalesCents: 0,
				yapeSalesCents: 0,
				plinSalesCents: 0,
				cardSalesCents: 0,
				bankTransferSalesCents: 0,
				manualDepositsCents: 0,
				manualWithdrawalsCents: 0,
				expectedCashCents: 200,
				countedCashCents: 200,
				differenceCents: 0,
				openedAt: 10,
				closedAt: 20,
			},
		]);
		await db.cashMovements.add({
			id: "late-movement",
			cashSessionId: "cash-closed",
			type: "withdrawal",
			amountCents: 10,
			reason: "Movimiento tardío",
			createdAt: 30,
		});

		const report = await runDatabaseDiagnostics(db, "deep");
		expect(report.checks.find(({ id }) => id === "single-open-cash-session")?.status).toBe(
			"warning",
		);
		const cashIntegrity = report.checks.find(({ id }) => id === "cash-integrity");
		expect(cashIntegrity).toMatchObject({ status: "fail" });
		expect(cashIntegrity?.details).toEqual(
			expect.objectContaining({
				issues: expect.arrayContaining([
					expect.objectContaining({
						inconsistency: "El efectivo esperado no coincide con el snapshot del cierre.",
					}),
				]),
			}),
		);
		expect((await db.cashSessions.get("cash-closed"))?.differenceCents).toBe(10);
		expect(await db.cashMovements.count()).toBe(1);
	});

	it("puede importar el cliente sin acceder a IndexedDB", async () => {
		vi.stubGlobal("indexedDB", undefined);
		vi.stubGlobal("IDBKeyRange", undefined);
		vi.resetModules();

		const client = await import("./database-client");
		expect(client.isIndexedDbAvailable()).toBe(false);
		expect(() => client.getLocalDatabase()).toThrow("no está disponible");
	});
});
