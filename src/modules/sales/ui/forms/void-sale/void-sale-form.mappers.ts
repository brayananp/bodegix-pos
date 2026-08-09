import type { SaleDetail, VoidSaleInput } from "../../../application";
import type { VoidSaleFormValues } from "./void-sale-form.types";

export function createVoidSaleFormValues(sale: SaleDetail): VoidSaleFormValues {
	return {
		reasonPreset: "",
		reasonDetails: "",
		paymentReversals: sale.payments.map((payment) => ({
			paymentId: payment.id,
			method: payment.method,
			amountCents: payment.amountCents,
			confirmed: false,
			reversalReference: "",
		})),
	};
}

export function voidSaleFormValuesToInput(
	saleId: string,
	values: VoidSaleFormValues,
): VoidSaleInput {
	return {
		saleId,
		reason: values.reasonPreset === "Otro" ? values.reasonDetails.trim() : values.reasonPreset,
		paymentReversals: values.paymentReversals.map((reversal) => ({
			paymentId: reversal.paymentId,
			confirmed: reversal.confirmed,
			reversalReference: reversal.reversalReference.trim() || null,
		})),
	};
}
