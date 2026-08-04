import type { BodegixDatabase } from "@/shared/infrastructure/local-db";
import { type SaleVoidEligibility, checkSaleVoidEligibility } from "../../domain";

/**
 * Query: Obtener elegibilidad de anulación de una venta.
 *
 * Verifica si una venta puede ser anulada según las reglas de negocio:
 * - No debe estar ya anulada
 * - Debe pertenecer a la sesión de caja actual
 * - La sesión de caja debe estar abierta
 *
 * @param database - Base de datos
 * @param saleId - ID de la venta
 * @returns Información de elegibilidad o null si la venta no existe
 */
export async function getSaleVoidEligibility(
	database: BodegixDatabase,
	saleId: string,
): Promise<SaleVoidEligibility | null> {
	// Buscar venta
	const sale = await database.sales.get(saleId);
	if (!sale) {
		return null;
	}

	// Buscar sesión de caja abierta
	const currentSession = await database.cashSessions.where("status").equals("open").first();

	// Verificar elegibilidad
	return checkSaleVoidEligibility({
		saleStatus: sale.status,
		saleCashSessionId: sale.cashSessionId,
		currentCashSessionId: currentSession?.id ?? null,
		isCurrentSessionOpen: currentSession?.status === "open",
	});
}
