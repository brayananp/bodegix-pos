import { formOptions } from "@tanstack/react-form";
import type {
	CashMovementFormValues,
	CloseCashFormValues,
	OpenCashFormValues,
} from "./cash-form.types";
import {
	cashMovementFormSchema,
	closeCashFormSchema,
	openCashFormSchema,
} from "./cash-form.schemas";

export const openCashDefaultValues: OpenCashFormValues = { openingCash: "" };
export const cashMovementDefaultValues: CashMovementFormValues = { amount: "", reason: "" };
export const closeCashDefaultValues: CloseCashFormValues = { countedCash: "" };

export const openCashFormOptions = formOptions({
	defaultValues: openCashDefaultValues,
	validators: { onSubmit: openCashFormSchema },
});
export const cashMovementFormOptions = formOptions({
	defaultValues: cashMovementDefaultValues,
	validators: { onSubmit: cashMovementFormSchema },
});
export const closeCashFormOptions = formOptions({
	defaultValues: closeCashDefaultValues,
	validators: { onSubmit: closeCashFormSchema },
});
