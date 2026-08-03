import { CashError } from "./cash-errors";

export function validateOpeningCash(value: number): void {
	if (!Number.isSafeInteger(value) || value < 0) {
		throw new CashError("INVALID_OPENING_CASH", { field: "openingCash" });
	}
}

export function validateCountedCash(value: number): void {
	if (!Number.isSafeInteger(value) || value < 0) {
		throw new CashError("INVALID_COUNTED_CASH", { field: "countedCash" });
	}
}

export function validateMovementAmount(value: number): void {
	if (!Number.isSafeInteger(value) || value <= 0) {
		throw new CashError("INVALID_CASH_MOVEMENT_AMOUNT", { field: "amount" });
	}
}

export function normalizeMovementReason(value: string): string {
	const reason = value.trim();
	if (reason.length < 3 || reason.length > 160) {
		throw new CashError("INVALID_CASH_MOVEMENT_REASON", { field: "reason" });
	}
	return reason;
}
