/** Una línea del borrador del carrito. */
export interface SaleDraftItem {
	productId: string;
	quantity: number;
	/** Precio esperado al momento de agregar/actualizar el ítem. */
	expectedUnitPriceCents: number;
}

/** Singleton del borrador persistido. id siempre es "main". */
export interface SaleDraft {
	id: "main";
	items: SaleDraftItem[];
	updatedAt: number;
}

export const SALE_DRAFT_MAX_LINES = 100;
export const SALE_DRAFT_MAX_QUANTITY_PER_LINE = 9999;
