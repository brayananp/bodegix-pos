export type SaleErrorCode =
	| "SALE_DRAFT_EMPTY"
	| "SALE_DRAFT_NOT_FOUND"
	| "SALE_DRAFT_TOO_LARGE"
	| "PRODUCT_NOT_FOUND"
	| "PRODUCT_INACTIVE"
	| "PRODUCT_PRICE_CHANGED"
	| "INSUFFICIENT_STOCK"
	| "INVALID_ITEM_QUANTITY"
	| "CASH_SESSION_REQUIRED"
	| "CASH_SESSION_STATE_CHANGED"
	| "INVALID_PAYMENT"
	| "DUPLICATE_PAYMENT_METHOD"
	| "PAYMENT_TOTAL_MISMATCH"
	| "CASH_RECEIVED_INSUFFICIENT"
	| "MANUAL_VERIFICATION_REQUIRED"
	| "INVALID_OPERATION_REFERENCE"
	| "SALE_NUMBER_INVALID"
	| "SALE_NUMBER_CONFLICT"
	| "SALE_PERSISTENCE_FAILED";

const MESSAGES: Record<SaleErrorCode, string> = {
	SALE_DRAFT_EMPTY: "El carrito está vacío.",
	SALE_DRAFT_NOT_FOUND: "No se encontró el borrador del carrito.",
	SALE_DRAFT_TOO_LARGE:
		"El carrito excede el máximo de líneas permitidas. Elimina algunos productos.",
	PRODUCT_NOT_FOUND: "Un producto del carrito ya no existe.",
	PRODUCT_INACTIVE: "Un producto del carrito está inactivo.",
	PRODUCT_PRICE_CHANGED:
		"El precio de un producto cambió. Revisa el carrito y confirma los nuevos precios.",
	INSUFFICIENT_STOCK: "Stock insuficiente para completar la venta.",
	INVALID_ITEM_QUANTITY: "La cantidad de un ítem no es válida.",
	CASH_SESSION_REQUIRED: "Abre la caja antes de registrar una venta.",
	CASH_SESSION_STATE_CHANGED: "El estado de la caja cambió. Revisa e intenta nuevamente.",
	INVALID_PAYMENT: "Los datos del pago no son válidos.",
	DUPLICATE_PAYMENT_METHOD: "No puedes usar el mismo método de pago dos veces.",
	PAYMENT_TOTAL_MISMATCH: "La suma de los pagos no coincide con el total de la venta.",
	CASH_RECEIVED_INSUFFICIENT: "El efectivo recibido debe cubrir el importe en efectivo.",
	MANUAL_VERIFICATION_REQUIRED:
		"Confirma que verificaste el pago en la aplicación o terminal oficial.",
	INVALID_OPERATION_REFERENCE: "La referencia de operación no es válida.",
	SALE_NUMBER_INVALID: "El correlativo de venta no es válido.",
	SALE_NUMBER_CONFLICT: "El correlativo de venta ya fue utilizado.",
	SALE_PERSISTENCE_FAILED: "No se pudo guardar la venta.",
};

export class SaleError extends Error {
	readonly code: SaleErrorCode;
	readonly field?: string;
	readonly productId?: string;
	override readonly cause?: unknown;

	constructor(
		code: SaleErrorCode,
		options: { field?: string; productId?: string; cause?: unknown; message?: string } = {},
	) {
		super(options.message ?? MESSAGES[code]);
		this.name = "SaleError";
		this.code = code;
		if (options.field !== undefined) this.field = options.field;
		if (options.productId !== undefined) this.productId = options.productId;
		if (options.cause !== undefined) this.cause = options.cause;
	}
}

export function isSaleError(error: unknown): error is SaleError {
	return error instanceof SaleError;
}
