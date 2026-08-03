import type { BodegixDatabase } from "@/shared/infrastructure/local-db";
import { normalizeSearchText } from "@/shared/kernel/text";
import type {
	SaleProductListItem,
	SaleProductQueries,
	SearchSaleProductsQuery,
	SearchSaleProductsResult,
} from "../application";

export class DexieSaleProductQueries implements SaleProductQueries {
	constructor(private readonly database: BodegixDatabase) {}

	async searchProducts(query: SearchSaleProductsQuery): Promise<SearchSaleProductsResult> {
		const { search, categoryId, page, pageSize } = query;
		const normalizedSearch = normalizeSearchText(search.trim());
		const exactBarcode = search.trim();

		const [products, categories] = await Promise.all([
			this.database.products.toArray(),
			this.database.categories.toArray(),
		]);
		const categoryMap = new Map(categories.map((c) => [c.id, c]));

		const filtered = products.filter((p) => {
			if (!p.isActive) return false;
			if (categoryId && p.categoryId !== categoryId) return false;
			if (exactBarcode && p.barcode === exactBarcode) return true;
			if (normalizedSearch) return p.normalizedName.includes(normalizedSearch);
			return true;
		});

		filtered.sort((a, b) => a.normalizedName.localeCompare(b.normalizedName, "es"));

		const total = filtered.length;
		const totalPages = Math.max(1, Math.ceil(total / pageSize));
		const safePage = Math.min(page, totalPages);
		const items = filtered
			.slice((safePage - 1) * pageSize, safePage * pageSize)
			.map((p) => this.toListItem(p, categoryMap));

		return { items, total, page: safePage, pageSize, totalPages };
	}

	async getProductsByIds(ids: string[]): Promise<SaleProductListItem[]> {
		if (ids.length === 0) return [];
		const categories = await this.database.categories.toArray();
		const categoryMap = new Map(categories.map((c) => [c.id, c]));
		const records = await this.database.products.bulkGet(ids);
		return records
			.filter((r): r is NonNullable<typeof r> => r !== undefined)
			.map((p) => this.toListItem(p, categoryMap));
	}

	private toListItem(
		product: {
			id: string;
			barcode: string | null;
			name: string;
			categoryId: string | null;
			salePriceCents: number;
			stockQuantity: number;
			isActive: boolean;
		},
		categoryMap: Map<string, { id: string; name: string; isActive: boolean }>,
	): SaleProductListItem {
		const category = product.categoryId ? categoryMap.get(product.categoryId) : undefined;
		return {
			id: product.id,
			name: product.name,
			barcode: product.barcode,
			categoryId: product.categoryId,
			categoryName: category?.name ?? null,
			salePriceCents: product.salePriceCents,
			stockQuantity: product.stockQuantity,
			isActive: product.isActive,
			canSell: product.isActive && product.stockQuantity > 0,
		};
	}
}
