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
	| "SALE_PERSISTENCE_FAILED"
	| "SALE_NOT_FOUND"
	| "SALE_ALREADY_VOIDED"
	| "SALE_VOID_NOT_ALLOWED"
	| "SALE_CASH_SESSION_NOT_FOUND"
	| "SALE_CASH_SESSION_CLOSED"
	| "SALE_CASH_SESSION_CHANGED"
	| "SALE_VOID_REASON_REQUIRED"
	| "SALE_VOID_REASON_INVALID"
	| "PAYMENT_REVERSAL_CONFIRMATION_REQUIRED"
	| "PAYMENT_REVERSAL_MISMATCH"
	| "INVALID_REVERSAL_REFERENCE"
	| "SALE_ITEM_MISSING"
	| "SALE_PAYMENT_MISSING"
	| "SALE_PRODUCT_MISSING"
	| "SALE_VOID_PERSISTENCE_FAILED";

const MESSAGES: Record<SaleErrorCode, string> = {
	SALE_DRAFT_EMPTY: "El carrito está vacío.",
	SALE_DRAFT_NOT_FOUND: "No se encontró el borrador del carrito.",
	SALE_DRAFT_TOO_LARGE: "El carrito excede el máximo de líneas permitidas.",
	PRODUCT_NOT_FOUND: "Un producto del carrito ya no existe.",
	PRODUCT_INACTIVE: "Un producto del carrito está inactivo.",
	PRODUCT_PRICE_CHANGED: "El precio de un producto cambió. Revisa el carrito.",
	INSUFFICIENT_STOCK: "Stock insuficiente para completar la venta.",
	INVALID_ITEM_QUANTITY: "La cantidad de un ítem no es válida.",
	CASH_SESSION_REQUIRED: "Abre la caja antes de registrar una venta.",
	CASH_SESSION_STATE_CHANGED: "El estado de la caja cambió. Revisa e intenta nuevamente.",
	INVALID_PAYMENT: "Los datos del pago no son válidos.",
	DUPLICATE_PAYMENT_METHOD: "No puedes usar el mismo método de pago dos veces.",
	PAYMENT_TOTAL_MISMATCH: "La suma de los pagos no coincide con el total de la venta.",
	CASH_RECEIVED_INSUFFICIENT: "El efectivo recibido debe cubrir el importe en efectivo.",
	MANUAL_VERIFICATION_REQUIRED: "Confirma la verificación del pago externo.",
	INVALID_OPERATION_REFERENCE: "La referencia de operación no es válida.",
	SALE_NUMBER_INVALID: "El correlativo de venta no es válido.",
	SALE_NUMBER_CONFLICT: "El correlativo de venta ya fue utilizado.",
	SALE_PERSISTENCE_FAILED: "No se pudo guardar la venta.",
	SALE_NOT_FOUND: "No se encontró la venta.",
	SALE_ALREADY_VOIDED: "Esta venta ya fue anulada.",
	SALE_VOID_NOT_ALLOWED: "La venta no cumple las condiciones para anularse.",
	SALE_CASH_SESSION_NOT_FOUND: "La sesión original de la venta no existe.",
	SALE_CASH_SESSION_CLOSED: "La sesión original ya está cerrada.",
	SALE_CASH_SESSION_CHANGED: "La caja cambió; la venta ya no puede anularse.",
	SALE_VOID_REASON_REQUIRED: "Indica el motivo de la anulación.",
	SALE_VOID_REASON_INVALID: "El motivo debe tener entre 5 y 240 caracteres.",
	PAYMENT_REVERSAL_CONFIRMATION_REQUIRED: "Confirma la devolución de cada pago.",
	PAYMENT_REVERSAL_MISMATCH: "Las confirmaciones no coinciden con los pagos originales.",
	INVALID_REVERSAL_REFERENCE: "La referencia de devolución no es válida.",
	SALE_ITEM_MISSING: "La venta no contiene ítems; ejecuta el diagnóstico.",
	SALE_PAYMENT_MISSING: "La venta no contiene pagos; ejecuta el diagnóstico.",
	SALE_PRODUCT_MISSING: "Un producto histórico ya no existe; ejecuta el diagnóstico.",
	SALE_VOID_PERSISTENCE_FAILED: "No se pudo anular la venta.",
};

export class SaleError extends Error {
	readonly code: SaleErrorCode;
	readonly field?: string;
	readonly productId?: string;
	readonly paymentId?: string;
	override readonly cause?: unknown;

	constructor(
		code: SaleErrorCode,
		options: {
			field?: string;
			productId?: string;
			paymentId?: string;
			cause?: unknown;
			message?: string;
		} = {},
	) {
		super(options.message ?? MESSAGES[code]);
		this.name = "SaleError";
		this.code = code;
		if (options.field !== undefined) this.field = options.field;
		if (options.productId !== undefined) this.productId = options.productId;
		if (options.paymentId !== undefined) this.paymentId = options.paymentId;
		if (options.cause !== undefined) this.cause = options.cause;
	}
}

export function isSaleError(error: unknown): error is SaleError {
	return error instanceof SaleError;
}
