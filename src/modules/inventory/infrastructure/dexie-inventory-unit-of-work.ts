import Dexie from "dexie";
import type { BodegixDatabase } from "@/shared/infrastructure/local-db";
import { nowTimestamp } from "@/shared/kernel/dates";
import { createId } from "@/shared/kernel/ids";
import type {
	InventoryMutationIntent,
	InventoryMutationResult,
	InventoryUnitOfWork,
} from "../application";
import {
	calculateInventoryTransition,
	InventoryError,
	isInventoryError,
	type InventoryOperation,
} from "../domain";

interface InventoryDependencies {
	createId(): string;
	now(): number;
}

const defaultDependencies: InventoryDependencies = { createId, now: nowTimestamp };

function optionalText(value: string | null, maximum: number, field: string): string | null {
	const normalized = value?.trim() ?? "";
	if (normalized.length > maximum) throw new InventoryError("INVALID_MOVEMENT_NOTE", { field });
	return normalized || null;
}

function requiredReason(value: string, field = "reason"): string {
	const normalized = value.trim();
	if (normalized.length < 3 || normalized.length > 240) {
		throw new InventoryError("INVALID_LOSS_REASON", { field });
	}
	return normalized;
}

export class DexieInventoryUnitOfWork implements InventoryUnitOfWork {
	constructor(
		private readonly database: BodegixDatabase,
		private readonly dependencies: InventoryDependencies = defaultDependencies,
	) {}

	async applyStockMutation(intent: InventoryMutationIntent): Promise<InventoryMutationResult> {
		try {
			return await this.database.transaction(
				"rw",
				[this.database.products, this.database.inventoryMovements],
				async () => {
					const product = await this.database.products.get(intent.productId);
					if (!product) throw new InventoryError("PRODUCT_NOT_FOUND");
					const latestMovement = await this.database.inventoryMovements
						.where("[productId+createdAt]")
						.between([product.id, Dexie.minKey], [product.id, Dexie.maxKey])
						.last();

					if ((intent.kind === "initial" || intent.kind === "entry") && !product.isActive) {
						throw new InventoryError("PRODUCT_INACTIVE_FOR_STOCK_ENTRY");
					}
					if (intent.kind === "initial") {
						const previousMovements = await this.database.inventoryMovements
							.where("productId")
							.equals(product.id)
							.count();
						if (previousMovements > 0) {
							throw new InventoryError("INITIAL_STOCK_ALREADY_REGISTERED");
						}
						if (product.stockQuantity !== 0) {
							throw new InventoryError("INITIAL_STOCK_REQUIRES_ZERO_STOCK");
						}
					}

					const operation = this.toOperation(intent);
					const transition = calculateInventoryTransition(product.stockQuantity, operation);
					const timestamp = Math.max(
						this.dependencies.now(),
						(latestMovement?.createdAt ?? -1) + 1,
					);
					const movement = {
						id: this.dependencies.createId(),
						productId: product.id,
						type: transition.movementType,
						quantityDelta: transition.quantityDelta,
						stockBefore: transition.stockBefore,
						stockAfter: transition.stockAfter,
						referenceType: intent.kind === "initial" ? ("setup" as const) : ("manual" as const),
						referenceId:
							intent.kind === "entry" ? optionalText(intent.reference, 80, "reference") : null,
						reason: this.movementReason(intent),
						createdAt: timestamp,
					};

					await this.database.products.update(product.id, {
						stockQuantity: transition.stockAfter,
						updatedAt: timestamp,
					});
					await this.database.inventoryMovements.add(movement);
					return {
						productId: product.id,
						stockQuantity: transition.stockAfter,
						updatedAt: timestamp,
						movement,
					};
				},
			);
		} catch (error) {
			if (isInventoryError(error)) throw error;
			throw new InventoryError("INVENTORY_PERSISTENCE_FAILED", { cause: error });
		}
	}

	private toOperation(intent: InventoryMutationIntent): InventoryOperation {
		if (intent.kind === "initial") return { kind: "initial", quantity: intent.quantity };
		if (intent.kind === "entry") return { kind: "entry", quantity: intent.quantity };
		if (intent.kind === "reconcile") {
			return { kind: "reconcile", countedQuantity: intent.countedQuantity };
		}
		return { kind: "loss", quantity: intent.quantity, lossType: intent.lossType };
	}

	private movementReason(intent: InventoryMutationIntent): string | null {
		if (intent.kind === "reconcile") return requiredReason(intent.reason);
		if (intent.kind === "loss") {
			return intent.lossType === "other"
				? requiredReason(intent.reason ?? "")
				: optionalText(intent.reason, 240, "reason");
		}
		return optionalText(intent.note, 240, "note");
	}
}
