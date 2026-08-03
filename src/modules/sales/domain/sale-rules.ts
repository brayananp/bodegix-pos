import { SaleError } from "./sale-errors";
import type { PaymentMethod } from "./sale-payment";

export const MAX_PAYMENT_METHODS = 5;
export const MAX_OPERATION_REFERENCE_LENGTH = 80;

/**
 * Valida que los pagos sumen exactamente el total.
 * No modifica datos — solo lanza si hay inconsistencia.
 */
export function validatePaymentTotal(paymentAmountsCents: number[], totalCents: number): void {
	const sum = paymentAmountsCents.reduce((acc, a) => acc + a, 0);
	if (sum !== totalCents) {
		throw new SaleError("PAYMENT_TOTAL_MISMATCH");
	}
}

/**
 * Valida que no haya métodos duplicados.
 */
export function validateUniquePaymentMethods(methods: PaymentMethod[]): void {
	const seen = new Set<PaymentMethod>();
	for (const method of methods) {
		if (seen.has(method)) {
			throw new SaleError("DUPLICATE_PAYMENT_METHOD", { field: "method" });
		}
		seen.add(method);
	}
}

/**
 * Valida un importe individual de pago.
 */
export function validatePaymentAmount(amountCents: number, field = "amount"): void {
	if (!Number.isSafeInteger(amountCents) || amountCents <= 0) {
		throw new SaleError("INVALID_PAYMENT", { field });
	}
}

/**
 * Valida efectivo recibido para pago en cash.
 */
export function validateCashReceived(amountCents: number, cashReceivedCents: number): void {
	if (!Number.isSafeInteger(cashReceivedCents) || cashReceivedCents < amountCents) {
		throw new SaleError("CASH_RECEIVED_INSUFFICIENT", { field: "cashReceived" });
	}
}

/**
 * Valida la referencia de operación opcional.
 */
export function validateOperationReference(ref: string | null): string | null {
	if (ref === null || ref.trim() === "") return null;
	const cleaned = ref.trim().slice(0, MAX_OPERATION_REFERENCE_LENGTH);
	return cleaned;
}

/**
 * Valida que el número correlativo sea un entero positivo.
 */
export function validateSaleNumber(saleNumber: number): void {
	if (!Number.isSafeInteger(saleNumber) || saleNumber <= 0) {
		throw new SaleError("SALE_NUMBER_INVALID");
	}
}
