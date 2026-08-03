import { normalizeSearchText } from "@/shared/kernel/text";
import type { BodegixDatabase } from "@/shared/infrastructure/local-db";
import type {
	CatalogQueries,
	ListCategoriesQuery,
	ProductListItem,
	ProductSearchResult,
	SearchProductsQuery,
} from "../application";
import type { Category, Product } from "../domain";

export class DexieCatalogQueries implements CatalogQueries {
	constructor(private readonly database: BodegixDatabase) {}

	getCategoryById(id: string): Promise<Category | undefined> {
		return this.database.categories.get(id);
	}

	async listCategories(query: ListCategoriesQuery = {}): Promise<Category[]> {
		const normalizedSearch = normalizeSearchText(query.search ?? "");
		const categories = await this.database.categories.toArray();
		return categories
			.filter((category) => {
				const statusMatches =
					query.status === undefined ||
					query.status === "all" ||
					(query.status === "active" ? category.isActive : !category.isActive);
				return statusMatches && category.normalizedName.includes(normalizedSearch);
			})
			.sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" }));
	}

	getProductById(id: string): Promise<Product | undefined> {
		return this.database.products.get(id);
	}

	async searchProducts(query: SearchProductsQuery): Promise<ProductSearchResult> {
		const [products, categories] = await Promise.all([
			this.database.products.toArray(),
			this.database.categories.toArray(),
		]);
		const categoryNames = new Map(categories.map((category) => [category.id, category.name]));
		const normalizedSearch = normalizeSearchText(query.search);
		const filtered: ProductListItem[] = products
			.filter((product) => {
				const statusMatches =
					query.status === "all" ||
					(query.status === "active" ? product.isActive : !product.isActive);
				const categoryMatches = !query.categoryId || product.categoryId === query.categoryId;
				const searchMatches =
					normalizedSearch.length === 0 ||
					product.normalizedName.includes(normalizedSearch) ||
					normalizeSearchText(product.barcode ?? "").includes(normalizedSearch);
				return statusMatches && categoryMatches && searchMatches;
			})
			.map((product) => ({
				...product,
				categoryName: product.categoryId ? (categoryNames.get(product.categoryId) ?? null) : null,
			}));

		filtered.sort((a, b) => {
			if (query.sort === "updated-desc") return b.updatedAt - a.updatedAt;
			const comparison = a.name.localeCompare(b.name, "es", { sensitivity: "base" });
			return query.sort === "name-desc" ? -comparison : comparison;
		});

		const total = filtered.length;
		const totalPages = Math.max(1, Math.ceil(total / query.pageSize));
		const page = Math.min(query.page, totalPages);
		const start = (page - 1) * query.pageSize;
		return {
			items: filtered.slice(start, start + query.pageSize),
			total,
			page,
			pageSize: query.pageSize,
			totalPages,
		};
	}
}
