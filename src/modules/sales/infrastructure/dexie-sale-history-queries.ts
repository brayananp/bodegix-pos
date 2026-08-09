import type {
	BodegixDatabase,
	SaleItemRecord,
	SalePaymentRecord,
	SaleRecord,
} from "@/shared/infrastructure/local-db";
import Dexie from "dexie";
import type {
	PaginatedResult,
	PaginationOptions,
	SaleDetail,
	SaleHistoryQueries,
	SaleHistorySummary,
	SaleSearchFilters,
} from "../application";
import { checkSaleVoidEligibility, formatSaleNumber } from "../domain";

function groupBySaleId<T extends { saleId: string }>(records: readonly T[]): Map<string, T[]> {
	const result = new Map<string, T[]>();
	for (const record of records)
		result.set(record.saleId, [...(result.get(record.saleId) ?? []), record]);
	return result;
}

function parseSaleNumber(searchText: string | undefined): number | null {
	const normalized = searchText?.trim().toUpperCase() ?? "";
	const match = /^(?:V-)?0*(\d+)$/.exec(normalized);
	if (!match?.[1]) return null;
	const value = Number(match[1]);
	return Number.isSafeInteger(value) && value > 0 ? value : null;
}

export class DexieSaleHistoryQueries implements SaleHistoryQueries {
	constructor(private readonly database: BodegixDatabase) {}

	countSales(): Promise<number> {
		return this.database.sales.count();
	}

	async searchSales(
		filters: SaleSearchFilters,
		pagination: PaginationOptions,
	): Promise<PaginatedResult<SaleHistorySummary>> {
		const paymentSaleIds = filters.paymentMethod
			? new Set(
					(
						await this.database.salePayments.where("method").equals(filters.paymentMethod).toArray()
					).map(({ saleId }) => saleId),
				)
			: null;
		const searchedSaleNumber = parseSaleNumber(filters.searchText);
		const hasUnmatchedText = Boolean(filters.searchText?.trim()) && searchedSaleNumber === null;

		let collection = this.baseCollection(filters);
		collection = collection.filter((sale) => {
			if (filters.status && sale.status !== filters.status) return false;
			if (filters.fromDate !== undefined && sale.createdAt < filters.fromDate) return false;
			if (filters.toDate !== undefined && sale.createdAt > filters.toDate) return false;
			if (paymentSaleIds && !paymentSaleIds.has(sale.id)) return false;
			if (searchedSaleNumber !== null && sale.saleNumber !== searchedSaleNumber) return false;
			if (hasUnmatchedText) return false;
			return true;
		});

		const totalCount = await collection.count();
		const page = this.validPage(pagination.page, totalCount, pagination.pageSize);
		const records = await collection
			.offset((page - 1) * pagination.pageSize)
			.limit(pagination.pageSize)
			.toArray();

		const saleIds = records.map(({ id }) => id);
		const [items, payments] = saleIds.length
			? await Promise.all([
					this.database.saleItems.where("saleId").anyOf(saleIds).toArray(),
					this.database.salePayments.where("saleId").anyOf(saleIds).toArray(),
				])
			: [[], []];
		const itemsBySale = groupBySaleId(items);
		const paymentsBySale = groupBySaleId(payments);
		const totalPages = Math.max(1, Math.ceil(totalCount / pagination.pageSize));

		return {
			items: records.map((sale) => this.toSummary(sale, itemsBySale, paymentsBySale)),
			totalCount,
			page,
			pageSize: pagination.pageSize,
			totalPages,
			hasPreviousPage: page > 1,
			hasNextPage: page < totalPages,
		};
	}

	async getSaleDetail(saleId: string): Promise<SaleDetail | null> {
		const sale = await this.database.sales.get(saleId);
		if (!sale) return null;
		const [itemRecords, paymentRecords, movementRecords, session, eligibility] = await Promise.all([
			this.database.saleItems.where("saleId").equals(saleId).toArray(),
			this.database.salePayments.where("saleId").equals(saleId).toArray(),
			this.database.inventoryMovements
				.where("[referenceType+referenceId]")
				.equals(["sale", saleId])
				.toArray(),
			this.database.cashSessions.get(sale.cashSessionId),
			this.getSaleVoidEligibility(saleId),
		]);
		const productIds = [...new Set(itemRecords.map(({ productId }) => productId))];
		const currentProducts = await this.database.products.bulkGet(productIds);
		const availableProductIds = new Set(
			currentProducts.filter((product) => product !== undefined).map(({ id }) => id),
		);
		const productNames = new Map(itemRecords.map((item) => [item.productId, item.productName]));

		return {
			id: sale.id,
			saleNumber: sale.saleNumber,
			formattedSaleNumber: formatSaleNumber(sale.saleNumber),
			status: sale.status,
			subtotalCents: sale.subtotalCents,
			totalCents: sale.totalCents,
			createdAt: sale.createdAt,
			voidedAt: sale.voidedAt,
			voidReason: sale.voidReason,
			cashSessionId: sale.cashSessionId,
			cashSessionStatus: session?.status ?? "missing",
			items: itemRecords.map((item) => ({
				id: item.id,
				productId: item.productId,
				productName: item.productName,
				unitPriceCents: item.unitPriceCents,
				unitCostCents: item.unitCostCents,
				quantity: item.quantity,
				subtotalCents: item.subtotalCents,
				productAvailable: availableProductIds.has(item.productId),
			})),
			payments: paymentRecords.map((payment) => ({ ...payment })),
			inventoryMovements: movementRecords
				.filter((movement) => movement.type === "sale" || movement.type === "sale_void")
				.map((movement) => ({
					id: movement.id,
					productId: movement.productId,
					productName: productNames.get(movement.productId) ?? "Producto histórico",
					type: movement.type as "sale" | "sale_void",
					quantityDelta: movement.quantityDelta,
					stockBefore: movement.stockBefore,
					stockAfter: movement.stockAfter,
					createdAt: movement.createdAt,
				})),
			voidEligibility: eligibility,
		};
	}

	async getSaleVoidEligibility(saleId: string) {
		const sale = await this.database.sales.get(saleId);
		if (!sale) return { eligible: false as const, reason: "SALE_NOT_FOUND" as const };
		const [session, openSessions, itemCount, paymentCount] = await Promise.all([
			this.database.cashSessions.get(sale.cashSessionId),
			this.database.cashSessions.where("status").equals("open").toArray(),
			this.database.saleItems.where("saleId").equals(sale.id).count(),
			this.database.salePayments.where("saleId").equals(sale.id).count(),
		]);
		return checkSaleVoidEligibility({
			saleStatus: sale.status,
			saleVoidedAt: sale.voidedAt,
			saleVoidReason: sale.voidReason,
			saleCashSessionId: sale.cashSessionId,
			originalSessionExists: session !== undefined,
			originalSessionStatus: session?.status ?? null,
			openSessionIds: openSessions.map(({ id }) => id),
			hasItems: itemCount > 0,
			hasPayments: paymentCount > 0,
		});
	}

	async getSaleVoidResult(saleId: string) {
		const detail = await this.getSaleDetail(saleId);
		if (!detail || detail.status !== "voided" || detail.voidedAt === null || !detail.voidReason) {
			return null;
		}
		const reversals = detail.payments.map((payment) => ({
			method: payment.method,
			amountCents: payment.amountCents,
			reversalReference: payment.voidOperationReference,
		}));
		return {
			saleId: detail.id,
			saleNumber: detail.saleNumber,
			totalCents: detail.totalCents,
			restoredItemCount: detail.items.length,
			restoredUnitCount: detail.inventoryMovements
				.filter(({ type }) => type === "sale_void")
				.reduce((sum, movement) => sum + movement.quantityDelta, 0),
			paymentReversals: reversals,
			cashSessionId: detail.cashSessionId,
			voidedAt: detail.voidedAt,
			reason: detail.voidReason,
		};
	}

	private baseCollection(filters: SaleSearchFilters) {
		if (filters.sort === "total-desc" || filters.sort === "total-asc") {
			const collection = this.database.sales.orderBy("totalCents");
			return filters.sort === "total-desc" ? collection.reverse() : collection;
		}
		if (filters.cashSessionId) {
			const collection = this.database.sales
				.where("[cashSessionId+createdAt]")
				.between([filters.cashSessionId, Dexie.minKey], [filters.cashSessionId, Dexie.maxKey]);
			return filters.sort === "oldest" ? collection : collection.reverse();
		}
		if (filters.status) {
			const collection = this.database.sales
				.where("[status+createdAt]")
				.between([filters.status, Dexie.minKey], [filters.status, Dexie.maxKey]);
			return filters.sort === "oldest" ? collection : collection.reverse();
		}
		const collection = this.database.sales.orderBy("createdAt");
		return filters.sort === "oldest" ? collection : collection.reverse();
	}

	private validPage(page: number, total: number, pageSize: number): number {
		return Math.min(Math.max(1, page), Math.max(1, Math.ceil(total / pageSize)));
	}

	private toSummary(
		sale: SaleRecord,
		itemsBySale: ReadonlyMap<string, SaleItemRecord[]>,
		paymentsBySale: ReadonlyMap<string, SalePaymentRecord[]>,
	): SaleHistorySummary {
		const items = itemsBySale.get(sale.id) ?? [];
		return {
			id: sale.id,
			saleNumber: sale.saleNumber,
			formattedSaleNumber: formatSaleNumber(sale.saleNumber),
			status: sale.status,
			totalCents: sale.totalCents,
			paymentMethods: [...new Set((paymentsBySale.get(sale.id) ?? []).map(({ method }) => method))],
			createdAt: sale.createdAt,
			voidedAt: sale.voidedAt,
			cashSessionId: sale.cashSessionId,
			itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
			lineCount: items.length,
		};
	}
}
