import { SaleError } from "./sale-errors";

/**
 * Longitud mínima para el motivo de anulación.
 */
export const VOID_REASON_MIN_LENGTH = 5;

/**
 * Longitud máxima para el motivo de anulación.
 */
export const VOID_REASON_MAX_LENGTH = 240;

/**
 * Valida que el motivo de anulación cumpla con las reglas de negocio.
 *
 * @throws {SaleError} INVALID_VOID_REASON si no cumple con la longitud requerida
 */
export function validateVoidReason(reason: string): void {
	const trimmed = reason.trim();
	if (trimmed.length < VOID_REASON_MIN_LENGTH || trimmed.length > VOID_REASON_MAX_LENGTH) {
		throw new SaleError("INVALID_VOID_REASON");
	}
}
