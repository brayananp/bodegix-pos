import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { BodegixDatabase } from "@/shared/infrastructure/local-db";
import { getBusinessDayRange } from "@/shared/kernel/dates";
import { DexieDailyReportingQueries } from "./dexie-daily-reporting-queries";

const DATE = "2026-08-03";
const TIMEZONE = "America/Lima";
const range = getBusinessDayRange(DATE, TIMEZONE);
let database: BodegixDatabase;
let queries: DexieDailyReportingQueries;

function at(hours: number): number {
	return range.start + hours * 60 * 60 * 1_000;
}

async function addSettings() {
	await database.appSettings.add({
		id: "main",
		installationId: "installation-test",
		setupCompleted: true,
		businessName: "Bodega prueba",
		currency: "PEN",
		timezone: TIMEZONE,
		nextSaleNumber: 10,
		backupReminderDays: 7,
		lastBackupAt: null,
		createdAt: 1,
		updatedAt: 1,
	});
}

async function addSession(
	id: string,
	overrides: Partial<Parameters<typeof database.cashSessions.add>[0]> = {},
) {
	await database.cashSessions.add({
		id,
		status: "closed",
		openingCashCents: 10_000,
		completedSalesCount: 1,
		totalSalesCents: 1_500,
		cashSalesCents: 1_000,
		yapeSalesCents: 500,
		plinSalesCents: 0,
		cardSalesCents: 0,
		bankTransferSalesCents: 0,
		manualDepositsCents: 200,
		manualWithdrawalsCents: 100,
		expectedCashCents: 11_100,
		countedCashCents: 11_050,
		differenceCents: -50,
		openedAt: at(1),
		closedAt: at(20),
		...overrides,
	});
}

async function addSale(
	id: string,
	overrides: Partial<Parameters<typeof database.sales.add>[0]> = {},
) {
	await database.sales.add({
		id,
		saleNumber: id === "sale-1" ? 1 : 2,
		cashSessionId: "session-1",
		subtotalCents: 1_500,
		totalCents: 1_500,
		status: "completed",
		createdAt: at(10),
		voidedAt: null,
		voidReason: null,
		...overrides,
	});
}

beforeEach(async () => {
	database = new BodegixDatabase(`reporting-test-${crypto.randomUUID()}`);
	await database.open();
	await addSettings();
	queries = new DexieDailyReportingQueries(database);
});

afterEach(async () => {
	database.close();
	await database.delete();
});

describe("DexieDailyReportingQueries", () => {
	it("devuelve un día sin actividad y alertas actuales sin inventar stock histórico", async () => {
		await database.products.bulkAdd([
			{
				id: "out",
				barcode: null,
				name: "Agotado",
				normalizedName: "agotado",
				categoryId: null,
				salePriceCents: 100,
				costPriceCents: null,
				stockQuantity: 0,
				minimumStockQuantity: 2,
				isActive: true,
				createdAt: 1,
				updatedAt: 1,
			},
			{
				id: "low",
				barcode: null,
				name: "Bajo",
				normalizedName: "bajo",
				categoryId: null,
				salePriceCents: 100,
				costPriceCents: null,
				stockQuantity: 1,
				minimumStockQuantity: 2,
				isActive: true,
				createdAt: 1,
				updatedAt: 1,
			},
		]);

		const summary = await queries.getDailyOperationalSummary({ date: DATE, timezone: TIMEZONE });
		expect(summary.status).toBe("no_activity");
		expect(summary.sales.completedSalesCents).toBe(0);
		expect(summary.inventory).toMatchObject({
			currentLowStockProducts: 1,
			currentOutOfStockProducts: 1,
			currentProductsWithoutMovements: 2,
		});
		expect(summary.periodEndExclusive).toBe(range.endExclusive);
	});

	it("agrega ventas, pagos, snapshots de producto e inventario sin N+1", async () => {
		await addSession("session-1");
		await addSale("sale-1");
		await database.saleItems.bulkAdd([
			{
				id: "item-1",
				saleId: "sale-1",
				productId: "product-1",
				productName: "Leche histórica",
				unitPriceCents: 500,
				unitCostCents: 300,
				quantity: 2,
				subtotalCents: 1_000,
			},
			{
				id: "item-2",
				saleId: "sale-1",
				productId: "product-2",
				productName: "Pan histórico",
				unitPriceCents: 500,
				unitCostCents: null,
				quantity: 1,
				subtotalCents: 500,
			},
		]);
		await database.salePayments.bulkAdd([
			{
				id: "payment-cash",
				saleId: "sale-1",
				method: "cash",
				amountCents: 1_000,
				status: "confirmed",
				providerLabel: null,
				operationReference: null,
				cashReceivedCents: 2_000,
				changeCents: 1_000,
				verifiedAt: at(10),
				voidedAt: null,
				voidOperationReference: null,
				createdAt: at(10),
			},
			{
				id: "payment-yape",
				saleId: "sale-1",
				method: "yape",
				amountCents: 500,
				status: "manually_verified",
				providerLabel: "Yape",
				operationReference: "ABC123",
				cashReceivedCents: null,
				changeCents: null,
				verifiedAt: at(10),
				voidedAt: null,
				voidOperationReference: null,
				createdAt: at(10),
			},
		]);
		await database.inventoryMovements.bulkAdd([
			{
				id: "movement-sale",
				productId: "product-1",
				type: "sale",
				quantityDelta: -2,
				stockBefore: 5,
				stockAfter: 3,
				referenceType: "sale",
				referenceId: "sale-1",
				reason: null,
				createdAt: at(10),
			},
			{
				id: "movement-purchase",
				productId: "product-1",
				type: "purchase",
				quantityDelta: 6,
				stockBefore: 3,
				stockAfter: 9,
				referenceType: "manual",
				referenceId: null,
				reason: "Compra",
				createdAt: at(12),
			},
		]);

		const summary = await queries.getDailyOperationalSummary({ date: DATE, timezone: TIMEZONE });
		expect(summary.sales).toMatchObject({
			completedSalesCount: 1,
			completedSalesCents: 1_500,
			lineCount: 2,
			unitCount: 3,
			averageTicketCents: 1_500,
		});
		expect(summary.payments).toMatchObject({ cashCents: 1_000, yapeCents: 500, totalCents: 1_500 });
		expect(summary.inventory).toMatchObject({ soldUnits: 3, purchaseEntryUnits: 6 });
		expect(summary.topProducts[0]).toMatchObject({
			productName: "Leche histórica",
			unitsSold: 2,
		});
		expect(summary.recentSales[0]).toMatchObject({
			formattedSaleNumber: "V-000001",
			paymentMethods: ["cash", "yape"],
		});
		expect(summary.closeChecklist.status).toBe("warning");
		expect(summary.closeChecklist.items).toContainEqual(
			expect.objectContaining({ id: "recent-backup", status: "warning", action: "backup" }),
		);
	});

	it("distingue ventas anuladas creadas de anulaciones procesadas", async () => {
		await addSale("sale-void-today", {
			status: "voided",
			voidedAt: at(12),
			voidReason: "Error",
			totalCents: 800,
			subtotalCents: 800,
		});
		await addSale("sale-void-old", {
			saleNumber: 3,
			status: "voided",
			createdAt: range.start - 86_400_000,
			voidedAt: at(13),
			voidReason: "Devolución",
			totalCents: 900,
			subtotalCents: 900,
		});

		const summary = await queries.getDailyOperationalSummary({ date: DATE, timezone: TIMEZONE });
		expect(summary.sales).toMatchObject({
			voidedSalesCreatedCount: 1,
			voidedSalesCreatedCents: 800,
			voidOperationsCount: 2,
			voidOperationsCents: 1_700,
		});
	});

	it("usa snapshots cerrados y movimientos diarios en sesiones que intersectan el día", async () => {
		await addSession("session-1", { openedAt: range.start - 1_000, closedAt: at(2) });
		await database.cashMovements.bulkAdd([
			{
				id: "deposit",
				cashSessionId: "session-1",
				type: "deposit",
				amountCents: 300,
				reason: "Cambio",
				createdAt: at(1),
			},
			{
				id: "outside",
				cashSessionId: "session-1",
				type: "withdrawal",
				amountCents: 999,
				reason: "Fuera",
				createdAt: range.endExclusive,
			},
		]);

		const summary = await queries.getDailyOperationalSummary({ date: DATE, timezone: TIMEZONE });
		expect(summary.cash).toMatchObject({
			relatedSessionCount: 1,
			closedSessionCount: 1,
			manualDepositsCents: 300,
			manualWithdrawalsCents: 0,
			closedSessionDifferenceCents: -50,
		});
		expect(summary.cash.sessions[0]).toMatchObject({
			openingCashCents: 10_000,
			cashSalesCents: 1_000,
			openedBeforeSelectedDay: true,
		});
	});

	it("muestra advertencias del carrito y de una sesión abierta", async () => {
		await addSession("session-1", {
			status: "open",
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
			closedAt: null,
		});
		await database.saleDrafts.add({
			id: "main",
			items: [{ productId: "product-1", quantity: 1, expectedUnitPriceCents: 100 }],
			updatedAt: at(2),
		});

		const summary = await queries.getDailyOperationalSummary({ date: DATE, timezone: TIMEZONE });
		expect(summary.status).toBe("in_progress");
		expect(summary.closeChecklist).toMatchObject({
			cashSessionsClosed: false,
			saleDraftEmpty: false,
			status: "warning",
		});
		expect(summary.cash.sessions[0]?.expectedCashCents).toBe(10_000);
	});

	it("conserva fondos y estados independientes para varias sesiones del mismo día", async () => {
		await addSession("session-1", { openedAt: at(1), closedAt: at(5) });
		await addSession("session-2", {
			openingCashCents: 20_000,
			openedAt: at(8),
			closedAt: at(16),
			expectedCashCents: 21_100,
			countedCashCents: 21_100,
			differenceCents: 0,
		});

		const summary = await queries.getDailyOperationalSummary({ date: DATE, timezone: TIMEZONE });
		expect(summary.cash).toMatchObject({
			relatedSessionCount: 2,
			closedSessionCount: 2,
			openSessionCount: 0,
			closedSessionDifferenceCents: -50,
		});
		expect(summary.cash.sessions.map(({ openingCashCents }) => openingCashCents)).toEqual([
			10_000, 20_000,
		]);
	});

	it("rechaza una zona distinta a la configuración", async () => {
		await expect(
			queries.getDailyOperationalSummary({ date: DATE, timezone: "UTC" }),
		).rejects.toMatchObject({ code: "INVALID_REPORTING_PERIOD" });
	});
});
