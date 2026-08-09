import type { SaleStatus } from "./sale";

export type SaleVoidIneligibilityReason =
	| "SALE_NOT_FOUND"
	| "SALE_ALREADY_VOIDED"
	| "CASH_SESSION_NOT_FOUND"
	| "CASH_SESSION_CLOSED"
	| "DIFFERENT_OPEN_SESSION"
	| "SALE_DATA_INCONSISTENT";

export interface SaleVoidEligibility {
	readonly eligible: boolean;
	readonly reason: SaleVoidIneligibilityReason | null;
}

export interface SaleVoidContext {
	saleStatus: SaleStatus;
	saleVoidedAt: number | null;
	saleVoidReason: string | null;
	saleCashSessionId: string;
	originalSessionExists: boolean;
	originalSessionStatus: "open" | "closed" | null;
	openSessionIds: readonly string[];
	hasItems: boolean;
	hasPayments: boolean;
}

export function checkSaleVoidEligibility(context: SaleVoidContext): SaleVoidEligibility {
	if (context.saleStatus === "voided") {
		return { eligible: false, reason: "SALE_ALREADY_VOIDED" };
	}
	if (
		context.saleVoidedAt !== null ||
		context.saleVoidReason !== null ||
		!context.hasItems ||
		!context.hasPayments
	) {
		return { eligible: false, reason: "SALE_DATA_INCONSISTENT" };
	}
	if (!context.originalSessionExists) {
		return { eligible: false, reason: "CASH_SESSION_NOT_FOUND" };
	}
	if (context.originalSessionStatus !== "open") {
		return { eligible: false, reason: "CASH_SESSION_CLOSED" };
	}
	if (
		context.openSessionIds.length !== 1 ||
		context.openSessionIds[0] !== context.saleCashSessionId
	) {
		return { eligible: false, reason: "DIFFERENT_OPEN_SESSION" };
	}
	return { eligible: true, reason: null };
}
