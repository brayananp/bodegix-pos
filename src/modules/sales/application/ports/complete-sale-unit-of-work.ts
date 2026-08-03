import type { SalePaymentIntent } from "../../domain";

export interface CompleteSaleInput {
	paymentIntents: SalePaymentIntent[];
}

export interface CompletedSalePaymentResult {
	method: string;
	amountCents: number;
	changeCents: number | null;
	providerLabel: string | null;
}

export interface CompletedSaleResult {
	saleId: string;
	saleNumber: number;
	subtotalCents: number;
	totalCents: number;
	itemCount: number;
	lineCount: number;
	payments: CompletedSalePaymentResult[];
	changeCents: number;
	cashSessionId: string;
	createdAt: number;
}

/**
 * Unidad de trabajo para completar una venta de forma atómica.
 * Carga el borrador internamente — la UI no lo pasa como parámetro.
 */
export interface CompleteSaleUnitOfWork {
	execute(input: CompleteSaleInput): Promise<CompletedSaleResult>;
}
