/**
 * API pública del kernel de dinero.
 * Importa desde "@/shared/kernel/money"
 */

export {
	addMoney,
	assertValidMoney,
	formatMoney,
	isValidMoney,
	multiplyMoney,
	parseMoneyToCents,
} from "./money";
export type { MoneyCents } from "./money";
