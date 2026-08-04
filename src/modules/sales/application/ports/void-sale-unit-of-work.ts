/**
 * Input para anular una venta.
 */
export interface VoidSaleInput {
	/** ID de la venta a anular */
	readonly saleId: string;
	/** Motivo de la anulación (5-240 caracteres) */
	readonly reason: string;
}

/**
 * Resultado de la anulación de una venta.
 */
export interface VoidSaleResult {
	/** ID de la venta anulada */
	readonly saleId: string;
	/** Número de venta anulado */
	readonly saleNumber: number;
	/** Timestamp de la anulación */
	readonly voidedAt: number;
	/** ID de la sesión de caja */
	readonly cashSessionId: string;
	/** Total de la venta anulada en centavos */
	readonly totalCents: number;
	/** Cantidad de ítems devueltos al stock */
	readonly itemsRestored: number;
}

/**
 * Puerto para la unidad de trabajo transaccional de anulación de ventas.
 *
 * Implementa el patrón Unit of Work garantizando atomicidad ACID:
 * - Marca la venta como anulada (status = "voided", voidedAt, voidReason)
 * - Marca todos los pagos asociados como anulados (status = "voided", voidedAt)
 * - Devuelve el stock a los productos
 * - Registra movimientos compensatorios de inventario
 * - Todo en una transacción o nada
 */
export interface VoidSaleUnitOfWork {
	/**
	 * Ejecuta la anulación de una venta de forma transaccional.
	 *
	 * @throws {SaleError} SALE_NOT_FOUND si la venta no existe
	 * @throws {SaleError} SALE_ALREADY_VOIDED si la venta ya fue anulada
	 * @throws {SaleError} SALE_SESSION_CLOSED si la sesión de caja está cerrada
	 * @throws {SaleError} SALE_SESSION_MISMATCH si la venta no pertenece a la sesión actual
	 * @throws {SaleError} INVALID_VOID_REASON si el motivo no cumple validaciones
	 * @throws {SaleError} VOID_PERSISTENCE_FAILED si falla la transacción
	 */
	execute(input: VoidSaleInput): Promise<VoidSaleResult>;
}
