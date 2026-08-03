import { nowTimestamp } from "@/shared/kernel/dates";
import { createId } from "@/shared/kernel/ids";
import {
	assertProductAmounts,
	CatalogError,
	normalizeBarcode,
	normalizeProductName,
	type Product,
} from "../../domain";
import type { CatalogCommandDependencies } from "./category-commands";
import type { CatalogStore } from "../ports/catalog-store";

export interface CreateProductInput {
	name: string;
	barcode: string | null;
	categoryId: string | null;
	salePriceCents: number;
	costPriceCents: number | null;
	minimumStockQuantity: number;
}

export interface UpdateProductInput extends CreateProductInput {
	productId: string;
}

const defaultDependencies: CatalogCommandDependencies = { createId, now: nowTimestamp };

async function assertCategoryCanBeAssigned(
	store: CatalogStore,
	categoryId: string | null,
	previousCategoryId: string | null = null,
): Promise<void> {
	if (!categoryId || categoryId === previousCategoryId) return;
	const category = await store.getCategoryById(categoryId);
	if (!category) throw new CatalogError("CATEGORY_NOT_FOUND");
	if (!category.isActive) throw new CatalogError("CATEGORY_INACTIVE");
}

export async function createProduct(
	store: CatalogStore,
	input: CreateProductInput,
	dependencies: CatalogCommandDependencies = defaultDependencies,
): Promise<Product> {
	assertProductAmounts(input);
	await assertCategoryCanBeAssigned(store, input.categoryId);
	const timestamp = dependencies.now();
	const product: Product = {
		id: dependencies.createId(),
		...normalizeProductName(input.name),
		barcode: normalizeBarcode(input.barcode),
		categoryId: input.categoryId,
		salePriceCents: input.salePriceCents,
		costPriceCents: input.costPriceCents,
		stockQuantity: 0,
		minimumStockQuantity: input.minimumStockQuantity,
		isActive: true,
		createdAt: timestamp,
		updatedAt: timestamp,
	};
	await store.createProduct(product);
	return product;
}

export async function updateProduct(
	store: CatalogStore,
	input: UpdateProductInput,
	dependencies: Pick<CatalogCommandDependencies, "now"> = defaultDependencies,
): Promise<Product> {
	assertProductAmounts(input);
	const current = await store.getProductById(input.productId);
	if (!current) throw new CatalogError("PRODUCT_NOT_FOUND");
	await assertCategoryCanBeAssigned(store, input.categoryId, current.categoryId);
	const updated: Product = {
		...current,
		...normalizeProductName(input.name),
		barcode: normalizeBarcode(input.barcode),
		categoryId: input.categoryId,
		salePriceCents: input.salePriceCents,
		costPriceCents: input.costPriceCents,
		minimumStockQuantity: input.minimumStockQuantity,
		updatedAt: dependencies.now(),
	};
	await store.updateProduct(updated);
	return updated;
}

export function setProductActiveState(
	store: CatalogStore,
	productId: string,
	isActive: boolean,
	dependencies: Pick<CatalogCommandDependencies, "now"> = defaultDependencies,
): Promise<Product> {
	return store.setProductActiveState(productId, isActive, dependencies.now());
}
