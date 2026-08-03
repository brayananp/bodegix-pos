import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { BodegixDatabase } from "@/shared/infrastructure/local-db";
import {
	createCategory,
	createProduct,
	setProductActiveState,
	updateProduct,
} from "../application";
import { DexieCatalogQueries } from "./dexie-catalog-queries";
import { DexieCatalogStore } from "./dexie-catalog-store";

let database: BodegixDatabase;
let store: DexieCatalogStore;
let queries: DexieCatalogQueries;
let sequence = 0;
const dependencies = {
	createId: () => `id-${++sequence}`,
	now: () => 1_000 + sequence,
};

beforeEach(async () => {
	sequence = 0;
	database = new BodegixDatabase(`catalog-test-${crypto.randomUUID()}`);
	await database.open();
	store = new DexieCatalogStore(database);
	queries = new DexieCatalogQueries(database);
});

afterEach(async () => {
	database.close();
	await database.delete();
});

describe("catálogo Dexie", () => {
	it("crea, edita, filtra y pagina conservando el stock", async () => {
		const category = await createCategory(store, { name: "Bebidas" }, dependencies);
		const product = await createProduct(
			store,
			{
				name: "Agua mineral",
				barcode: "001",
				categoryId: category.id,
				salePriceCents: 250,
				costPriceCents: 100,
				minimumStockQuantity: 3,
			},
			dependencies,
		);
		expect(product.stockQuantity).toBe(0);
		await database.products.update(product.id, { stockQuantity: 9 });
		const updated = await updateProduct(
			store,
			{ ...product, productId: product.id, name: "Agua sin gas", salePriceCents: 300 },
			dependencies,
		);
		expect(updated.stockQuantity).toBe(9);
		expect((await store.getProductById(product.id))?.stockQuantity).toBe(9);

		const result = await queries.searchProducts({
			search: "001",
			categoryId: category.id,
			status: "active",
			page: 1,
			pageSize: 25,
			sort: "updated-desc",
		});
		expect(result).toMatchObject({ total: 1, page: 1, totalPages: 1 });
		expect(result.items[0]).toMatchObject({ name: "Agua sin gas", categoryName: "Bebidas" });
	});

	it("impide nombres normalizados y códigos activos duplicados", async () => {
		await createCategory(store, { name: "Lácteos" }, dependencies);
		await expect(createCategory(store, { name: "  LACTEOS " }, dependencies)).rejects.toMatchObject(
			{
				code: "CATEGORY_NAME_ALREADY_EXISTS",
			},
		);
		await createProduct(
			store,
			{
				name: "Producto uno",
				barcode: "ABC-01",
				categoryId: null,
				salePriceCents: 100,
				costPriceCents: null,
				minimumStockQuantity: 0,
			},
			dependencies,
		);
		await expect(
			createProduct(
				store,
				{
					name: "Producto dos",
					barcode: "ABC-01",
					categoryId: null,
					salePriceCents: 200,
					costPriceCents: null,
					minimumStockQuantity: 0,
				},
				dependencies,
			),
		).rejects.toMatchObject({ code: "PRODUCT_BARCODE_ALREADY_EXISTS" });
	});

	it("desactiva sin borrar ni modificar stock y persiste al reabrir", async () => {
		const product = await createProduct(
			store,
			{
				name: "Galletas",
				barcode: "777",
				categoryId: null,
				salePriceCents: 180,
				costPriceCents: null,
				minimumStockQuantity: 1,
			},
			dependencies,
		);
		await database.products.update(product.id, { stockQuantity: 5 });
		await setProductActiveState(store, product.id, false, dependencies);
		database.close();
		await database.open();
		expect(await database.products.get(product.id)).toMatchObject({
			isActive: false,
			stockQuantity: 5,
		});
		expect(await database.products.count()).toBe(1);
	});
});
