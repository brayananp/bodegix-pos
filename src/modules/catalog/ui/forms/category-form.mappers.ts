import type { CreateCategoryInput, UpdateCategoryInput } from "../../application";
import { CatalogError, type Category } from "../../domain";
import { categoryFormSchema } from "./category-form.schema";
import type { CategoryFormValues } from "./category-form.types";

export function createEmptyCategoryFormValues(): CategoryFormValues {
	return { name: "" };
}

export function categoryToFormValues(category: Category): CategoryFormValues {
	return { name: category.name };
}

export function categoryFormValuesToCreateInput(values: CategoryFormValues): CreateCategoryInput {
	const parsed = categoryFormSchema.safeParse(values);
	if (!parsed.success) throw new CatalogError("INVALID_CATEGORY", parsed.error);
	return { name: parsed.data.name.trim() };
}

export function categoryFormValuesToUpdateInput(
	categoryId: string,
	values: CategoryFormValues,
): UpdateCategoryInput {
	return { categoryId, ...categoryFormValuesToCreateInput(values) };
}
