import { nowTimestamp } from "@/shared/kernel/dates";
import { createId } from "@/shared/kernel/ids";
import { type Category, CatalogError, normalizeCategoryName } from "../../domain";
import type { CatalogStore } from "../ports/catalog-store";

export interface CreateCategoryInput {
	name: string;
}

export interface UpdateCategoryInput extends CreateCategoryInput {
	categoryId: string;
}

export interface CatalogCommandDependencies {
	createId(): string;
	now(): number;
}

const defaultDependencies: CatalogCommandDependencies = { createId, now: nowTimestamp };

export async function createCategory(
	store: CatalogStore,
	input: CreateCategoryInput,
	dependencies: CatalogCommandDependencies = defaultDependencies,
): Promise<Category> {
	const names = normalizeCategoryName(input.name);
	const timestamp = dependencies.now();
	const category: Category = {
		id: dependencies.createId(),
		...names,
		isActive: true,
		createdAt: timestamp,
		updatedAt: timestamp,
	};
	await store.createCategory(category);
	return category;
}

export async function updateCategory(
	store: CatalogStore,
	input: UpdateCategoryInput,
	dependencies: Pick<CatalogCommandDependencies, "now"> = defaultDependencies,
): Promise<Category> {
	const current = await store.getCategoryById(input.categoryId);
	if (!current) throw new CatalogError("CATEGORY_NOT_FOUND");
	const updated: Category = {
		...current,
		...normalizeCategoryName(input.name),
		updatedAt: dependencies.now(),
	};
	await store.updateCategory(updated);
	return updated;
}

export function setCategoryActiveState(
	store: CatalogStore,
	categoryId: string,
	isActive: boolean,
	dependencies: Pick<CatalogCommandDependencies, "now"> = defaultDependencies,
): Promise<Category> {
	return store.setCategoryActiveState(categoryId, isActive, dependencies.now());
}
