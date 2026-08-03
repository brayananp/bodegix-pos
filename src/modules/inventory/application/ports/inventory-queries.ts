import type { InventoryMovement, InventoryMovementType, InventoryStockStatus } from "../../domain";

export type InventoryPageSize = 25 | 50 | 100;
export type InventoryProductStatus = "all" | "active" | "inactive";
export type InventoryStockFilter = "all" | InventoryStockStatus;
export type InventorySort = "name-asc" | "stock-asc" | "stock-desc" | "updated-desc";
export type InventoryMovementFilter = "all" | InventoryMovementType;

export interface InventoryProduct {
	id: string;
	name: string;
	barcode: string | null;
	categoryId: string | null;
	categoryName: string | null;
	stockQuantity: number;
	minimumStockQuantity: number;
	isActive: boolean;
	stockStatus: InventoryStockStatus;
	hasInventoryMovements: boolean;
	lastMovementAt: number | null;
}

export interface SearchInventoryQuery {
	search: string;
	categoryId: string | null;
	productStatus: InventoryProductStatus;
	stockStatus: InventoryStockFilter;
	page: number;
	pageSize: InventoryPageSize;
	sort: InventorySort;
}

export interface InventorySearchResult {
	items: InventoryProduct[];
	total: number;
	page: number;
	pageSize: InventoryPageSize;
	totalPages: number;
}

export interface InventoryMovementListItem extends InventoryMovement {
	productName: string;
}

export interface ListInventoryMovementsQuery {
	productId: string | null;
	movementType: InventoryMovementFilter;
	page: number;
	pageSize: InventoryPageSize;
}

export interface InventoryMovementSearchResult {
	items: InventoryMovementListItem[];
	total: number;
	page: number;
	pageSize: InventoryPageSize;
	totalPages: number;
}

export interface InventorySummary {
	activeProducts: number;
	productsInStock: number;
	lowStockProducts: number;
	outOfStockProducts: number;
	productsWithoutMovements: number;
}

export interface InventoryQueries {
	searchInventory(query: SearchInventoryQuery): Promise<InventorySearchResult>;
	getInventoryProduct(id: string): Promise<InventoryProduct | undefined>;
	listInventoryMovements(
		query: ListInventoryMovementsQuery,
	): Promise<InventoryMovementSearchResult>;
	getInventoryMovement(id: string): Promise<InventoryMovementListItem | undefined>;
	getInventorySummary(): Promise<InventorySummary>;
}
