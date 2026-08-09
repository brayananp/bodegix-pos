import type { PaymentMethod } from "../../domain";

export interface SalePaymentReversalConfirmation {
	readonly paymentId: string;
	readonly confirmed: boolean;
	readonly reversalReference: string | null;
}

export interface VoidSaleInput {
	readonly saleId: string;
	readonly reason: string;
	readonly paymentReversals: SalePaymentReversalConfirmation[];
}

export interface VoidSaleResult {
	readonly saleId: string;
	readonly saleNumber: number;
	readonly totalCents: number;
	readonly restoredItemCount: number;
	readonly restoredUnitCount: number;
	readonly paymentReversals: Array<{
		method: PaymentMethod;
		amountCents: number;
		reversalReference: string | null;
	}>;
	readonly cashSessionId: string;
	readonly voidedAt: number;
	readonly reason: string;
}

export interface VoidSaleUnitOfWork {
	execute(input: VoidSaleInput): Promise<VoidSaleResult>;
}
