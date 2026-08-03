import type {
	InitializeProductStockInput,
	ReconcileProductStockInput,
	RegisterStockEntryInput,
	RegisterStockLossInput,
} from "../../application";
import { InventoryError } from "../../domain";
import {
	initialStockFormSchema,
	stockEntryFormSchema,
	stockLossFormSchema,
	stockReconciliationFormSchema,
} from "./inventory-form.schemas";
import type {
	InitialStockFormValues,
	StockEntryFormValues,
	StockLossFormValues,
	StockReconciliationFormValues,
} from "./inventory-form.types";

function integer(value: string, field: string): number {
	const parsed = Number(value);
	if (!Number.isSafeInteger(parsed)) {
		throw new InventoryError("INVALID_STOCK_QUANTITY", { field });
	}
	return parsed;
}

function optional(value: string): string | null {
	return value.trim() || null;
}

export function initialStockFormValuesToInput(
	productId: string,
	values: InitialStockFormValues,
): InitializeProductStockInput {
	const parsed = initialStockFormSchema.safeParse(values);
	if (!parsed.success) {
		throw new InventoryError("INVALID_STOCK_QUANTITY", { field: "quantity", cause: parsed.error });
	}
	return {
		productId,
		quantity: integer(parsed.data.quantity, "quantity"),
		note: optional(parsed.data.note),
	};
}

export function stockEntryFormValuesToInput(
	productId: string,
	values: StockEntryFormValues,
): RegisterStockEntryInput {
	const parsed = stockEntryFormSchema.safeParse(values);
	if (!parsed.success) {
		throw new InventoryError("INVALID_STOCK_QUANTITY", { field: "quantity", cause: parsed.error });
	}
	return {
		productId,
		quantity: integer(parsed.data.quantity, "quantity"),
		reference: optional(parsed.data.reference),
		note: optional(parsed.data.note),
	};
}

export function stockReconciliationFormValuesToInput(
	productId: string,
	values: StockReconciliationFormValues,
): ReconcileProductStockInput {
	const parsed = stockReconciliationFormSchema.safeParse(values);
	if (!parsed.success) {
		throw new InventoryError("INVALID_STOCK_QUANTITY", {
			field: "countedQuantity",
			cause: parsed.error,
		});
	}
	return {
		productId,
		countedQuantity: integer(parsed.data.countedQuantity, "countedQuantity"),
		reason: parsed.data.reason.trim(),
	};
}

export function stockLossFormValuesToInput(
	productId: string,
	values: StockLossFormValues,
): RegisterStockLossInput {
	const parsed = stockLossFormSchema.safeParse(values);
	if (!parsed.success) {
		const reasonIssue = parsed.error.issues.some(({ path }) => path[0] === "reason");
		throw new InventoryError(reasonIssue ? "INVALID_LOSS_REASON" : "INVALID_STOCK_QUANTITY", {
			field: reasonIssue ? "reason" : "quantity",
			cause: parsed.error,
		});
	}
	return {
		productId,
		quantity: integer(parsed.data.quantity, "quantity"),
		lossType: parsed.data.lossType,
		reason: optional(parsed.data.reason),
	};
}
