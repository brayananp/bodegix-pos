/**
 * API pública del shared kernel de Bodegix POS.
 *
 * Importa utilidades del kernel desde "@/shared/kernel"
 *
 * REGLA: el kernel solo debe contener utilidades puras
 * que son usadas en múltiples módulos. No importa React,
 * Dexie, TanStack ni APIs del navegador (salvo network/).
 */

// Dinero
export {
	addMoney,
	assertValidMoney,
	formatMoney,
	isValidMoney,
	multiplyMoney,
	parseMoneyToCents,
} from "./money";
export type { MoneyCents } from "./money";

// Identificadores
export {
	createId,
	isValidId,
	restoreIdGenerator,
	setIdGenerator,
} from "./ids";

// Fechas
export {
	TIMEZONE,
	fromTimestamp,
	isValidTimestamp,
	nowTimestamp,
	timestampToDateString,
} from "./dates";

// Texto
export { capitalize, normalizeSearchText, truncate } from "./text";

// Result
export { err, isErr, isOk, ok, unwrap } from "./result";
export type { Result } from "./result";
