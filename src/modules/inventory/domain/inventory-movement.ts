export type InventoryMovementType =
	| "initial_stock"
	| "purchase"
	| "sale"
	| "sale_void"
	| "adjustment_in"
	| "adjustment_out"
	| "damaged"
	| "expired";

export type InventoryReferenceType = "sale" | "manual" | "setup";

export interface InventoryMovement {
	id: string;
	productId: string;
	type: InventoryMovementType;
	quantityDelta: number;
	stockBefore: number;
	stockAfter: number;
	referenceType: InventoryReferenceType;
	referenceId: string | null;
	reason: string | null;
	createdAt: number;
}
