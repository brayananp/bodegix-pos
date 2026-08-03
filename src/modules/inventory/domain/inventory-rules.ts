import { InventoryError } from "./inventory-errors";
import type { InventoryMovementType } from "./inventory-movement";
import type { InventoryOperation } from "./inventory-operation";

export interface InventoryTransition {
	movementType: InventoryMovementType;
	quantityDelta: number;
	stockBefore: number;
	stockAfter: number;
}

function assertNonNegativeInteger(value: number, field = "quantity"): void {
	if (!Number.isSafeInteger(value) || value < 0) {
		throw new InventoryError("INVALID_STOCK_QUANTITY", { field });
	}
}

function assertPositiveInteger(value: number, field = "quantity"): void {
	if (!Number.isSafeInteger(value) || value <= 0) {
		throw new InventoryError("INVALID_STOCK_QUANTITY", { field });
	}
}

export function calculateInventoryTransition(
	currentStock: number,
	operation: InventoryOperation,
): InventoryTransition {
	assertNonNegativeInteger(currentStock, "stockQuantity");

	if (operation.kind === "initial") {
		assertPositiveInteger(operation.quantity);
		if (currentStock !== 0) throw new InventoryError("INITIAL_STOCK_REQUIRES_ZERO_STOCK");
		return {
			movementType: "initial_stock",
			quantityDelta: operation.quantity,
			stockBefore: 0,
			stockAfter: operation.quantity,
		};
	}

	if (operation.kind === "entry") {
		assertPositiveInteger(operation.quantity);
		const stockAfter = currentStock + operation.quantity;
		if (!Number.isSafeInteger(stockAfter)) {
			throw new InventoryError("INVALID_STOCK_QUANTITY", { field: "quantity" });
		}
		return {
			movementType: "purchase",
			quantityDelta: operation.quantity,
			stockBefore: currentStock,
			stockAfter,
		};
	}

	if (operation.kind === "reconcile") {
		assertNonNegativeInteger(operation.countedQuantity, "countedQuantity");
		const quantityDelta = operation.countedQuantity - currentStock;
		if (quantityDelta === 0) {
			throw new InventoryError("NO_STOCK_CHANGE", { field: "countedQuantity" });
		}
		return {
			movementType: quantityDelta > 0 ? "adjustment_in" : "adjustment_out",
			quantityDelta,
			stockBefore: currentStock,
			stockAfter: operation.countedQuantity,
		};
	}

	assertPositiveInteger(operation.quantity);
	if (operation.quantity > currentStock) {
		throw new InventoryError("INSUFFICIENT_STOCK", { field: "quantity" });
	}
	return {
		movementType: operation.lossType === "other" ? "adjustment_out" : operation.lossType,
		quantityDelta: -operation.quantity,
		stockBefore: currentStock,
		stockAfter: currentStock - operation.quantity,
	};
}
