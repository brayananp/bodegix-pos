import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DexieCashQueries } from "@/modules/cash";
import { BodegixDatabase, runDatabaseDiagnostics } from "@/shared/infrastructure/local-db";
import { DexieSaleHistoryQueries } from "./dexie-sale-history-queries";
import { DexieVoidSaleUnitOfWork } from "./dexie-void-sale-unit-of-work";

let database: BodegixDatabase;
let sequence = 0;

beforeEach(async () => {
	sequence = 0;
	database = new BodegixDatabase(`sale-void-test-${crypto.randomUUID()}`);
	await database.open();
});

afterEach(async () => {
	vi.restoreAllMocks();
	database.close();
	await database.delete();
});

async function seedSale(
	options: {
		saleId?: string;
		saleNumber?: number;
		createdAt?: number;
		duplicateLine?: boolean;
		mixed?: boolean;
	} = {},
) {
	const saleId = options.saleId ?? "sale-1";
	const saleNumber = options.saleNumber ?? 1;
	const createdAt = options.createdAt ?? 200;
	if (!(await database.cashSessions.get("cash-1"))) {
		await database.cashSessions.add({
			id: "cash-1",
			status: "open",
			openingCashCents: 10_000,
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
		});
	}
	if (!(await database.products.get("product-1"))) {
		await database.products.add({
			id: "product-1",
			barcode: null,
			name: "Arroz",
			normalizedName: "arroz",
			categoryId: null,
			salePriceCents: 500,
			costPriceCents: 300,
			stockQuantity: 7,
			minimumStockQuantity: 1,
			isActive: true,
			createdAt: 50,
			updatedAt: createdAt,
		});
	}
	await database.sales.add({
		id: saleId,
		saleNumber,
		cashSessionId: "cash-1",
		subtotalCents: 1_000,
		totalCents: 1_000,
		status: "completed",
		createdAt,
		voidedAt: null,
		voidReason: null,
	});
	const items = options.duplicateLine
		? [
				{
					id: `${saleId}-item-1`,
					saleId,
					productId: "product-1",
					productName: "Arroz",
					unitPriceCents: 500,
					unitCostCents: 300,
					quantity: 1,
					subtotalCents: 500,
				},
				{
					id: `${saleId}-item-2`,
					saleId,
					productId: "product-1",
					productName: "Arroz",
					unitPriceCents: 500,
					unitCostCents: 300,
					quantity: 1,
					subtotalCents: 500,
				},
			]
		: [
				{
					id: `${saleId}-item-1`,
					saleId,
					productId: "product-1",
					productName: "Arroz",
					unitPriceCents: 500,
					unitCostCents: 300,
					quantity: 2,
					subtotalCents: 1_000,
				},
			];
	await database.saleItems.bulkAdd(items);
	await database.inventoryMovements.bulkAdd(
		items.map((item, index) => ({
			id: `${saleId}-movement-${index}`,
			productId: item.productId,
			type: "sale" as const,
			quantityDelta: -item.quantity,
			stockBefore: 9 - index,
			stockAfter: 8 - index,
			referenceType: "sale" as const,
			referenceId: saleId,
			reason: null,
			createdAt,
		})),
	);
	const payments = options.mixed
		? [
				{
					id: `${saleId}-cash`,
					saleId,
					method: "cash" as const,
					amountCents: 400,
					status: "confirmed" as const,
					providerLabel: null,
					operationReference: null,
					cashReceivedCents: 500,
					changeCents: 100,
					verifiedAt: createdAt,
					voidedAt: null,
					voidOperationReference: null,
					createdAt,
				},
				{
					id: `${saleId}-yape`,
					saleId,
					method: "yape" as const,
					amountCents: 600,
					status: "manually_verified" as const,
					providerLabel: "Yape",
					operationReference: "OP-1",
					cashReceivedCents: null,
					changeCents: null,
					verifiedAt: createdAt,
					voidedAt: null,
					voidOperationReference: null,
					createdAt,
				},
			]
		: [
				{
					id: `${saleId}-cash`,
					saleId,
					method: "cash" as const,
					amountCents: 1_000,
					status: "confirmed" as const,
					providerLabel: null,
					operationReference: null,
					cashReceivedCents: 1_000,
					changeCents: 0,
					verifiedAt: createdAt,
					voidedAt: null,
					voidOperationReference: null,
					createdAt,
				},
			];
	await database.salePayments.bulkAdd(payments);
	return { saleId, items, payments };
}

function createUnitOfWork(now = 300) {
	return new DexieVoidSaleUnitOfWork(database, {
		now: () => now,
		createId: () => `void-${++sequence}`,
	});
}

describe("historial Dexie de ventas", () => {
	it("consulta vacío y filtra/busca/ordena sin N+1 por fila", async () => {
		const queries = new DexieSaleHistoryQueries(database);
		expect(
			(await queries.searchSales({ sort: "newest" }, { page: 1, pageSize: 25 })).items,
		).toEqual([]);
		await seedSale({ saleId: "sale-1", saleNumber: 1, createdAt: 200, mixed: true });
		await seedSale({ saleId: "sale-2", saleNumber: 2, createdAt: 300 });
		expect(
			(
				await queries.searchSales(
					{ searchText: "V-000001", sort: "newest" },
					{ page: 1, pageSize: 25 },
				)
			).items[0]?.id,
		).toBe("sale-1");
		expect(
			(
				await queries.searchSales(
					{ paymentMethod: "yape", sort: "newest" },
					{ page: 1, pageSize: 25 },
				)
			).items.map(({ id }) => id),
		).toEqual(["sale-1"]);
		expect(
			(
				await queries.searchSales(
					{ fromDate: 250, toDate: 350, sort: "oldest" },
					{ page: 1, pageSize: 25 },
				)
			).items.map(({ id }) => id),
		).toEqual(["sale-2"]);
		const detail = await queries.getSaleDetail("sale-1");
		expect(detail).toMatchObject({ formattedSaleNumber: "V-000001", cashSessionStatus: "open" });
		expect(detail?.items[0]).toMatchObject({ productName: "Arroz", unitPriceCents: 500 });
	});
});

describe("anulación transaccional Dexie", () => {
	it("anula una venta mixta, conserva históricos, restaura stock y reconstruye el resultado", async () => {
		const { saleId, payments } = await seedSale({ mixed: true });
		const cashQueries = new DexieCashQueries(database);
		expect((await cashQueries.getSessionSummary("cash-1"))?.expectedCashCents).toBe(10_400);
		const result = await createUnitOfWork().execute({
			saleId,
			reason: "Cliente canceló",
			paymentReversals: payments.map((payment) => ({
				paymentId: payment.id,
				confirmed: true,
				reversalReference: payment.method === "yape" ? "DEV-99" : null,
			})),
		});
		expect(result).toMatchObject({ restoredItemCount: 1, restoredUnitCount: 2 });
		expect(await database.sales.get(saleId)).toMatchObject({
			status: "voided",
			voidReason: "Cliente canceló",
		});
		expect(await database.salePayments.get(`${saleId}-yape`)).toMatchObject({
			status: "voided",
			voidOperationReference: "DEV-99",
		});
		expect(await database.products.get("product-1")).toMatchObject({ stockQuantity: 9 });
		expect(await database.saleItems.where("saleId").equals(saleId).count()).toBe(1);
		expect(
			await database.inventoryMovements
				.where("[referenceType+referenceId]")
				.equals(["sale", saleId])
				.count(),
		).toBe(2);
		expect(await database.cashMovements.count()).toBe(0);
		expect((await cashQueries.getSessionSummary("cash-1"))?.expectedCashCents).toBe(10_000);
		expect(await new DexieSaleHistoryQueries(database).getSaleVoidResult(saleId)).toMatchObject({
			reason: "Cliente canceló",
			restoredUnitCount: 2,
		});
		expect(
			(await runDatabaseDiagnostics(database, "deep")).checks.find(
				({ id }) => id === "sales-integrity",
			)?.status,
		).toBe("pass");
	});

	it("agrupa líneas duplicadas por producto y permite restaurar un producto inactivo", async () => {
		const { saleId, payments } = await seedSale({ duplicateLine: true });
		await database.products.update("product-1", { isActive: false });
		await createUnitOfWork().execute({
			saleId,
			reason: "Producto equivocado",
			paymentReversals: payments.map(({ id }) => ({
				paymentId: id,
				confirmed: true,
				reversalReference: null,
			})),
		});
		const restorations = await database.inventoryMovements
			.where("[referenceType+referenceId]")
			.equals(["sale", saleId])
			.filter(({ type }) => type === "sale_void")
			.toArray();
		expect(restorations).toHaveLength(1);
		expect(restorations[0]).toMatchObject({ productId: "product-1", quantityDelta: 2 });
	});

	it.each([
		[
			"pago omitido",
			async (saleId: string) => database.salePayments.where("saleId").equals(saleId).delete(),
			"SALE_PAYMENT_MISSING",
		],
		[
			"ítem omitido",
			async (saleId: string) => database.saleItems.where("saleId").equals(saleId).delete(),
			"SALE_ITEM_MISSING",
		],
		[
			"producto inexistente",
			async () => database.products.delete("product-1"),
			"SALE_PRODUCT_MISSING",
		],
		[
			"sesión cerrada",
			async () => database.cashSessions.update("cash-1", { status: "closed", closedAt: 250 }),
			"SALE_CASH_SESSION_CLOSED",
		],
	] as const)("rechaza %s y revierte toda escritura", async (_label, mutate, code) => {
		const { saleId, payments } = await seedSale();
		await mutate(saleId);
		await expect(
			createUnitOfWork().execute({
				saleId,
				reason: "Cliente canceló",
				paymentReversals: payments.map(({ id }) => ({
					paymentId: id,
					confirmed: true,
					reversalReference: null,
				})),
			}),
		).rejects.toMatchObject({ code });
		expect(await database.sales.get(saleId)).toMatchObject({ status: "completed", voidedAt: null });
		expect(
			await database.inventoryMovements
				.where("[referenceType+referenceId]")
				.equals(["sale", saleId])
				.filter(({ type }) => type === "sale_void")
				.count(),
		).toBe(0);
	});

	it("rechaza confirmaciones incompletas sin cambios", async () => {
		const { saleId } = await seedSale({ mixed: true });
		await expect(
			createUnitOfWork().execute({
				saleId,
				reason: "Cliente canceló",
				paymentReversals: [
					{ paymentId: `${saleId}-cash`, confirmed: true, reversalReference: null },
				],
			}),
		).rejects.toMatchObject({ code: "PAYMENT_REVERSAL_MISMATCH" });
		expect(await database.products.get("product-1")).toMatchObject({ stockQuantity: 7 });
	});

	it("hace rollback si falla la persistencia de un movimiento", async () => {
		const { saleId, payments } = await seedSale();
		vi.spyOn(database.inventoryMovements, "add").mockRejectedValueOnce(new Error("disk failure"));
		await expect(
			createUnitOfWork().execute({
				saleId,
				reason: "Cliente canceló",
				paymentReversals: payments.map(({ id }) => ({
					paymentId: id,
					confirmed: true,
					reversalReference: null,
				})),
			}),
		).rejects.toMatchObject({ code: "SALE_VOID_PERSISTENCE_FAILED" });
		expect(await database.products.get("product-1")).toMatchObject({ stockQuantity: 7 });
		expect(await database.sales.get(saleId)).toMatchObject({ status: "completed" });
	});

	it("serializa dos anulaciones concurrentes y restaura una sola vez", async () => {
		const { saleId, payments } = await seedSale();
		const input = {
			saleId,
			reason: "Cliente canceló",
			paymentReversals: payments.map(({ id }) => ({
				paymentId: id,
				confirmed: true,
				reversalReference: null,
			})),
		};
		const results = await Promise.allSettled([
			createUnitOfWork().execute(input),
			createUnitOfWork().execute(input),
		]);
		expect(results.filter(({ status }) => status === "fulfilled")).toHaveLength(1);
		expect(await database.products.get("product-1")).toMatchObject({ stockQuantity: 9 });
		expect(
			await database.inventoryMovements
				.where("[referenceType+referenceId]")
				.equals(["sale", saleId])
				.filter(({ type }) => type === "sale_void")
				.count(),
		).toBe(1);
	});

	it("el diagnóstico detecta pago activo y restauración faltante en una venta anulada", async () => {
		const { saleId, payments } = await seedSale({ mixed: true });
		await createUnitOfWork().execute({
			saleId,
			reason: "Cliente canceló",
			paymentReversals: payments.map(({ id }) => ({
				paymentId: id,
				confirmed: true,
				reversalReference: null,
			})),
		});
		await database.salePayments.update(`${saleId}-cash`, { status: "confirmed" });
		let check = (await runDatabaseDiagnostics(database, "deep")).checks.find(
			({ id }) => id === "sales-integrity",
		);
		expect(check).toMatchObject({ status: "fail" });

		await database.salePayments.update(`${saleId}-cash`, { status: "voided" });
		await database.inventoryMovements
			.where("[referenceType+referenceId]")
			.equals(["sale", saleId])
			.filter(({ type }) => type === "sale_void")
			.delete();
		check = (await runDatabaseDiagnostics(database, "deep")).checks.find(
			({ id }) => id === "sales-integrity",
		);
		expect(check).toMatchObject({ status: "fail" });
	});
});
