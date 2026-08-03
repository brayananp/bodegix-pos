import type { StockLossType } from "../../domain";

export interface InitialStockFormValues {
	quantity: string;
	note: string;
}

export interface StockEntryFormValues {
	quantity: string;
	reference: string;
	note: string;
}

export interface StockReconciliationFormValues {
	countedQuantity: string;
	reason: string;
}

export interface StockLossFormValues {
	quantity: string;
	lossType: StockLossType;
	reason: string;
}
