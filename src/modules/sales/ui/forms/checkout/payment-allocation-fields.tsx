import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Field, FieldGroup } from "@/shared/components/ui/field";
import { moneyCentsToInput } from "@/shared/kernel/money";
import { type SelectFieldOption, withFieldGroup } from "@/shared/ui/forms";
import { calculateChangeCents, getMethodLabel } from "./checkout-form.mappers";
import { PAYMENT_METHOD_OPTIONS } from "./checkout-form.options";
import type { CheckoutPaymentFormValue } from "./checkout-form.types";

const paymentAllocationDefaultValues: CheckoutPaymentFormValue = {
	key: "",
	method: "cash",
	amount: "",
	cashReceived: "",
	operationReference: "",
	manuallyVerified: false,
};

interface PaymentAllocationProps {
	index: number;
	totalCents: number;
	onRemove(): void;
	canRemove: boolean;
	methodOptions: SelectFieldOption[];
}

export const PaymentAllocationFields = withFieldGroup({
	defaultValues: paymentAllocationDefaultValues,
	props: {
		index: 0,
		totalCents: 0,
		onRemove: () => {},
		canRemove: false,
		methodOptions: PAYMENT_METHOD_OPTIONS,
	} as PaymentAllocationProps,
	render: function PaymentAllocationRender({
		group,
		index,
		totalCents,
		onRemove,
		canRemove,
		methodOptions,
	}) {
		return (
			<group.Subscribe
				selector={(state) => ({
					method: state.values.method,
					amount: state.values.amount,
					cashReceived: state.values.cashReceived,
				})}
			>
				{({ method, amount, cashReceived }) => {
					const isCash = method === "cash";
					const changeCents = isCash
						? calculateChangeCents({
								key: "",
								method,
								amount,
								cashReceived,
								operationReference: "",
								manuallyVerified: false,
							})
						: 0;

					return (
						<div className="flex flex-col gap-3 rounded-lg border bg-card p-4">
							<div className="flex items-center justify-between gap-2">
								<span className="text-sm font-medium">
									Pago {index + 1} · {getMethodLabel(method)}
								</span>
								{canRemove && (
									<Button
										type="button"
										variant="ghost"
										size="xs"
										className="text-muted-foreground hover:text-destructive"
										onClick={onRemove}
										aria-label={`Eliminar pago ${index + 1}`}
									>
										Eliminar
									</Button>
								)}
							</div>

							<FieldGroup className="gap-3">
								<group.AppField name="method">
									{(field) => (
										<field.SelectField
											label="Método"
											options={methodOptions}
											aria-label="Método de pago"
										/>
									)}
								</group.AppField>

								<group.AppField name="amount">
									{(field) => (
										<field.MoneyField
											label="Importe"
											placeholder={moneyCentsToInput(totalCents)}
											aria-label={`Importe del pago ${index + 1}`}
										/>
									)}
								</group.AppField>

								{isCash && (
									<>
										<group.AppField name="cashReceived">
											{(field) => (
												<field.MoneyField
													label="Efectivo recibido"
													placeholder={amount || moneyCentsToInput(totalCents)}
													aria-label="Efectivo que entrega el cliente"
												/>
											)}
										</group.AppField>
										{changeCents > 0 && (
											<p className="text-sm text-muted-foreground">
												Vuelto:{" "}
												<span className="font-semibold text-foreground">
													S/ {moneyCentsToInput(changeCents)}
												</span>
											</p>
										)}
									</>
								)}

								{!isCash && (
									<group.AppField name="operationReference">
										{(field) => (
											<field.TextField
												label="Referencia de operación (opcional)"
												placeholder="Número de operación"
												maxLength={80}
												aria-label="Referencia de operación opcional"
											/>
										)}
									</group.AppField>
								)}

								{!isCash && (
									<group.AppField name="manuallyVerified">
										{(field) => (
											<Field>
												<div className="flex items-start gap-2">
													<Checkbox
														id={`verified-${index}`}
														checked={Boolean(field.state.value)}
														onCheckedChange={(checked) => field.handleChange(checked === true)}
														aria-label="Confirmar verificación manual"
													/>
													<label
														htmlFor={`verified-${index}`}
														className="text-sm leading-snug cursor-pointer"
													>
														Confirmo que verifiqué el pago en la aplicación o terminal oficial.
													</label>
												</div>
												{field.state.meta.isTouched && !field.state.value && (
													<p className="text-xs text-destructive mt-1" role="alert">
														Debes confirmar la verificación del pago.
													</p>
												)}
											</Field>
										)}
									</group.AppField>
								)}
							</FieldGroup>
						</div>
					);
				}}
			</group.Subscribe>
		);
	},
});
