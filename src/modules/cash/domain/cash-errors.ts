export type CashErrorCode =
	| "CASH_SESSION_ALREADY_OPEN"
	| "CASH_SESSION_NOT_FOUND"
	| "CASH_SESSION_NOT_OPEN"
	| "CASH_SESSION_ALREADY_CLOSED"
	| "INVALID_OPENING_CASH"
	| "INVALID_CASH_MOVEMENT_AMOUNT"
	| "INVALID_CASH_MOVEMENT_REASON"
	| "INSUFFICIENT_EXPECTED_CASH"
	| "INVALID_COUNTED_CASH"
	| "CASH_SESSION_STATE_CHANGED"
	| "CASH_SUMMARY_INCONSISTENT"
	| "CASH_PERSISTENCE_FAILED";

const MESSAGES: Record<CashErrorCode, string> = {
	CASH_SESSION_ALREADY_OPEN: "Ya existe una caja abierta.",
	CASH_SESSION_NOT_FOUND: "La sesión de caja ya no existe.",
	CASH_SESSION_NOT_OPEN: "La sesión de caja ya no está abierta.",
	CASH_SESSION_ALREADY_CLOSED: "La sesión de caja ya fue cerrada.",
	INVALID_OPENING_CASH: "Ingresa un efectivo inicial válido.",
	INVALID_CASH_MOVEMENT_AMOUNT: "Ingresa un importe mayor que cero.",
	INVALID_CASH_MOVEMENT_REASON: "Escribe un motivo de 3 a 160 caracteres.",
	INSUFFICIENT_EXPECTED_CASH: "El retiro supera el efectivo esperado disponible.",
	INVALID_COUNTED_CASH: "Ingresa un efectivo contado válido.",
	CASH_SESSION_STATE_CHANGED: "El estado de la caja cambió. Revisa los datos e inténtalo otra vez.",
	CASH_SUMMARY_INCONSISTENT: "El resumen de caja no es consistente.",
	CASH_PERSISTENCE_FAILED: "No se pudo guardar la operación de caja.",
};

export class CashError extends Error {
	readonly code: CashErrorCode;
	readonly field?: string;
	override readonly cause?: unknown;

	constructor(
		code: CashErrorCode,
		options: { field?: string; cause?: unknown; message?: string } = {},
	) {
		super(options.message ?? MESSAGES[code]);
		this.name = "CashError";
		this.code = code;
		if (options.field !== undefined) this.field = options.field;
		if (options.cause !== undefined) this.cause = options.cause;
	}
}

export function isCashError(error: unknown): error is CashError {
	return error instanceof CashError;
}
