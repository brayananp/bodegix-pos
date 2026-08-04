import type { SaleStatus } from "@/shared/infrastructure/local-db/records";

/**
 * Resultado de la verificación de elegibilidad para anular una venta.
 */
export interface SaleVoidEligibility {
	/** Si la venta puede ser anulada */
	readonly canVoid: boolean;
	/** Código de la razón por la que no puede ser anulada */
	readonly reason?: "ALREADY_VOIDED" | "SESSION_CLOSED" | "SESSION_MISMATCH";
	/** Si la venta pertenece a la sesión de caja actual */
	readonly isSameSession: boolean;
	/** Si la sesión de caja está abierta */
	readonly isSessionOpen: boolean;
}

/**
 * Información necesaria para determinar elegibilidad de anulación.
 */
export interface SaleVoidContext {
	/** Estado actual de la venta */
	saleStatus: SaleStatus;
	/** ID de sesión de caja de la venta */
	saleCashSessionId: string;
	/** ID de la sesión de caja actual (abierta) */
	currentCashSessionId: string | null;
	/** Si la sesión de caja actual está abierta */
	isCurrentSessionOpen: boolean;
}

/**
 * Determina si una venta puede ser anulada según las reglas de negocio.
 *
 * Reglas:
 * - La venta NO debe estar ya anulada
 * - La venta DEBE pertenecer a la sesión de caja actualmente abierta
 * - La sesión de caja DEBE estar abierta
 *
 * @param context - Información de la venta y sesión actual
 * @returns Resultado de elegibilidad con detalles
 */
export function checkSaleVoidEligibility(context: SaleVoidContext): SaleVoidEligibility {
	const { saleStatus, saleCashSessionId, currentCashSessionId, isCurrentSessionOpen } = context;

	// Venta ya anulada
	if (saleStatus === "voided") {
		return {
			canVoid: false,
			reason: "ALREADY_VOIDED",
			isSameSession: saleCashSessionId === currentCashSessionId,
			isSessionOpen: isCurrentSessionOpen,
		};
	}

	// Sesión cerrada
	if (!isCurrentSessionOpen || currentCashSessionId === null) {
		return {
			canVoid: false,
			reason: "SESSION_CLOSED",
			isSameSession: false,
			isSessionOpen: false,
		};
	}

	// Venta de otra sesión
	if (saleCashSessionId !== currentCashSessionId) {
		return {
			canVoid: false,
			reason: "SESSION_MISMATCH",
			isSameSession: false,
			isSessionOpen: isCurrentSessionOpen,
		};
	}

	// Elegible para anulación
	return {
		canVoid: true,
		isSameSession: true,
		isSessionOpen: true,
	};
}
