import { InventoryError } from "./inventory-errors";

export type InventoryStockStatus = "in_stock" | "low_stock" | "out_of_stock";

export function getInventoryStockStatus(
	stockQuantity: number,
	minimumStockQuantity: number,
): InventoryStockStatus {
	if (
		!Number.isSafeInteger(stockQuantity) ||
		stockQuantity < 0 ||
		!Number.isSafeInteger(minimumStockQuantity) ||
		minimumStockQuantity < 0
	) {
		throw new InventoryError("INVALID_STOCK_QUANTITY");
	}
	if (stockQuantity === 0) return "out_of_stock";
	if (minimumStockQuantity > 0 && stockQuantity <= minimumStockQuantity) return "low_stock";
	return "in_stock";
}
