import type { Category, Product } from "../../domain";

export interface CatalogStore {
	getCategoryById(id: string): Promise<Category | undefined>;
	getProductById(id: string): Promise<Product | undefined>;
	createCategory(category: Category): Promise<void>;
	updateCategory(category: Category): Promise<void>;
	setCategoryActiveState(id: string, isActive: boolean, updatedAt: number): Promise<Category>;
	createProduct(product: Product): Promise<void>;
	updateProduct(product: Product): Promise<void>;
	setProductActiveState(id: string, isActive: boolean, updatedAt: number): Promise<Product>;
}
