import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "vitest";
import { BodegixDatabase, initializeLocalDatabase } from "@/shared/infrastructure/local-db";
import {
	createBackup,
	inspectBackup,
	restoreBackup,
	saveCreatedBackup,
	type BackupFileGateway,
} from "../application";
import { BrowserBackupCryptoGateway } from "./browser-backup-crypto-gateway";
import {
	canonicalizeJson,
	encodeBackupContainer,
	parseBackupContainer,
} from "./backup-container-codec";
import { createBackupSchemaDescriptor } from "./backup-schema-registry";
import { DexieBackupDatabaseGateway } from "./dexie-backup-database-gateway";

let database: BodegixDatabase | undefined;

afterEach(async () => {
	if (!database) return;
	database.close();
	await database.delete();
	database = undefined;
});

function dependencies(db: BodegixDatabase) {
	return {
		database: new DexieBackupDatabaseGateway(db),
		crypto: new BrowserBackupCryptoGateway(),
		encodeContainer: encodeBackupContainer,
		parseContainer: parseBackupContainer,
		canonicalize: canonicalizeJson,
		schema: createBackupSchemaDescriptor(db),
		migrations: [],
	};
}

async function preparedDatabase() {
	const db = new BodegixDatabase(`bodegix-backup-test-${crypto.randomUUID()}`);
	database = db;
	await initializeLocalDatabase(db);
	await db.categories.add({
		id: "category-original",
		name: "Abarrotes",
		normalizedName: "abarrotes",
		isActive: true,
		createdAt: 1,
		updatedAt: 1,
	});
	await db.products.add({
		id: "product-original",
		barcode: "775000000001",
		name: "Arroz",
		normalizedName: "arroz",
		categoryId: "category-original",
		salePriceCents: 500,
		costPriceCents: 350,
		stockQuantity: 0,
		minimumStockQuantity: 2,
		isActive: true,
		createdAt: 1,
		updatedAt: 1,
	});
	return db;
}

describe("respaldo completo con Dexie", () => {
	it("exporta todas las tablas, inspecciona metadata y valida en una base temporal", async () => {
		const db = await preparedDatabase();
		const services = dependencies(db);
		const phases: string[] = [];
		const artifact = await createBackup(services, {
			source: "manual",
			onProgress: ({ phase }) => phases.push(phase),
		});
		expect(artifact.file.name).toMatch(/\.bodegix$/);
		expect(artifact.file.manifest.tables.map(({ name }) => name)).toEqual(
			db.tables.map(({ name }) => name).sort((left, right) => left.localeCompare(right)),
		);
		expect(artifact.file.manifest.tables).toHaveLength(10);
		expect(phases).toContain("exporting");

		const inspected = await inspectBackup(artifact.file.blob, services);
		expect(inspected.metadata.tables).toHaveLength(10);
		expect(inspected.validation.status).not.toBe("invalid");
		expect(inspected.validation.tableCounts.products).toBe(1);
		expect(inspected.validation.tableCounts.appSettings).toBe(1);
	});

	it("reemplaza todo, conserva IDs e identidad y ejecuta diagnóstico posterior", async () => {
		const db = await preparedDatabase();
		const services = dependencies(db);
		const originalInstallationId = (await db.appSettings.get("main"))?.installationId;
		const artifact = await createBackup(services, { source: "manual" });
		const inspected = await inspectBackup(artifact.file.blob, services);

		await db.categories.clear();
		await db.products.clear();
		await db.categories.add({
			id: "category-new",
			name: "Temporal",
			normalizedName: "temporal",
			isActive: true,
			createdAt: 2,
			updatedAt: 2,
		});
		const safetyBackup = await createBackup(services, { source: "pre_restore" });
		const progress: string[] = [];
		const result = await restoreBackup(
			{ inspected, safetyBackup, onProgress: ({ phase }) => progress.push(phase) },
			{
				database: services.database,
				maintenance: { runExclusive: (operation) => operation() },
			},
		);

		expect(await db.categories.toArray()).toEqual([
			expect.objectContaining({ id: "category-original", name: "Abarrotes" }),
		]);
		expect(await db.products.get("product-original")).toBeDefined();
		expect(await db.categories.get("category-new")).toBeUndefined();
		expect((await db.appSettings.get("main"))?.installationId).toBe(originalInstallationId);
		expect(result.diagnostics.status).not.toBe("fail");
		expect(progress).toContain("verifying_restore");
	});

	it("solo actualiza lastBackupAt después de guardar un respaldo manual", async () => {
		const db = await preparedDatabase();
		const services = dependencies(db);
		const manual = await createBackup({ ...services, now: () => 10_000 }, { source: "manual" });
		const saved: BackupFileGateway = {
			save: async () => ({ status: "saved", strategy: "download" }),
			open: async () => null,
		};
		await saveCreatedBackup(manual, saved, services.database);
		expect((await db.appSettings.get("main"))?.lastBackupAt).toBe(10_000);

		const preRestore = await createBackup(
			{ ...services, now: () => 20_000 },
			{ source: "pre_restore" },
		);
		await saveCreatedBackup(preRestore, saved, services.database);
		expect((await db.appSettings.get("main"))?.lastBackupAt).toBe(10_000);

		const cancelled: BackupFileGateway = {
			save: async () => ({ status: "cancelled" }),
			open: async () => null,
		};
		const anotherManual = await createBackup(
			{ ...services, now: () => 30_000 },
			{ source: "manual" },
		);
		await saveCreatedBackup(anotherManual, cancelled, services.database);
		expect((await db.appSettings.get("main"))?.lastBackupAt).toBe(10_000);
	});

	it("impide restaurar sin una copia previa de tipo pre_restore", async () => {
		const db = await preparedDatabase();
		const services = dependencies(db);
		const artifact = await createBackup(services, { source: "manual" });
		const inspected = await inspectBackup(artifact.file.blob, services);
		await expect(
			restoreBackup(
				{ inspected, safetyBackup: artifact },
				{
					database: services.database,
					maintenance: { runExclusive: (operation) => operation() },
				},
			),
		).rejects.toMatchObject({ code: "BACKUP_SAFETY_COPY_REQUIRED" });
	});
});
