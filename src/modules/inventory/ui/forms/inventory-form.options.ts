import { formOptions } from "@tanstack/react-form";
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

export const initialStockDefaultValues: InitialStockFormValues = { quantity: "", note: "" };
export const stockEntryDefaultValues: StockEntryFormValues = {
	quantity: "",
	reference: "",
	note: "",
};
export const stockReconciliationDefaultValues: StockReconciliationFormValues = {
	countedQuantity: "",
	reason: "",
};
export const stockLossDefaultValues: StockLossFormValues = {
	quantity: "",
	lossType: "damaged",
	reason: "",
};

export const initialStockFormOptions = formOptions({
	defaultValues: initialStockDefaultValues,
	validators: { onSubmit: initialStockFormSchema },
});
export const stockEntryFormOptions = formOptions({
	defaultValues: stockEntryDefaultValues,
	validators: { onSubmit: stockEntryFormSchema },
});
export const stockReconciliationFormOptions = formOptions({
	defaultValues: stockReconciliationDefaultValues,
	validators: { onSubmit: stockReconciliationFormSchema },
});
export const stockLossFormOptions = formOptions({
	defaultValues: stockLossDefaultValues,
	validators: { onSubmit: stockLossFormSchema },
});
