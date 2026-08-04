import { validateVoidReason } from "../../domain";
import type { VoidSaleInput, VoidSaleResult, VoidSaleUnitOfWork } from "../ports";

/**
 * Comando: Anular una venta.
 *
 * Ejecuta la anulación de una venta de forma transaccional, validando
 * las reglas de negocio y delegando la persistencia al Unit of Work.
 *
 * @param unitOfWork - Implementación del Unit of Work para anulación
 * @param input - Datos de la venta a anular
 * @returns Resultado de la anulación
 *
 * @throws {SaleError} Diversos códigos según validaciones y estado de datos
 */
export async function voidSale(
	unitOfWork: VoidSaleUnitOfWork,
	input: VoidSaleInput,
): Promise<VoidSaleResult> {
	// Validar motivo de anulación
	validateVoidReason(input.reason);

	// Delegar al Unit of Work (incluye todas las validaciones de estado y transacción)
	return unitOfWork.execute(input);
}
