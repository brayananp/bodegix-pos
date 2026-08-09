import { FieldGroup } from "@/shared/components/ui/field";
import { formatMoney } from "@/shared/kernel/money";
import { withFieldGroup } from "@/shared/ui/forms";
import { PAYMENT_METHOD_LABELS, paymentConfirmationLabel } from "../../sales-format";
import type { PaymentReversalFormValue } from "./void-sale-form.types";

const defaultValues: PaymentReversalFormValue = {
	paymentId: "",
	method: "cash",
	amountCents: 0,
	confirmed: false,
	reversalReference: "",
};

export const PaymentReversalFields = withFieldGroup({
	defaultValues,
	props: { index: 0 },
	render: function PaymentReversalFieldsRender({ group, index }) {
		return (
			<group.Subscribe selector={(state) => state.values}>
				{({ method, amountCents }) => {
					const amount = formatMoney(amountCents);
					return (
						<fieldset className="rounded-xl border bg-card p-4">
							<legend className="px-1 text-sm font-semibold">
								{PAYMENT_METHOD_LABELS[method]} · {amount}
							</legend>
							<FieldGroup className="gap-4">
								<group.AppField name="confirmed">
									{(field) => (
										<field.CheckboxField
											label={paymentConfirmationLabel(method, amount)}
											description="Esta confirmación es manual y no ejecuta un reembolso automático."
											id={`payment-reversal-${index}`}
										/>
									)}
								</group.AppField>
								{method !== "cash" && (
									<group.AppField name="reversalReference">
										{(field) => (
											<field.TextField
												label="Referencia de devolución (opcional)"
												placeholder="Número de operación"
												maxLength={80}
											/>
										)}
									</group.AppField>
								)}
							</FieldGroup>
						</fieldset>
					);
				}}
			</group.Subscribe>
		);
	},
});
