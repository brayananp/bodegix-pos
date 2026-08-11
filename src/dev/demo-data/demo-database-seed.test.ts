import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "vitest";
import { BodegixDatabase, runDatabaseDiagnostics } from "@/shared/infrastructure/local-db";
import { seedDemoDatabase } from "./demo-database-seed";

let database: BodegixDatabase | undefined;

afterEach(async () => {
	if (!database) return;
	database.close();
	await database.delete();
	database = undefined;
});

describe("seed de demostración", () => {
	it("carga escenarios completos y conserva todas las invariantes", async () => {
		database = new BodegixDatabase(`demo-seed-test-${crypto.randomUUID()}`);
		const summary = await seedDemoDatabase(database);

		expect(summary).toMatchObject({
			businessName: "Bodega Demo Bodegix",
			categories: 6,
			products: 18,
			cashSessions: 2,
			sales: 8,
			voidedSales: 1,
			draftItems: 2,
			openCashSession: true,
			diagnostics: "pass",
		});
		expect((await runDatabaseDiagnostics(database, "deep")).status).toBe("pass");
	});

	it("rechaza una segunda carga para no pisar datos existentes", async () => {
		database = new BodegixDatabase(`demo-seed-test-${crypto.randomUUID()}`);
		await seedDemoDatabase(database);
		await expect(seedDemoDatabase(database)).rejects.toThrow("solo se carga sobre una base vacía");
	});
});
