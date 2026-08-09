import type { PaymentMethod, PaymentStatus, SaleStatus, SaleVoidEligibility } from "../../domain";
import type { VoidSaleResult } from "./void-sale-unit-of-work";

export type SaleHistorySort = "newest" | "oldest" | "total-desc" | "total-asc";

export interface SaleSearchFilters {
	readonly searchText?: string;
	readonly status?: SaleStatus;
	readonly paymentMethod?: PaymentMethod;
	readonly cashSessionId?: string;
	readonly fromDate?: number;
	readonly toDate?: number;
	readonly sort: SaleHistorySort;
}

export interface PaginationOptions {
	readonly page: number;
	readonly pageSize: 25 | 50 | 100;
}

export interface PaginatedResult<T> {
	readonly items: T[];
	readonly totalCount: number;
	readonly page: number;
	readonly pageSize: number;
	readonly totalPages: number;
	readonly hasPreviousPage: boolean;
	readonly hasNextPage: boolean;
}

export interface SaleHistorySummary {
	readonly id: string;
	readonly saleNumber: number;
	readonly formattedSaleNumber: string;
	readonly status: SaleStatus;
	readonly totalCents: number;
	readonly paymentMethods: PaymentMethod[];
	readonly createdAt: number;
	readonly voidedAt: number | null;
	readonly cashSessionId: string;
	readonly itemCount: number;
	readonly lineCount: number;
}

export interface SaleDetailItem {
	readonly id: string;
	readonly productId: string;
	readonly productName: string;
	readonly unitPriceCents: number;
	readonly unitCostCents: number | null;
	readonly quantity: number;
	readonly subtotalCents: number;
	readonly productAvailable: boolean;
}

export interface SaleDetailPayment {
	readonly id: string;
	readonly method: PaymentMethod;
	readonly amountCents: number;
	readonly status: PaymentStatus;
	readonly providerLabel: string | null;
	readonly operationReference: string | null;
	readonly cashReceivedCents: number | null;
	readonly changeCents: number | null;
	readonly verifiedAt: number;
	readonly voidedAt: number | null;
	readonly voidOperationReference: string | null;
}

export interface SaleDetailInventoryMovement {
	readonly id: string;
	readonly productId: string;
	readonly productName: string;
	readonly type: "sale" | "sale_void";
	readonly quantityDelta: number;
	readonly stockBefore: number;
	readonly stockAfter: number;
	readonly createdAt: number;
}

export interface SaleDetail {
	readonly id: string;
	readonly saleNumber: number;
	readonly formattedSaleNumber: string;
	readonly status: SaleStatus;
	readonly subtotalCents: number;
	readonly totalCents: number;
	readonly createdAt: number;
	readonly voidedAt: number | null;
	readonly voidReason: string | null;
	readonly cashSessionId: string;
	readonly cashSessionStatus: "open" | "closed" | "missing";
	readonly items: SaleDetailItem[];
	readonly payments: SaleDetailPayment[];
	readonly inventoryMovements: SaleDetailInventoryMovement[];
	readonly voidEligibility: SaleVoidEligibility;
}

export interface SaleHistoryQueries {
	countSales(): Promise<number>;
	searchSales(
		filters: SaleSearchFilters,
		pagination: PaginationOptions,
	): Promise<PaginatedResult<SaleHistorySummary>>;
	getSaleDetail(saleId: string): Promise<SaleDetail | null>;
	getSaleVoidEligibility(saleId: string): Promise<SaleVoidEligibility>;
	getSaleVoidResult(saleId: string): Promise<VoidSaleResult | null>;
}
