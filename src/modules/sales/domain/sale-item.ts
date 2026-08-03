export interface SaleItem {
	id: string;
	saleId: string;
	productId: string;
	/** Snapshot del nombre al momento de la venta. */
	productName: string;
	/** Snapshot del precio unitario al momento de la venta. */
	unitPriceCents: number;
	/** Snapshot del costo unitario al momento de la venta. */
	unitCostCents: number | null;
	quantity: number;
	subtotalCents: number;
}
