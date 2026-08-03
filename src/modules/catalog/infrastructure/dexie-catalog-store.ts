import type { Category, Product } from "../domain";
import { CatalogError, isCatalogError } from "../domain";
import type { CatalogStore } from "../application";
import type { BodegixDatabase } from "@/shared/infrastructure/local-db";

function persistenceError(error: unknown): CatalogError {
	return isCatalogError(error) ? error : new CatalogError("CATALOG_PERSISTENCE_ERROR", error);
}

export class DexieCatalogStore implements CatalogStore {
	constructor(private readonly database: BodegixDatabase) {}

	getCategoryById(id: string): Promise<Category | undefined> {
		return this.database.categories.get(id);
	}

	getProductById(id: string): Promise<Product | undefined> {
		return this.database.products.get(id);
	}

	async createCategory(category: Category): Promise<void> {
		try {
			await this.database.transaction("rw", this.database.categories, async () => {
				const duplicate = await this.database.categories
					.where("normalizedName")
					.equals(category.normalizedName)
					.first();
				if (duplicate) throw new CatalogError("CATEGORY_NAME_ALREADY_EXISTS");
				await this.database.categories.add(category);
			});
		} catch (error) {
			if (error instanceof Error && error.name === "ConstraintError") {
				throw new CatalogError("CATEGORY_NAME_ALREADY_EXISTS", error);
			}
			throw persistenceError(error);
		}
	}

	async updateCategory(category: Category): Promise<void> {
		try {
			await this.database.transaction("rw", this.database.categories, async () => {
				const current = await this.database.categories.get(category.id);
				if (!current) throw new CatalogError("CATEGORY_NOT_FOUND");
				const duplicate = await this.database.categories
					.where("normalizedName")
					.equals(category.normalizedName)
					.and(({ id }) => id !== category.id)
					.first();
				if (duplicate) throw new CatalogError("CATEGORY_NAME_ALREADY_EXISTS");
				await this.database.categories.put({
					...category,
					createdAt: current.createdAt,
					isActive: current.isActive,
				});
			});
		} catch (error) {
			if (error instanceof Error && error.name === "ConstraintError") {
				throw new CatalogError("CATEGORY_NAME_ALREADY_EXISTS", error);
			}
			throw persistenceError(error);
		}
	}

	async setCategoryActiveState(
		id: string,
		isActive: boolean,
		updatedAt: number,
	): Promise<Category> {
		try {
			return await this.database.transaction("rw", this.database.categories, async () => {
				const current = await this.database.categories.get(id);
				if (!current) throw new CatalogError("CATEGORY_NOT_FOUND");
				const updated = { ...current, isActive, updatedAt };
				await this.database.categories.put(updated);
				return updated;
			});
		} catch (error) {
			throw persistenceError(error);
		}
	}

	async createProduct(product: Product): Promise<void> {
		try {
			await this.database.transaction(
				"rw",
				[this.database.products, this.database.categories],
				async () => {
					await this.assertCategoryActive(product.categoryId);
					await this.assertBarcodeAvailable(product.barcode, product.id, product.isActive);
					await this.database.products.add({ ...product, stockQuantity: 0 });
				},
			);
		} catch (error) {
			throw persistenceError(error);
		}
	}

	async updateProduct(product: Product): Promise<void> {
		try {
			await this.database.transaction(
				"rw",
				[this.database.products, this.database.categories],
				async () => {
					const current = await this.database.products.get(product.id);
					if (!current) throw new CatalogError("PRODUCT_NOT_FOUND");
					if (product.categoryId !== current.categoryId) {
						await this.assertCategoryActive(product.categoryId);
					}
					await this.assertBarcodeAvailable(product.barcode, product.id, current.isActive);
					await this.database.products.put({
						...product,
						createdAt: current.createdAt,
						stockQuantity: current.stockQuantity,
						isActive: current.isActive,
					});
				},
			);
		} catch (error) {
			throw persistenceError(error);
		}
	}

	async setProductActiveState(id: string, isActive: boolean, updatedAt: number): Promise<Product> {
		try {
			return await this.database.transaction("rw", this.database.products, async () => {
				const current = await this.database.products.get(id);
				if (!current) throw new CatalogError("PRODUCT_NOT_FOUND");
				await this.assertBarcodeAvailable(current.barcode, current.id, isActive);
				const updated = { ...current, isActive, updatedAt };
				await this.database.products.put(updated);
				return updated;
			});
		} catch (error) {
			throw persistenceError(error);
		}
	}

	private async assertCategoryActive(categoryId: string | null): Promise<void> {
		if (!categoryId) return;
		const category = await this.database.categories.get(categoryId);
		if (!category) throw new CatalogError("CATEGORY_NOT_FOUND");
		if (!category.isActive) throw new CatalogError("CATEGORY_INACTIVE");
	}

	private async assertBarcodeAvailable(
		barcode: string | null,
		productId: string,
		isActive: boolean,
	): Promise<void> {
		if (!barcode || !isActive) return;
		const duplicate = await this.database.products
			.where("barcode")
			.equals(barcode)
			.and((candidate) => candidate.id !== productId && candidate.isActive)
			.first();
		if (duplicate) throw new CatalogError("PRODUCT_BARCODE_ALREADY_EXISTS");
	}
}
