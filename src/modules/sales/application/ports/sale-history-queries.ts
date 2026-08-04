import type { PaymentMethod, SaleStatus } from "@/shared/infrastructure/local-db/records";

/**
 * Filtros para búsqueda de ventas.
 */
export interface SaleSearchFilters {
	/** Búsqueda por número de venta, nombre de producto o referencia de pago */
	readonly searchText?: string;
	/** Filtrar por estado de venta */
	readonly status?: SaleStatus;
	/** Filtrar por método de pago utilizado */
	readonly paymentMethod?: PaymentMethod;
	/** Filtrar por sesión de caja específica */
	readonly cashSessionId?: string;
	/** Fecha de inicio (timestamp) */
	readonly fromDate?: number;
	/** Fecha de fin (timestamp) */
	readonly toDate?: number;
}

/**
 * Opciones de paginación.
 */
export interface PaginationOptions {
	/** Número de página (inicia en 1) */
	readonly page: number;
	/** Cantidad de items por página */
	readonly pageSize: number;
}

/**
 * Resultado paginado.
 */
export interface PaginatedResult<T> {
	/** Items de la página actual */
	readonly items: T[];
	/** Total de items que coinciden con los filtros */
	readonly totalCount: number;
	/** Número de página actual */
	readonly page: number;
	/** Tamaño de página */
	readonly pageSize: number;
	/** Total de páginas */
	readonly totalPages: number;
	/** Si hay página anterior */
	readonly hasPreviousPage: boolean;
	/** Si hay página siguiente */
	readonly hasNextPage: boolean;
}

/**
 * Resumen de una venta en el historial.
 */
export interface SaleHistorySummary {
	/** ID de la venta */
	readonly id: string;
	/** Número de venta */
	readonly saleNumber: number;
	/** Estado de la venta */
	readonly status: SaleStatus;
	/** Total de la venta en centavos */
	readonly totalCents: number;
	/** Métodos de pago utilizados */
	readonly paymentMethods: PaymentMethod[];
	/** Fecha de creación (timestamp) */
	readonly createdAt: number;
	/** Fecha de anulación (timestamp, si aplica) */
	readonly voidedAt: number | null;
	/** ID de la sesión de caja */
	readonly cashSessionId: string;
	/** Cantidad de items en la venta */
	readonly itemCount: number;
}

/**
 * Detalle completo de una venta.
 */
export interface SaleDetail {
	/** ID de la venta */
	readonly id: string;
	/** Número de venta */
	readonly saleNumber: number;
	/** Estado de la venta */
	readonly status: SaleStatus;
	/** Subtotal en centavos */
	readonly subtotalCents: number;
	/** Total en centavos */
	readonly totalCents: number;
	/** Fecha de creación (timestamp) */
	readonly createdAt: number;
	/** Fecha de anulación (timestamp, si aplica) */
	readonly voidedAt: number | null;
	/** Motivo de anulación (si aplica) */
	readonly voidReason: string | null;
	/** ID de la sesión de caja */
	readonly cashSessionId: string;
	/** Items de la venta */
	readonly items: SaleDetailItem[];
	/** Pagos de la venta */
	readonly payments: SaleDetailPayment[];
}

/**
 * Item dentro del detalle de venta.
 */
export interface SaleDetailItem {
	/** ID del item */
	readonly id: string;
	/** ID del producto */
	readonly productId: string;
	/** Nombre del producto */
	readonly productName: string;
	/** Precio unitario en centavos */
	readonly unitPriceCents: number;
	/** Cantidad */
	readonly quantity: number;
	/** Subtotal en centavos */
	readonly subtotalCents: number;
}

/**
 * Pago dentro del detalle de venta.
 */
export interface SaleDetailPayment {
	/** ID del pago */
	readonly id: string;
	/** Método de pago */
	readonly method: PaymentMethod;
	/** Monto en centavos */
	readonly amountCents: number;
	/** Estado del pago */
	readonly status: "confirmed" | "manually_verified" | "voided";
	/** Etiqueta del proveedor (Yape, Plin, etc.) */
	readonly providerLabel: string | null;
	/** Referencia de operación */
	readonly operationReference: string | null;
	/** Efectivo recibido (solo para cash) */
	readonly cashReceivedCents: number | null;
	/** Vuelto (solo para cash) */
	readonly changeCents: number | null;
	/** Fecha de anulación del pago (timestamp, si aplica) */
	readonly voidedAt: number | null;
	/** Referencia de operación de devolución (si aplica) */
	readonly voidOperationReference: string | null;
}

/**
 * Puerto para consultas de historial de ventas.
 */
export interface SaleHistoryQueries {
	/**
	 * Busca ventas con filtros y paginación.
	 *
	 * @param filters - Filtros opcionales de búsqueda
	 * @param pagination - Opciones de paginación
	 * @returns Resultado paginado con resúmenes de ventas
	 */
	searchSales(
		filters: SaleSearchFilters,
		pagination: PaginationOptions,
	): Promise<PaginatedResult<SaleHistorySummary>>;

	/**
	 * Obtiene el detalle completo de una venta.
	 *
	 * @param saleId - ID de la venta
	 * @returns Detalle de la venta o null si no existe
	 */
	getSaleDetail(saleId: string): Promise<SaleDetail | null>;
}
