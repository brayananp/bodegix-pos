import { formatSaleNumber } from "../../domain";

export interface SaleResultItem {
	id: string;
	productId: string;
	productName: string;
	unitPriceCents: number;
	quantity: number;
	subtotalCents: number;
}

export interface SaleResultPayment {
	id: string;
	method: string;
	amountCents: number;
	changeCents: number | null;
	cashReceivedCents: number | null;
	providerLabel: string | null;
	operationReference: string | null;
}

export interface SaleResultView {
	saleId: string;
	formattedSaleNumber: string;
	items: SaleResultItem[];
	payments: SaleResultPayment[];
	subtotalCents: number;
	totalCents: number;
	changeCents: number;
	createdAt: number;
}

export interface SaleResultQueries {
	getSaleResult(saleId: string): Promise<SaleResultView | null>;
}

/** Calcula el vuelto total de una lista de pagos. */
export function calculateTotalChange(payments: Array<{ changeCents: number | null }>): number {
	return payments.reduce((acc, p) => acc + (p.changeCents ?? 0), 0);
}

/** Construye la vista de resultado desde datos planos. */
export function buildSaleResultView(params: {
	saleId: string;
	saleNumber: number;
	subtotalCents: number;
	totalCents: number;
	createdAt: number;
	items: SaleResultItem[];
	payments: SaleResultPayment[];
}): SaleResultView {
	return {
		saleId: params.saleId,
		formattedSaleNumber: formatSaleNumber(params.saleNumber),
		items: params.items,
		payments: params.payments,
		subtotalCents: params.subtotalCents,
		totalCents: params.totalCents,
		changeCents: calculateTotalChange(params.payments),
		createdAt: params.createdAt,
	};
}
