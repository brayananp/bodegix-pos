export type PaymentMethod = "cash" | "yape" | "plin" | "card" | "bank_transfer";
export type PaymentStatus = "confirmed" | "manually_verified" | "voided";

export interface SalePayment {
	id: string;
	saleId: string;
	method: PaymentMethod;
	amountCents: number;
	status: PaymentStatus;
	providerLabel: string | null;
	operationReference: string | null;
	cashReceivedCents: number | null;
	changeCents: number | null;
	verifiedAt: number;
	voidedAt: number | null;
	voidOperationReference: string | null;
	createdAt: number;
}

/** Etiqueta interna del proveedor por método. */
export function getProviderLabel(method: PaymentMethod): string | null {
	switch (method) {
		case "cash":
			return null;
		case "yape":
			return "Yape";
		case "plin":
			return "Plin";
		case "card":
			return "POS externo";
		case "bank_transfer":
			return "Transferencia bancaria";
	}
}

/** Los pagos externos se verifican manualmente. */
export function isExternalPayment(method: PaymentMethod): boolean {
	return method !== "cash";
}
