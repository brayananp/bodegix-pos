import "fake-indexeddb/auto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BodegixDatabase } from "./bodegix-database";
import { initializeLocalDatabase } from "./initialize-local-database";
import { runDatabaseDiagnostics } from "./diagnostics";
import { DATABASE_SCHEMA_VERSION, SCHEMA_V1 } from "./schema";

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
		expect(db.tables.map(({ name }) => name).sort()).toEqual(Object.keys(SCHEMA_V1).sort());
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
		};
		for (const table of db.tables) {
			expect(table.schema.indexes.map(({ name }) => name)).toEqual(expectedIndexes[table.name]);
		}
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
		expect(deep.checks).toHaveLength(12);
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
		expect(report.status).toBe("warning");
		expect(report.checks.find(({ id }) => id === "sale-items-references")?.status).toBe("warning");
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
