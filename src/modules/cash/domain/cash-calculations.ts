import { CashError } from "./cash-errors";
import type { CashDifferenceStatus } from "./cash-summary";

export interface CashCalculationInput {
	openingCashCents: number;
	cashSalesCents: number;
	manualDepositsCents: number;
	manualWithdrawalsCents: number;
}

function assertMoney(value: number, code: "INVALID_OPENING_CASH" | "INVALID_COUNTED_CASH"): void {
	if (!Number.isSafeInteger(value) || value < 0) throw new CashError(code);
}

export function calculateExpectedCash(input: CashCalculationInput): number {
	assertMoney(input.openingCashCents, "INVALID_OPENING_CASH");
	for (const value of [
		input.cashSalesCents,
		input.manualDepositsCents,
		input.manualWithdrawalsCents,
	]) {
		if (!Number.isSafeInteger(value) || value < 0) {
			throw new CashError("CASH_SUMMARY_INCONSISTENT");
		}
	}
	const expected =
		input.openingCashCents +
		input.cashSalesCents +
		input.manualDepositsCents -
		input.manualWithdrawalsCents;
	if (!Number.isSafeInteger(expected) || expected < 0) {
		throw new CashError("CASH_SUMMARY_INCONSISTENT");
	}
	return expected;
}

export function calculateCashDifference(
	expectedCashCents: number,
	countedCashCents: number,
): number {
	assertMoney(expectedCashCents, "INVALID_COUNTED_CASH");
	assertMoney(countedCashCents, "INVALID_COUNTED_CASH");
	const difference = countedCashCents - expectedCashCents;
	if (!Number.isSafeInteger(difference)) throw new CashError("INVALID_COUNTED_CASH");
	return difference;
}

export function getCashDifferenceStatus(differenceCents: number): CashDifferenceStatus {
	if (!Number.isSafeInteger(differenceCents)) throw new CashError("INVALID_COUNTED_CASH");
	if (differenceCents === 0) return "balanced";
	return differenceCents > 0 ? "surplus" : "shortage";
}
