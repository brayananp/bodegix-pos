import type { SelectFieldOption } from "@/shared/ui/forms";
import { formOptions } from "@tanstack/react-form";
import type { PaymentMethod } from "../../../domain";
import { getMethodLabel } from "./checkout-form.mappers";
import { saleCheckoutFormSchema } from "./checkout-form.schema";
import type { SaleCheckoutFormValues } from "./checkout-form.types";

export const checkoutDefaultValues: SaleCheckoutFormValues = {
	payments: [],
};

export const checkoutFormOptions = formOptions({
	defaultValues: checkoutDefaultValues,
	validators: { onSubmit: saleCheckoutFormSchema },
});

export const PAYMENT_METHOD_OPTIONS: SelectFieldOption[] = (
	["cash", "yape", "plin", "card", "bank_transfer"] as PaymentMethod[]
).map((method) => ({
	value: method,
	label: getMethodLabel(method),
}));
