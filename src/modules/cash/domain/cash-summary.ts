import type { CashSessionStatus } from "./cash-session";

export interface CashPaymentTotals {
	cashCents: number;
	yapeCents: number;
	plinCents: number;
	cardCents: number;
	bankTransferCents: number;
}

export interface CashSessionSummary {
	sessionId: string;
	status: CashSessionStatus;
	openingCashCents: number;
	completedSalesCount: number;
	totalSalesCents: number;
	paymentTotals: CashPaymentTotals;
	manualDepositsCents: number;
	manualWithdrawalsCents: number;
	expectedCashCents: number;
	countedCashCents: number | null;
	differenceCents: number | null;
	openedAt: number;
	closedAt: number | null;
	snapshotAvailable: boolean;
}

export type CashDifferenceStatus = "balanced" | "surplus" | "shortage";
