import type { PaymentMethod } from "../../../domain";

export interface CheckoutPaymentFormValue {
	/** Clave estable para React y TanStack Form. No se persiste. */
	key: string;
	method: PaymentMethod;
	/** Importe como string para edición libre en el campo. */
	amount: string;
	/** Efectivo recibido (solo para method === "cash"). */
	cashReceived: string;
	/** Referencia de operación opcional. */
	operationReference: string;
	/** Confirmación manual obligatoria para métodos externos. */
	manuallyVerified: boolean;
}

export interface SaleCheckoutFormValues {
	payments: CheckoutPaymentFormValue[];
}
