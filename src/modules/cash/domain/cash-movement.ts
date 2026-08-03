export type CashMovementType = "deposit" | "withdrawal";

export interface CashMovement {
	id: string;
	cashSessionId: string;
	type: CashMovementType;
	amountCents: number;
	reason: string;
	createdAt: number;
}
