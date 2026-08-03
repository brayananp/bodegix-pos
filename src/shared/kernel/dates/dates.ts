/**
 * Utilidades de fechas y timestamps para Bodegix POS.
 *
 * DECISIÓN: los timestamps se almacenan como milisegundos Unix (number).
 * Zona horaria comercial inicial: America/Lima (UTC-5, sin cambio horario).
 *
 * No se usa biblioteca de fechas externa en la Fase 0.
 * Los cálculos de jornada (inicio/fin de día) se implementarán en Fase 1+.
 */

/** Zona horaria comercial inicial de Bodegix POS */
export const TIMEZONE = "America/Lima" as const;

/**
 * Retorna el timestamp actual en milisegundos Unix.
 * Equivale a Date.now() pero encapsulado para facilitar mocking en pruebas.
 */
export function nowTimestamp(): number {
	return Date.now();
}

/**
 * Valida que un valor sea un timestamp Unix válido.
 * - Debe ser un número entero
 * - Debe ser ≥ 0
 * - No puede ser NaN ni Infinity
 * - Límite superior razonable: año 9999 (~253402300800000 ms)
 */
export function isValidTimestamp(value: number): boolean {
	return (
		typeof value === "number" &&
		Number.isFinite(value) &&
		Number.isInteger(value) &&
		value >= 0 &&
		value <= 253402300800000
	);
}

/**
 * Convierte un timestamp Unix en milisegundos a un objeto Date.
 */
export function fromTimestamp(ms: number): Date {
	if (!isValidTimestamp(ms)) {
		throw new Error(`Timestamp inválido: ${ms}`);
	}
	return new Date(ms);
}

/**
 * Formatea un timestamp como fecha legible en la zona horaria de Lima.
 * @example timestampToDateString(1700000000000) → "2023-11-14"
 */
export function timestampToDateString(ms: number): string {
	if (!isValidTimestamp(ms)) {
		throw new Error(`Timestamp inválido: ${ms}`);
	}

	return new Intl.DateTimeFormat("es-PE", {
		timeZone: TIMEZONE,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	})
		.format(new Date(ms))
		.split("/")
		.reverse()
		.join("-");
}
