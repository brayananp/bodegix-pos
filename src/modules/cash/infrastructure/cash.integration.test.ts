import {
	BodegixDatabase,
	type SalePaymentRecord,
	type SaleRecord,
} from "@/shared/infrastructure/local-db";
import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	closeCashSession,
	openCashSession,
	registerCashDeposit,
	registerCashWithdrawal,
} from "../application";
import { DexieCashQueries } from "./dexie-cash-queries";
import { DexieCashUnitOfWork } from "./dexie-cash-unit-of-work";

let database: BodegixDatabase;
let unitOfWork: DexieCashUnitOfWork;
let queries: DexieCashQueries;
let sequence = 0;

beforeEach(async () => {
	sequence = 0;
	database = new BodegixDatabase(`cash-test-${crypto.randomUUID()}`);
	await database.open();
	unitOfWork = new DexieCashUnitOfWork(database, {
		createId: () => `cash-id-${++sequence}`,
		now: () => 1_000 + sequence,
	});
	queries = new DexieCashQueries(database);
});

afterEach(async () => {
	database.close();
	await database.delete();
});

async function open(openingCashCents = 10_000) {
	return openCashSession(unitOfWork, { openingCashCents });
}

describe("caja Dexie", () => {
	it("abre con cero, conserva todos los campos de cierre nulos e impide otra apertura", async () => {
		const session = await open(0);
		expect(session).toMatchObject({ status: "open", openingCashCents: 0 });
		expect(await database.cashSessions.get(session.id)).toMatchObject({
			expectedCashCents: null,
			completedSalesCount: null,
			closedAt: null,
		});
		await expect(open(100)).rejects.toMatchObject({ code: "CASH_SESSION_ALREADY_OPEN" });
		expect(await database.cashSessions.where("status").equals("open").count()).toBe(1);
	});

	it("serializa una doble apertura concurrente", async () => {
		const results = await Promise.allSettled([open(1_000), open(2_000)]);
		expect(results.filter(({ status }) => status === "fulfilled")).toHaveLength(1);
		expect(results.filter(({ status }) => status === "rejected")).toHaveLength(1);
		expect(await database.cashSessions.where("status").equals("open").count()).toBe(1);
	});

	it("registra depósitos y retiros inmutables con resumen reactivo", async () => {
		const session = await open();
		await registerCashDeposit(unitOfWork, {
			cashSessionId: session.id,
			amountCents: 2_000,
			reason: "Agregar sencillo",
		});
		await registerCashWithdrawal(unitOfWork, {
			cashSessionId: session.id,
			amountCents: 3_000,
			reason: "Pago a proveedor",
		});
		const summary = await queries.getSessionSummary(session.id);
		expect(summary).toMatchObject({
			manualDepositsCents: 2_000,
			manualWithdrawalsCents: 3_000,
			expectedCashCents: 9_000,
		});
		expect(await database.cashMovements.count()).toBe(2);
	});

	it("rechaza retiros que dejarían efectivo negativo incluso si son concurrentes", async () => {
		const session = await open(5_000);
		const results = await Promise.allSettled([
			registerCashWithdrawal(unitOfWork, {
				cashSessionId: session.id,
				amountCents: 3_000,
				reason: "Primer retiro",
			}),
			registerCashWithdrawal(unitOfWork, {
				cashSessionId: session.id,
				amountCents: 3_000,
				reason: "Segundo retiro",
			}),
		]);
		expect(results.filter(({ status }) => status === "fulfilled")).toHaveLength(1);
		expect(await database.cashMovements.count()).toBe(1);
		expect((await queries.getSessionSummary(session.id))?.expectedCashCents).toBe(2_000);
	});

	it("rechaza movimientos para sesiones inexistentes o cerradas", async () => {
		await expect(
			registerCashDeposit(unitOfWork, {
				cashSessionId: "missing",
				amountCents: 100,
				reason: "Sin sesión",
			}),
		).rejects.toMatchObject({ code: "CASH_SESSION_NOT_FOUND" });
		const session = await open();
		await closeCashSession(unitOfWork, { cashSessionId: session.id, countedCashCents: 10_000 });
		await expect(
			registerCashDeposit(unitOfWork, {
				cashSessionId: session.id,
				amountCents: 100,
				reason: "Caja cerrada",
			}),
		).rejects.toMatchObject({ code: "CASH_SESSION_NOT_OPEN" });
	});

	it.each([
		[10_000, 0],
		[9_500, -500],
		[10_500, 500],
	] as const)("cierra con snapshot y diferencia %s", async (counted, difference) => {
		const session = await open();
		const result = await closeCashSession(unitOfWork, {
			cashSessionId: session.id,
			countedCashCents: counted,
		});
		expect(result).toMatchObject({ status: "closed", differenceCents: difference });
		expect(await database.cashSessions.get(session.id)).toMatchObject({
			status: "closed",
			completedSalesCount: 0,
			manualDepositsCents: 0,
			expectedCashCents: 10_000,
			countedCashCents: counted,
			differenceCents: difference,
		});
		await expect(
			closeCashSession(unitOfWork, { cashSessionId: session.id, countedCashCents: counted }),
		).rejects.toMatchObject({ code: "CASH_SESSION_ALREADY_CLOSED" });
	});

	it("lee ventas y pagos por método sin contar anulados ni efectivo recibido", async () => {
		const session = await open(5_000);
		const sales: SaleRecord[] = [
			{
				id: "sale-1",
				saleNumber: 1,
				cashSessionId: session.id,
				subtotalCents: 4_000,
				totalCents: 4_000,
				status: "completed",
				createdAt: 2_000,
				voidedAt: null,
				voidReason: null,
			},
			{
				id: "sale-2",
				saleNumber: 2,
				cashSessionId: session.id,
				subtotalCents: 3_000,
				totalCents: 3_000,
				status: "completed",
				createdAt: 2_001,
				voidedAt: null,
				voidReason: null,
			},
			{
				id: "sale-3",
				saleNumber: 3,
				cashSessionId: session.id,
				subtotalCents: 9_000,
				totalCents: 9_000,
				status: "voided",
				createdAt: 2_002,
				voidedAt: 2_003,
				voidReason: "Anulada",
			},
		];
		const paymentBase = {
			providerLabel: null,
			operationReference: null,
			changeCents: null,
			verifiedAt: 2_010,
			voidedAt: null,
			voidOperationReference: null,
			createdAt: 2_010,
		};
		const payments: SalePaymentRecord[] = [
			{
				id: "pay-1",
				saleId: "sale-1",
				method: "cash",
				amountCents: 3_000,
				status: "confirmed",
				cashReceivedCents: 5_000,
				...paymentBase,
			},
			{
				id: "pay-2",
				saleId: "sale-1",
				method: "yape",
				amountCents: 1_000,
				status: "manually_verified",
				cashReceivedCents: null,
				...paymentBase,
			},
			{
				id: "pay-3",
				saleId: "sale-2",
				method: "card",
				amountCents: 2_000,
				status: "confirmed",
				cashReceivedCents: null,
				...paymentBase,
			},
			{
				id: "pay-4",
				saleId: "sale-2",
				method: "bank_transfer",
				amountCents: 500,
				status: "confirmed",
				cashReceivedCents: null,
				...paymentBase,
			},
			{
				id: "pay-5",
				saleId: "sale-2",
				method: "plin",
				amountCents: 500,
				status: "voided",
				cashReceivedCents: null,
				...paymentBase,
			},
			{
				id: "pay-6",
				saleId: "sale-3",
				method: "cash",
				amountCents: 9_000,
				status: "confirmed",
				cashReceivedCents: 9_000,
				...paymentBase,
			},
		];
		await database.sales.bulkAdd(sales);
		await database.salePayments.bulkAdd(payments);
		const before = await queries.getSessionSummary(session.id);
		expect(before).toMatchObject({
			completedSalesCount: 2,
			totalSalesCents: 7_000,
			paymentTotals: {
				cashCents: 3_000,
				yapeCents: 1_000,
				plinCents: 0,
				cardCents: 2_000,
				bankTransferCents: 500,
			},
			expectedCashCents: 8_000,
		});
		await closeCashSession(unitOfWork, { cashSessionId: session.id, countedCashCents: 8_000 });
		await database.salePayments.update("pay-1", { amountCents: 99_000 });
		expect(await queries.getSessionSummary(session.id)).toMatchObject({
			paymentTotals: { cashCents: 3_000 },
			expectedCashCents: 8_000,
			snapshotAvailable: true,
		});
	});

	it("revierte un movimiento si falla su inserción", async () => {
		const session = await open();
		await database.cashMovements.add({
			id: "duplicate",
			cashSessionId: session.id,
			type: "deposit",
			amountCents: 100,
			reason: "Existente",
			createdAt: 1_100,
		});
		const failing = new DexieCashUnitOfWork(database, {
			createId: () => "duplicate",
			now: () => 2_000,
		});
		await expect(
			registerCashDeposit(failing, {
				cashSessionId: session.id,
				amountCents: 200,
				reason: "Duplicado",
			}),
		).rejects.toMatchObject({ code: "CASH_PERSISTENCE_FAILED" });
		expect(await database.cashMovements.count()).toBe(1);
	});

	it("pagina sesiones y movimientos en orden descendente", async () => {
		const first = await open(100);
		await registerCashDeposit(unitOfWork, {
			cashSessionId: first.id,
			amountCents: 10,
			reason: "Movimiento uno",
		});
		await registerCashDeposit(unitOfWork, {
			cashSessionId: first.id,
			amountCents: 20,
			reason: "Movimiento dos",
		});
		await closeCashSession(unitOfWork, { cashSessionId: first.id, countedCashCents: 130 });
		const second = await open(200);
		const sessions = await queries.listSessions({ page: 1, pageSize: 25 });
		expect(sessions.items.map(({ id }) => id)).toEqual([second.id, first.id]);
		const movements = await queries.listMovements({
			cashSessionId: first.id,
			page: 1,
			pageSize: 25,
		});
		expect(movements.items.map(({ amountCents }) => amountCents)).toEqual([20, 10]);
	});
});
