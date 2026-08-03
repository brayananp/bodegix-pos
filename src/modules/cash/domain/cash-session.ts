export type CashSessionStatus = "open" | "closed";

export interface CashSession {
	id: string;
	status: CashSessionStatus;
	openingCashCents: number;
	expectedCashCents: number | null;
	countedCashCents: number | null;
	differenceCents: number | null;
	openedAt: number;
	closedAt: number | null;
}
