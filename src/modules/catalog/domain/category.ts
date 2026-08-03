import { normalizeSearchText } from "@/shared/kernel/text";
import { CatalogError } from "./catalog-errors";

export interface Category {
	id: string;
	name: string;
	normalizedName: string;
	isActive: boolean;
	createdAt: number;
	updatedAt: number;
}

export function normalizeCategoryName(value: string): { name: string; normalizedName: string } {
	const name = value.trim().replace(/\s+/g, " ");
	if (name.length < 2 || name.length > 60) throw new CatalogError("INVALID_CATEGORY");
	return { name, normalizedName: normalizeSearchText(name) };
}
