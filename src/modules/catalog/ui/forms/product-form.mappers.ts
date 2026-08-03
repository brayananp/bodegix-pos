import type { CreateProductInput, UpdateProductInput } from "../../application";
import { CatalogError, type Product } from "../../domain";
import { moneyCentsToInput, parseMoneyToCents } from "@/shared/kernel/money";
import { productFormSchema } from "./product-form.schema";
import type { ProductFormValues } from "./product-form.types";

export function createEmptyProductFormValues(): ProductFormValues {
	return {
		name: "",
		barcode: "",
		categoryId: "",
		salePrice: "",
		costPrice: "",
		minimumStockQuantity: "0",
	};
}

export function productToFormValues(product: Product): ProductFormValues {
	return {
		name: product.name,
		barcode: product.barcode ?? "",
		categoryId: product.categoryId ?? "",
		salePrice: moneyCentsToInput(product.salePriceCents),
		costPrice: product.costPriceCents === null ? "" : moneyCentsToInput(product.costPriceCents),
		minimumStockQuantity: String(product.minimumStockQuantity),
	};
}

export function productFormValuesToCreateInput(values: ProductFormValues): CreateProductInput {
	const parsed = productFormSchema.safeParse(values);
	if (!parsed.success) throw new CatalogError("INVALID_PRODUCT", parsed.error);
	const minimumStockQuantity = Number(parsed.data.minimumStockQuantity);
	if (!Number.isSafeInteger(minimumStockQuantity)) throw new CatalogError("INVALID_PRODUCT");
	return {
		name: parsed.data.name.trim(),
		barcode: parsed.data.barcode.trim() || null,
		categoryId: parsed.data.categoryId || null,
		salePriceCents: parseMoneyToCents(parsed.data.salePrice),
		costPriceCents: parsed.data.costPrice === "" ? null : parseMoneyToCents(parsed.data.costPrice),
		minimumStockQuantity,
	};
}

export function productFormValuesToUpdateInput(
	productId: string,
	values: ProductFormValues,
): UpdateProductInput {
	return { productId, ...productFormValuesToCreateInput(values) };
}
