export type SaleStatus = "completed" | "voided";

export interface Sale {
	id: string;
	saleNumber: number;
	cashSessionId: string;
	subtotalCents: number;
	totalCents: number;
	status: SaleStatus;
	createdAt: number;
	voidedAt: number | null;
	voidReason: string | null;
}

/** Formatea el número correlativo para mostrar en UI. */
export function formatSaleNumber(saleNumber: number): string {
	return `V-${String(saleNumber).padStart(6, "0")}`;
}
