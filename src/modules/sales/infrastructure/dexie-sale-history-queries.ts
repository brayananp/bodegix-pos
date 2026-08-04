import type { BodegixDatabase } from "@/shared/infrastructure/local-db";
import type {
	PaginatedResult,
	PaginationOptions,
	SaleDetail,
	SaleHistoryQueries,
	SaleHistorySummary,
	SaleSearchFilters,
} from "../application";

/**
 * Implementación Dexie de las queries de historial de ventas.
 */
export class DexieSaleHistoryQueries implements SaleHistoryQueries {
	constructor(private readonly database: BodegixDatabase) {}

	async searchSales(
		filters: SaleSearchFilters,
		pagination: PaginationOptions,
	): Promise<PaginatedResult<SaleHistorySummary>> {
		const { page, pageSize } = pagination;
		const offset = (page - 1) * pageSize;

		// Construir query base
		let query = this.database.sales.orderBy("saleNumber").reverse();

		// Aplicar filtros
		if (filters.cashSessionId) {
			query = this.database.sales.where("cashSessionId").equals(filters.cashSessionId).reverse();
		}

		// Obtener todas las ventas que pasan los filtros indexados
		let allSales = await query.toArray();

		// Aplicar filtros no indexados
		if (filters.status) {
			allSales = allSales.filter((s) => s.status === filters.status);
		}

		if (filters.fromDate !== undefined) {
			allSales = allSales.filter((s) => s.createdAt >= filters.fromDate!);
		}

		if (filters.toDate !== undefined) {
			allSales = allSales.filter((s) => s.createdAt <= filters.toDate!);
		}

		// Filtro por texto (número de venta, producto o referencia de pago)
		if (filters.searchText && filters.searchText.trim().length > 0) {
			const searchLower = filters.searchText.trim().toLowerCase();
			const saleIds = new Set<string>();

			// Búsqueda por número de venta
			const numberMatch = Number.parseInt(searchLower, 10);
			if (!Number.isNaN(numberMatch)) {
				allSales.forEach((s) => {
					if (s.saleNumber.toString().includes(searchLower)) {
						saleIds.add(s.id);
					}
				});
			}

			// Búsqueda por nombre de producto en items
			const items = await this.database.saleItems.toArray();
			items.forEach((item) => {
				if (item.productName.toLowerCase().includes(searchLower)) {
					saleIds.add(item.saleId);
				}
			});

			// Búsqueda por referencia de pago
			const payments = await this.database.salePayments.toArray();
			payments.forEach((payment) => {
				if (payment.operationReference?.toLowerCase().includes(searchLower)) {
					saleIds.add(payment.saleId);
				}
			});

			allSales = allSales.filter((s) => saleIds.has(s.id));
		}

		// Filtro por método de pago
		if (filters.paymentMethod) {
			const paymentsBySale = await this.database.salePayments
				.where("method")
				.equals(filters.paymentMethod)
				.toArray();
			const saleIdsWithMethod = new Set(paymentsBySale.map((p) => p.saleId));
			allSales = allSales.filter((s) => saleIdsWithMethod.has(s.id));
		}

		const totalCount = allSales.length;
		const totalPages = Math.ceil(totalCount / pageSize);

		// Paginar
		const paginatedSales = allSales.slice(offset, offset + pageSize);

		// Construir resúmenes
		const summaries: SaleHistorySummary[] = [];
		for (const sale of paginatedSales) {
			// Obtener métodos de pago
			const payments = await this.database.salePayments.where("saleId").equals(sale.id).toArray();
			const paymentMethods = [...new Set(payments.map((p) => p.method))];

			// Contar items
			const items = await this.database.saleItems.where("saleId").equals(sale.id).toArray();
			const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

			summaries.push({
				id: sale.id,
				saleNumber: sale.saleNumber,
				status: sale.status,
				totalCents: sale.totalCents,
				paymentMethods,
				createdAt: sale.createdAt,
				voidedAt: sale.voidedAt,
				cashSessionId: sale.cashSessionId,
				itemCount,
			});
		}

		return {
			items: summaries,
			totalCount,
			page,
			pageSize,
			totalPages,
			hasPreviousPage: page > 1,
			hasNextPage: page < totalPages,
		};
	}

	async getSaleDetail(saleId: string): Promise<SaleDetail | null> {
		const sale = await this.database.sales.get(saleId);
		if (!sale) {
			return null;
		}

		// Cargar items
		const itemRecords = await this.database.saleItems.where("saleId").equals(saleId).toArray();
		const items = itemRecords.map((item) => ({
			id: item.id,
			productId: item.productId,
			productName: item.productName,
			unitPriceCents: item.unitPriceCents,
			quantity: item.quantity,
			subtotalCents: item.subtotalCents,
		}));

		// Cargar pagos
		const paymentRecords = await this.database.salePayments
			.where("saleId")
			.equals(saleId)
			.toArray();
		const payments = paymentRecords.map((payment) => ({
			id: payment.id,
			method: payment.method,
			amountCents: payment.amountCents,
			status: payment.status,
			providerLabel: payment.providerLabel,
			operationReference: payment.operationReference,
			cashReceivedCents: payment.cashReceivedCents,
			changeCents: payment.changeCents,
			voidedAt: payment.voidedAt,
			voidOperationReference: payment.voidOperationReference,
		}));

		return {
			id: sale.id,
			saleNumber: sale.saleNumber,
			status: sale.status,
			subtotalCents: sale.subtotalCents,
			totalCents: sale.totalCents,
			createdAt: sale.createdAt,
			voidedAt: sale.voidedAt,
			voidReason: sale.voidReason,
			cashSessionId: sale.cashSessionId,
			items,
			payments,
		};
	}
}
