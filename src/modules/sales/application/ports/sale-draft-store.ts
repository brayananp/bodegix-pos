import type { SaleDraft } from "../../domain";

/**
 * Puerto orientado a operaciones del borrador del carrito.
 * Cada método carga, muta y persiste atómicamente el draft.
 */
export interface SaleDraftStore {
	/** Devuelve el borrador actual, o null si no existe. */
	get(): Promise<SaleDraft | null>;

	/**
	 * Agrega o incrementa un producto en el borrador.
	 * Crea el draft si no existe.
	 */
	addProduct(productId: string, priceCents: number, stock: number): Promise<SaleDraft>;

	/**
	 * Establece la cantidad exacta de un ítem.
	 * Si quantity <= 0 elimina el ítem.
	 */
	setQuantity(productId: string, quantity: number, stock: number): Promise<SaleDraft>;

	/** Elimina un producto del borrador. */
	removeProduct(productId: string): Promise<SaleDraft>;

	/** Limpia todos los ítems del borrador. */
	clear(): Promise<void>;

	/**
	 * Actualiza los precios esperados al precio actual.
	 * Devuelve el draft actualizado.
	 */
	refreshPrices(prices: Record<string, number>): Promise<SaleDraft>;
}
