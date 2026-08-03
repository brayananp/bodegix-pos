export type StockLossType = "damaged" | "expired" | "other";

export type InventoryOperation =
	| { kind: "initial"; quantity: number }
	| { kind: "entry"; quantity: number }
	| { kind: "reconcile"; countedQuantity: number }
	| { kind: "loss"; quantity: number; lossType: StockLossType };
