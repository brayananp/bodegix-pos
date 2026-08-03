import type { PaymentMethod } from "./sale-payment";

/**
 * Intent de pago derivado del formulario de checkout.
 * El caso de uso resuelve status, providerLabel, changeCents, etc.
 */
export interface SalePaymentIntent {
	method: PaymentMethod;
	amountCents: number;
	cashReceivedCents: number | null;
	operationReference: string | null;
	manuallyVerified: boolean;
}
