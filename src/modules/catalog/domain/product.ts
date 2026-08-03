import { normalizeSearchText } from "@/shared/kernel/text";
import { CatalogError } from "./catalog-errors";

export interface Product {
	id: string;
	barcode: string | null;
	name: string;
	normalizedName: string;
	categoryId: string | null;
	salePriceCents: number;
	costPriceCents: number | null;
	stockQuantity: number;
	minimumStockQuantity: number;
	isActive: boolean;
	createdAt: number;
	updatedAt: number;
}

export function normalizeProductName(value: string): { name: string; normalizedName: string } {
	const name = value.trim().replace(/\s+/g, " ");
	if (name.length < 2 || name.length > 120) throw new CatalogError("INVALID_PRODUCT");
	return { name, normalizedName: normalizeSearchText(name) };
}

export function normalizeBarcode(value: string | null): string | null {
	const barcode = value?.trim() ?? "";
	if (barcode.length === 0) return null;
	if (barcode.length > 64 || !/^[\p{L}\p{N}._\-/]+$/u.test(barcode)) {
		throw new CatalogError("INVALID_PRODUCT");
	}
	return barcode;
}

export function assertProductAmounts(input: {
	salePriceCents: number;
	costPriceCents: number | null;
	minimumStockQuantity: number;
}): void {
	if (!Number.isSafeInteger(input.salePriceCents) || input.salePriceCents <= 0) {
		throw new CatalogError("INVALID_PRODUCT");
	}
	if (
		input.costPriceCents !== null &&
		(!Number.isSafeInteger(input.costPriceCents) || input.costPriceCents < 0)
	) {
		throw new CatalogError("INVALID_PRODUCT");
	}
	if (!Number.isSafeInteger(input.minimumStockQuantity) || input.minimumStockQuantity < 0) {
		throw new CatalogError("INVALID_PRODUCT");
	}
}
