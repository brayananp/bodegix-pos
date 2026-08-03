import Dexie from "dexie";
import type { BodegixDatabase, ProductRecord } from "@/shared/infrastructure/local-db";
import { normalizeSearchText } from "@/shared/kernel/text";
import type {
	InventoryMovementFilter,
	InventoryMovementListItem,
	InventoryMovementSearchResult,
	InventoryProduct,
	InventoryQueries,
	InventorySearchResult,
	InventorySummary,
	ListInventoryMovementsQuery,
	SearchInventoryQuery,
} from "../application";
import { getInventoryStockStatus } from "../domain";

export class DexieInventoryQueries implements InventoryQueries {
	constructor(private readonly database: BodegixDatabase) {}

	async searchInventory(query: SearchInventoryQuery): Promise<InventorySearchResult> {
		const normalizedSearch = normalizeSearchText(query.search);
		const products = (await this.database.products.toArray()).filter((product) => {
			const productStatusMatches =
				query.productStatus === "all" ||
				(query.productStatus === "active" ? product.isActive : !product.isActive);
			const categoryMatches = !query.categoryId || product.categoryId === query.categoryId;
			const searchMatches =
				normalizedSearch.length === 0 ||
				product.normalizedName.includes(normalizedSearch) ||
				normalizeSearchText(product.barcode ?? "").includes(normalizedSearch);
			const status = getInventoryStockStatus(product.stockQuantity, product.minimumStockQuantity);
			return (
				productStatusMatches &&
				categoryMatches &&
				searchMatches &&
				(query.stockStatus === "all" || status === query.stockStatus)
			);
		});
		this.sortProducts(products, query.sort);
		const total = products.length;
		const totalPages = Math.max(1, Math.ceil(total / query.pageSize));
		const page = Math.min(query.page, totalPages);
		const start = (page - 1) * query.pageSize;
		const pageProducts = products.slice(start, start + query.pageSize);
		const items = await this.toInventoryProducts(pageProducts);
		return { items, total, page, pageSize: query.pageSize, totalPages };
	}

	async getInventoryProduct(id: string): Promise<InventoryProduct | undefined> {
		const product = await this.database.products.get(id);
		if (!product) return undefined;
		return (await this.toInventoryProducts([product]))[0];
	}

	async listInventoryMovements(
		query: ListInventoryMovementsQuery,
	): Promise<InventoryMovementSearchResult> {
		const collection = this.movementCollection(query.productId, query.movementType);
		const total = await collection.count();
		const totalPages = Math.max(1, Math.ceil(total / query.pageSize));
		const page = Math.min(query.page, totalPages);
		const records = await collection
			.offset((page - 1) * query.pageSize)
			.limit(query.pageSize)
			.toArray();
		const productIds = [...new Set(records.map(({ productId }) => productId))];
		const products = await this.database.products.bulkGet(productIds);
		const names = new Map(
			products.flatMap((product) => (product ? [[product.id, product.name]] : [])),
		);
		return {
			items: records.map((movement) => ({
				...movement,
				productName: names.get(movement.productId) ?? "Producto no disponible",
			})),
			total,
			page,
			pageSize: query.pageSize,
			totalPages,
		};
	}

	async getInventoryMovement(id: string): Promise<InventoryMovementListItem | undefined> {
		const movement = await this.database.inventoryMovements.get(id);
		if (!movement) return undefined;
		const product = await this.database.products.get(movement.productId);
		return { ...movement, productName: product?.name ?? "Producto no disponible" };
	}

	async getInventorySummary(): Promise<InventorySummary> {
		const [products, movementProductKeys] = await Promise.all([
			this.database.products.toArray(),
			this.database.inventoryMovements.orderBy("productId").uniqueKeys(),
		]);
		const productsWithMovements = new Set(
			movementProductKeys.filter((key): key is string => typeof key === "string"),
		);
		const activeProducts = products.filter(({ isActive }) => isActive);
		const statuses = activeProducts.map((product) =>
			getInventoryStockStatus(product.stockQuantity, product.minimumStockQuantity),
		);
		return {
			activeProducts: activeProducts.length,
			productsInStock: statuses.filter((status) => status === "in_stock").length,
			lowStockProducts: statuses.filter((status) => status === "low_stock").length,
			outOfStockProducts: statuses.filter((status) => status === "out_of_stock").length,
			productsWithoutMovements: activeProducts.filter(
				(product) => !productsWithMovements.has(product.id),
			).length,
		};
	}

	private movementCollection(productId: string | null, movementType: InventoryMovementFilter) {
		if (productId && movementType !== "all") {
			return this.database.inventoryMovements
				.where("[productId+type+createdAt]")
				.between([productId, movementType, Dexie.minKey], [productId, movementType, Dexie.maxKey])
				.reverse();
		}
		if (productId) {
			return this.database.inventoryMovements
				.where("[productId+createdAt]")
				.between([productId, Dexie.minKey], [productId, Dexie.maxKey])
				.reverse();
		}
		if (movementType !== "all") {
			return this.database.inventoryMovements
				.where("[type+createdAt]")
				.between([movementType, Dexie.minKey], [movementType, Dexie.maxKey])
				.reverse();
		}
		return this.database.inventoryMovements.orderBy("createdAt").reverse();
	}

	private async toInventoryProducts(products: ProductRecord[]): Promise<InventoryProduct[]> {
		const categoryIds = [
			...new Set(products.flatMap(({ categoryId }) => (categoryId ? [categoryId] : []))),
		];
		const categories = await this.database.categories.bulkGet(categoryIds);
		const categoryNames = new Map(
			categories.flatMap((category) => (category ? [[category.id, category.name]] : [])),
		);
		const lastMovements = await Promise.all(
			products.map((product) =>
				this.database.inventoryMovements
					.where("[productId+createdAt]")
					.between([product.id, Dexie.minKey], [product.id, Dexie.maxKey])
					.last(),
			),
		);
		return products.map((product, index) => {
			const movement = lastMovements[index];
			return {
				id: product.id,
				name: product.name,
				barcode: product.barcode,
				categoryId: product.categoryId,
				categoryName: product.categoryId ? (categoryNames.get(product.categoryId) ?? null) : null,
				stockQuantity: product.stockQuantity,
				minimumStockQuantity: product.minimumStockQuantity,
				isActive: product.isActive,
				stockStatus: getInventoryStockStatus(product.stockQuantity, product.minimumStockQuantity),
				hasInventoryMovements: movement !== undefined,
				lastMovementAt: movement?.createdAt ?? null,
			};
		});
	}

	private sortProducts(products: ProductRecord[], sort: SearchInventoryQuery["sort"]): void {
		products.sort((left, right) => {
			if (sort === "stock-asc") return left.stockQuantity - right.stockQuantity;
			if (sort === "stock-desc") return right.stockQuantity - left.stockQuantity;
			if (sort === "updated-desc") return right.updatedAt - left.updatedAt;
			return left.name.localeCompare(right.name, "es", { sensitivity: "base" });
		});
	}
}
