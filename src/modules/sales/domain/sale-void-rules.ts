import { SaleError } from "./sale-errors";

export const VOID_REASON_MIN_LENGTH = 5;
export const VOID_REASON_MAX_LENGTH = 240;
export const REVERSAL_REFERENCE_MAX_LENGTH = 80;

export interface PaymentReversalCandidate {
	paymentId: string;
	confirmed: boolean;
	reversalReference: string | null;
}

export function normalizeVoidReason(reason: string): string {
	const normalized = reason.trim();
	if (normalized.length === 0)
		throw new SaleError("SALE_VOID_REASON_REQUIRED", { field: "reason" });
	if (normalized.length < VOID_REASON_MIN_LENGTH || normalized.length > VOID_REASON_MAX_LENGTH) {
		throw new SaleError("SALE_VOID_REASON_INVALID", { field: "reason" });
	}
	return normalized;
}

export function normalizeReversalReference(
	reference: string | null,
	paymentId: string,
): string | null {
	const normalized = reference?.trim() ?? "";
	if (normalized.length === 0) return null;
	if (
		normalized.length > REVERSAL_REFERENCE_MAX_LENGTH ||
		!/^[\p{L}\p{N}\s._#/-]+$/u.test(normalized)
	) {
		throw new SaleError("INVALID_REVERSAL_REFERENCE", { paymentId });
	}
	return normalized;
}

export function validatePaymentReversals(
	reversals: readonly PaymentReversalCandidate[],
	expectedPaymentIds: readonly string[],
): Map<string, string | null> {
	const expected = new Set(expectedPaymentIds);
	const received = new Set<string>();
	const references = new Map<string, string | null>();

	for (const reversal of reversals) {
		if (received.has(reversal.paymentId) || !expected.has(reversal.paymentId)) {
			throw new SaleError("PAYMENT_REVERSAL_MISMATCH", { paymentId: reversal.paymentId });
		}
		if (!reversal.confirmed) {
			throw new SaleError("PAYMENT_REVERSAL_CONFIRMATION_REQUIRED", {
				paymentId: reversal.paymentId,
			});
		}
		received.add(reversal.paymentId);
		references.set(
			reversal.paymentId,
			normalizeReversalReference(reversal.reversalReference, reversal.paymentId),
		);
	}

	if (received.size !== expected.size) throw new SaleError("PAYMENT_REVERSAL_MISMATCH");
	return references;
}

/** Alias mantenido para consumidores existentes. */
export function validateVoidReason(reason: string): void {
	normalizeVoidReason(reason);
}
