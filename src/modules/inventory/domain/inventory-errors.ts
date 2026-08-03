export type InventoryErrorCode =
	| "PRODUCT_NOT_FOUND"
	| "PRODUCT_INACTIVE_FOR_STOCK_ENTRY"
	| "INVALID_STOCK_QUANTITY"
	| "INITIAL_STOCK_ALREADY_REGISTERED"
	| "INITIAL_STOCK_REQUIRES_ZERO_STOCK"
	| "INSUFFICIENT_STOCK"
	| "NO_STOCK_CHANGE"
	| "INVALID_LOSS_REASON"
	| "INVALID_MOVEMENT_NOTE"
	| "INVENTORY_PERSISTENCE_FAILED";

const INVENTORY_ERROR_MESSAGES: Record<InventoryErrorCode, string> = {
	PRODUCT_NOT_FOUND: "El producto ya no existe.",
	PRODUCT_INACTIVE_FOR_STOCK_ENTRY: "Solo puedes ingresar stock a un producto activo.",
	INVALID_STOCK_QUANTITY: "Ingresa una cantidad entera válida.",
	INITIAL_STOCK_ALREADY_REGISTERED: "El stock inicial de este producto ya fue registrado.",
	INITIAL_STOCK_REQUIRES_ZERO_STOCK: "El stock inicial requiere un saldo actual de cero.",
	INSUFFICIENT_STOCK: "La cantidad supera el stock disponible.",
	NO_STOCK_CHANGE: "La cantidad contada coincide con el stock registrado.",
	INVALID_LOSS_REASON: "Indica el motivo de la pérdida.",
	INVALID_MOVEMENT_NOTE: "Revisa la referencia o nota ingresada.",
	INVENTORY_PERSISTENCE_FAILED: "No se pudo guardar el movimiento de inventario.",
};

export class InventoryError extends Error {
	readonly code: InventoryErrorCode;
	readonly field?: string;
	override readonly cause?: unknown;

	constructor(
		code: InventoryErrorCode,
		options: { field?: string; cause?: unknown; message?: string } = {},
	) {
		super(options.message ?? INVENTORY_ERROR_MESSAGES[code]);
		this.name = "InventoryError";
		this.code = code;
		if (options.field !== undefined) this.field = options.field;
		if (options.cause !== undefined) this.cause = options.cause;
	}
}

export function isInventoryError(error: unknown): error is InventoryError {
	return error instanceof InventoryError;
}
