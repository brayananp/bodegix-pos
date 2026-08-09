import { formOptions } from "@tanstack/react-form";
import { voidSaleFormSchema } from "./void-sale-form.schema";
import type { VoidSaleFormValues } from "./void-sale-form.types";

export const voidSaleDefaultValues: VoidSaleFormValues = {
	reasonPreset: "",
	reasonDetails: "",
	paymentReversals: [],
};

export const voidSaleFormOptions = formOptions({
	defaultValues: voidSaleDefaultValues,
	validators: { onSubmit: voidSaleFormSchema },
});
