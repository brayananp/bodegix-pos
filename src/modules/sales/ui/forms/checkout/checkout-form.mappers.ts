import { createId } from "@/shared/kernel/ids";
import { moneyCentsToInput } from "@/shared/kernel/money";
import type { PaymentMethod, SalePaymentIntent } from "../../../domain";
import type { CheckoutPaymentFormValue, SaleCheckoutFormValues } from "./checkout-form.types";

/** Convierte string de dinero a céntimos de forma exacta. */
function parseToCents(value: string): number {
	const normalized = value.trim().replace(",", ".");
	const [wholePart = "0", decimalPart = ""] = normalized.split(".");
	return Number(wholePart) * 100 + Number(decimalPart.padEnd(2, "0").slice(0, 2));
}

const METHOD_LABELS: Record<PaymentMethod, string> = {
	cash: "Efectivo",
	yape: "Yape",
	plin: "Plin",
	card: "Tarjeta (POS externo)",
	bank_transfer: "Transferencia bancaria",
};

export function getMethodLabel(method: PaymentMethod): string {
	return METHOD_LABELS[method];
}

/** Valores por defecto del checkout para una venta nueva. */
export function createDefaultCheckoutValues(totalCents: number): SaleCheckoutFormValues {
	const totalStr = moneyCentsToInput(totalCents);
	return {
		payments: [
			{
				key: createId(),
				method: "cash",
				amount: totalStr,
				cashReceived: totalStr,
				operationReference: "",
				manuallyVerified: false,
			},
		],
	};
}

/** Convierte los valores del formulario a SalePaymentIntent[]. */
export function checkoutValuesToPaymentIntents(
	values: SaleCheckoutFormValues,
): SalePaymentIntent[] {
	return values.payments.map((p) => {
		const amountCents = parseToCents(p.amount);
		const cashReceivedCents = p.method === "cash" ? parseToCents(p.cashReceived || p.amount) : null;
		const cleanRef = p.operationReference.trim() || null;
		return {
			method: p.method,
			amountCents,
			cashReceivedCents,
			operationReference: cleanRef ? cleanRef.slice(0, 80) : null,
			manuallyVerified: p.manuallyVerified,
		};
	});
}

/** Calcula el importe restante sin asignar. */
export function calculateRemainingCents(
	totalCents: number,
	payments: CheckoutPaymentFormValue[],
): number {
	const assigned = payments.reduce((acc, p) => {
		const v = p.amount.trim().replace(",", ".");
		const match = /^\d+(\.\d{1,2})?$/.test(v);
		if (!match) return acc;
		return acc + parseToCents(p.amount);
	}, 0);
	return totalCents - assigned;
}

/** Calcula el vuelto para el pago en efectivo. */
export function calculateChangeCents(payment: CheckoutPaymentFormValue): number {
	if (payment.method !== "cash") return 0;
	const amount = parseToCents(payment.amount);
	const received = parseToCents(payment.cashReceived || payment.amount);
	return Math.max(0, received - amount);
}
