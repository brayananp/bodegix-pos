import type {
	BodegixDatabase,
	CashSessionRecord,
	PaymentMethod,
} from "@/shared/infrastructure/local-db";
import {
	CashError,
	type CashPaymentTotals,
	type CashSessionSummary,
	calculateExpectedCash,
} from "../domain";

const ZERO_PAYMENTS: CashPaymentTotals = {
	cashCents: 0,
	yapeCents: 0,
	plinCents: 0,
	cardCents: 0,
	bankTransferCents: 0,
};

function paymentKey(method: PaymentMethod): keyof CashPaymentTotals {
	if (method === "cash") return "cashCents";
	if (method === "yape") return "yapeCents";
	if (method === "plin") return "plinCents";
	if (method === "card") return "cardCents";
	return "bankTransferCents";
}

export function hasCompleteSnapshot(session: CashSessionRecord): boolean {
	return [
		session.completedSalesCount,
		session.totalSalesCents,
		session.cashSalesCents,
		session.yapeSalesCents,
		session.plinSalesCents,
		session.cardSalesCents,
		session.bankTransferSalesCents,
		session.manualDepositsCents,
		session.manualWithdrawalsCents,
		session.expectedCashCents,
	].every((value) => value !== null);
}

export function summaryFromSnapshot(session: CashSessionRecord): CashSessionSummary {
	if (session.expectedCashCents === null) throw new CashError("CASH_SUMMARY_INCONSISTENT");
	const complete = hasCompleteSnapshot(session);
	return {
		sessionId: session.id,
		status: session.status,
		openingCashCents: session.openingCashCents,
		completedSalesCount: session.completedSalesCount ?? 0,
		totalSalesCents: session.totalSalesCents ?? 0,
		paymentTotals: complete
			? {
					cashCents: session.cashSalesCents ?? 0,
					yapeCents: session.yapeSalesCents ?? 0,
					plinCents: session.plinSalesCents ?? 0,
					cardCents: session.cardSalesCents ?? 0,
					bankTransferCents: session.bankTransferSalesCents ?? 0,
				}
			: { ...ZERO_PAYMENTS },
		manualDepositsCents: session.manualDepositsCents ?? 0,
		manualWithdrawalsCents: session.manualWithdrawalsCents ?? 0,
		expectedCashCents: session.expectedCashCents,
		countedCashCents: session.countedCashCents,
		differenceCents: session.differenceCents,
		openedAt: session.openedAt,
		closedAt: session.closedAt,
		snapshotAvailable: complete,
	};
}

export async function calculateOpenSessionSummary(
	database: BodegixDatabase,
	session: CashSessionRecord,
): Promise<CashSessionSummary> {
	const [movements, sales] = await Promise.all([
		database.cashMovements.where("cashSessionId").equals(session.id).toArray(),
		database.sales.where("cashSessionId").equals(session.id).toArray(),
	]);
	const completedSales = sales.filter(({ status }) => status === "completed");
	const saleIds = completedSales.map(({ id }) => id);
	const payments =
		saleIds.length === 0
			? []
			: await database.salePayments.where("saleId").anyOf(saleIds).toArray();
	const paymentTotals = { ...ZERO_PAYMENTS };
	for (const payment of payments) {
		if (payment.status === "voided") continue;
		const key = paymentKey(payment.method);
		paymentTotals[key] += payment.amountCents;
	}
	const manualDepositsCents = movements
		.filter(({ type }) => type === "deposit")
		.reduce((sum, movement) => sum + movement.amountCents, 0);
	const manualWithdrawalsCents = movements
		.filter(({ type }) => type === "withdrawal")
		.reduce((sum, movement) => sum + movement.amountCents, 0);
	const expectedCashCents = calculateExpectedCash({
		openingCashCents: session.openingCashCents,
		cashSalesCents: paymentTotals.cashCents,
		manualDepositsCents,
		manualWithdrawalsCents,
	});
	return {
		sessionId: session.id,
		status: session.status,
		openingCashCents: session.openingCashCents,
		completedSalesCount: completedSales.length,
		totalSalesCents: completedSales.reduce((sum, sale) => sum + sale.totalCents, 0),
		paymentTotals,
		manualDepositsCents,
		manualWithdrawalsCents,
		expectedCashCents,
		countedCashCents: session.countedCashCents,
		differenceCents: session.differenceCents,
		openedAt: session.openedAt,
		closedAt: session.closedAt,
		snapshotAvailable: false,
	};
}
