import type { StockLossType } from "../../domain";
import type { InventoryMutationResult, InventoryUnitOfWork } from "../ports/inventory-unit-of-work";

export interface InitializeProductStockInput {
	productId: string;
	quantity: number;
	note: string | null;
}

export interface RegisterStockEntryInput {
	productId: string;
	quantity: number;
	reference: string | null;
	note: string | null;
}

export interface ReconcileProductStockInput {
	productId: string;
	countedQuantity: number;
	reason: string;
}

export interface RegisterStockLossInput {
	productId: string;
	quantity: number;
	lossType: StockLossType;
	reason: string | null;
}

export function initializeProductStock(
	unitOfWork: InventoryUnitOfWork,
	input: InitializeProductStockInput,
): Promise<InventoryMutationResult> {
	return unitOfWork.applyStockMutation({ kind: "initial", ...input });
}

export function registerStockEntry(
	unitOfWork: InventoryUnitOfWork,
	input: RegisterStockEntryInput,
): Promise<InventoryMutationResult> {
	return unitOfWork.applyStockMutation({ kind: "entry", ...input });
}

export function reconcileProductStock(
	unitOfWork: InventoryUnitOfWork,
	input: ReconcileProductStockInput,
): Promise<InventoryMutationResult> {
	return unitOfWork.applyStockMutation({ kind: "reconcile", ...input });
}

export function registerStockLoss(
	unitOfWork: InventoryUnitOfWork,
	input: RegisterStockLossInput,
): Promise<InventoryMutationResult> {
	return unitOfWork.applyStockMutation({ kind: "loss", ...input });
}
