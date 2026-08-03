/** Línea de cálculo de totales. Función pura, sin React ni Dexie. */
export interface SaleDraftLine {
	productId: string;
	quantity: number;
	unitPriceCents: number;
}

export interface SaleDraftTotals {
	lineCount: number;
	itemCount: number;
	subtotalCents: number;
	totalCents: number;
}

/**
 * Calcula los totales del carrito desde líneas de borrador.
 * subtotalCents === totalCents (sin descuentos ni impuestos en Fase 5).
 */
export function calculateSaleDraftTotals(items: SaleDraftLine[]): SaleDraftTotals {
	let subtotalCents = 0;
	let itemCount = 0;

	for (const item of items) {
		if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
			throw new RangeError(`Cantidad inválida para producto ${item.productId}: ${item.quantity}`);
		}
		if (!Number.isInteger(item.unitPriceCents) || item.unitPriceCents <= 0) {
			throw new RangeError(
				`Precio inválido para producto ${item.productId}: ${item.unitPriceCents}`,
			);
		}

		const lineSubtotal = item.unitPriceCents * item.quantity;
		if (!Number.isSafeInteger(lineSubtotal)) {
			throw new RangeError(`Overflow en subtotal de línea para producto ${item.productId}`);
		}

		subtotalCents += lineSubtotal;
		if (!Number.isSafeInteger(subtotalCents)) {
			throw new RangeError("Overflow en subtotal total del carrito");
		}
		itemCount += item.quantity;
	}

	return {
		lineCount: items.length,
		itemCount,
		subtotalCents,
		totalCents: subtotalCents,
	};
}
