import type { SaleDraft } from "../../domain";
import type { SaleProductListItem } from "../ports/sale-product-queries";

export type SaleDraftIssueCode =
	| "PRODUCT_NOT_FOUND"
	| "PRODUCT_INACTIVE"
	| "PRODUCT_OUT_OF_STOCK"
	| "INSUFFICIENT_STOCK"
	| "PRODUCT_PRICE_CHANGED";

export interface SaleDraftIssue {
	productId: string;
	code: SaleDraftIssueCode;
	expectedUnitPriceCents?: number;
	currentUnitPriceCents?: number;
	requestedQuantity?: number;
	availableQuantity?: number;
}

export interface SaleDraftReview {
	valid: boolean;
	issues: SaleDraftIssue[];
}

/**
 * Compara el borrador contra el catálogo actual.
 * Función pura — no modifica nada.
 */
export function reviewSaleDraft(
	draft: SaleDraft,
	products: Map<string, SaleProductListItem>,
): SaleDraftReview {
	const issues: SaleDraftIssue[] = [];

	for (const item of draft.items) {
		const product = products.get(item.productId);

		if (!product) {
			issues.push({ productId: item.productId, code: "PRODUCT_NOT_FOUND" });
			continue;
		}

		if (!product.isActive) {
			issues.push({ productId: item.productId, code: "PRODUCT_INACTIVE" });
			continue;
		}

		if (product.stockQuantity === 0) {
			issues.push({
				productId: item.productId,
				code: "PRODUCT_OUT_OF_STOCK",
				requestedQuantity: item.quantity,
				availableQuantity: 0,
			});
			continue;
		}

		if (item.quantity > product.stockQuantity) {
			issues.push({
				productId: item.productId,
				code: "INSUFFICIENT_STOCK",
				requestedQuantity: item.quantity,
				availableQuantity: product.stockQuantity,
			});
		}

		if (product.salePriceCents !== item.expectedUnitPriceCents) {
			issues.push({
				productId: item.productId,
				code: "PRODUCT_PRICE_CHANGED",
				expectedUnitPriceCents: item.expectedUnitPriceCents,
				currentUnitPriceCents: product.salePriceCents,
			});
		}
	}

	return { valid: issues.length === 0, issues };
}
