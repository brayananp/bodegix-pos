export interface OpenCashFormValues {
	openingCash: string;
}

export interface CashMovementFormValues {
	amount: string;
	reason: string;
}

export interface CloseCashFormValues {
	countedCash: string;
}

export type CashMovementFormMode = "deposit" | "withdrawal";
