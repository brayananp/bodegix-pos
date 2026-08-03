import type { InventoryMovement, StockLossType } from "../../domain";

export type InventoryMutationIntent =
	| { kind: "initial"; productId: string; quantity: number; note: string | null }
	| {
			kind: "entry";
			productId: string;
			quantity: number;
			reference: string | null;
			note: string | null;
	  }
	| { kind: "reconcile"; productId: string; countedQuantity: number; reason: string }
	| {
			kind: "loss";
			productId: string;
			quantity: number;
			lossType: StockLossType;
			reason: string | null;
	  };

export interface InventoryMutationResult {
	productId: string;
	stockQuantity: number;
	updatedAt: number;
	movement: InventoryMovement;
}

export interface InventoryUnitOfWork {
	applyStockMutation(intent: InventoryMutationIntent): Promise<InventoryMutationResult>;
}
