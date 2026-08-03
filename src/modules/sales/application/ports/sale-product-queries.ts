export interface SaleProductListItem {
	id: string;
	name: string;
	barcode: string | null;
	categoryId: string | null;
	categoryName: string | null;
	salePriceCents: number;
	stockQuantity: number;
	isActive: boolean;
	/** true si el producto está activo y tiene stock > 0 */
	canSell: boolean;
}

export interface SearchSaleProductsQuery {
	search: string;
	categoryId: string | null;
	page: number;
	pageSize: number;
}

export interface SearchSaleProductsResult {
	items: SaleProductListItem[];
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
}

export interface SaleProductQueries {
	searchProducts(query: SearchSaleProductsQuery): Promise<SearchSaleProductsResult>;
	getProductsByIds(ids: string[]): Promise<SaleProductListItem[]>;
}
