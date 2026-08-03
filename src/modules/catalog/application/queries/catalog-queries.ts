import type { Category, Product } from "../../domain";

export type CatalogStatusFilter = "all" | "active" | "inactive";
export type ProductSort = "name-asc" | "name-desc" | "updated-desc";
export type ProductPageSize = 25 | 50 | 100;

export interface SearchProductsQuery {
	search: string;
	categoryId: string | null;
	status: CatalogStatusFilter;
	page: number;
	pageSize: ProductPageSize;
	sort: ProductSort;
}

export interface ProductListItem extends Product {
	categoryName: string | null;
}

export interface ProductSearchResult {
	items: ProductListItem[];
	total: number;
	page: number;
	pageSize: ProductPageSize;
	totalPages: number;
}

export interface ListCategoriesQuery {
	search?: string;
	status?: CatalogStatusFilter;
}

export interface CatalogQueries {
	getCategoryById(id: string): Promise<Category | undefined>;
	listCategories(query?: ListCategoriesQuery): Promise<Category[]>;
	getProductById(id: string): Promise<Product | undefined>;
	searchProducts(query: SearchProductsQuery): Promise<ProductSearchResult>;
}

export const getCategoryById = (queries: CatalogQueries, id: string) => queries.getCategoryById(id);
export const listCategories = (queries: CatalogQueries, query?: ListCategoriesQuery) =>
	queries.listCategories(query);
export const getProductById = (queries: CatalogQueries, id: string) => queries.getProductById(id);
export const searchProducts = (queries: CatalogQueries, query: SearchProductsQuery) =>
	queries.searchProducts(query);
