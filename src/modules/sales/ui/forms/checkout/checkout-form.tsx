import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Separator } from "@/shared/components/ui/separator";
import { createId } from "@/shared/kernel/ids";
import { formatMoney, moneyCentsToInput } from "@/shared/kernel/money";
import { useAppForm } from "@/shared/ui/forms";
import { useOperationBlocker } from "@/shared/ui/operation-safety/use-operation-blocker";
import type { CompletedSaleResult } from "../../../application";
import type { PaymentMethod } from "../../../domain";
import {
	calculateRemainingCents,
	checkoutValuesToPaymentIntents,
	createDefaultCheckoutValues,
} from "./checkout-form.mappers";
import { checkoutFormOptions, PAYMENT_METHOD_OPTIONS } from "./checkout-form.options";
import { validateCheckoutPaymentTotal } from "./checkout-form.schema";
import type { CheckoutPaymentFormValue, SaleCheckoutFormValues } from "./checkout-form.types";
import { PaymentAllocationFields } from "./payment-allocation-fields";

interface CheckoutFormProps {
	totalCents: number;
	onComplete(result: CompletedSaleResult): void;
	onCancel(): void;
	onSubmit(
		intents: ReturnType<typeof checkoutValuesToPaymentIntents>,
	): Promise<CompletedSaleResult>;
}

export function CheckoutForm({ totalCents, onComplete, onCancel, onSubmit }: CheckoutFormProps) {
	const [formError, setFormError] = useState<string | null>(null);
	const [isCompleting, setIsCompleting] = useState(false);
	useOperationBlocker("checkout_in_progress", isCompleting);

	const form = useAppForm({
		...checkoutFormOptions,
		defaultValues: createDefaultCheckoutValues(totalCents),
		onSubmit: async ({ value }: { value: SaleCheckoutFormValues }) => {
			setFormError(null);
			const totalError = validateCheckoutPaymentTotal(value, totalCents);
			if (totalError) {
				setFormError(totalError);
				return;
			}
			try {
				setIsCompleting(true);
				const intents = checkoutValuesToPaymentIntents(value);
				const result = await onSubmit(intents);
				form.reset(value);
				onComplete(result);
			} catch (error) {
				setFormError(error instanceof Error ? error.message : "No se pudo completar la venta.");
			} finally {
				setIsCompleting(false);
			}
		},
	});

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				void form.handleSubmit();
			}}
			className="flex flex-col gap-4"
			aria-label="Formulario de cobro"
			noValidate
		>
			<div className="rounded-lg border bg-muted/30 px-4 py-3 flex items-center justify-between">
				<span className="text-sm text-muted-foreground">Total a cobrar</span>
				<span className="text-lg font-semibold">{formatMoney(totalCents)}</span>
			</div>

			<form.Field name="payments" mode="array">
				{(field) => (
					<form.Subscribe selector={(state) => state.values.payments}>
						{(paymentValues) => {
							const payments = paymentValues as CheckoutPaymentFormValue[];
							const remainingCents = calculateRemainingCents(totalCents, payments);
							const usedMethods = new Set(payments.map((payment) => payment.method));

							return (
								<div className="flex flex-col gap-3">
									{payments.map((payment, index) => (
										<PaymentAllocationFields
											key={payment.key}
											form={form}
											fields={`payments[${index}]`}
											index={index}
											totalCents={totalCents}
											canRemove={payments.length > 1}
											onRemove={() => field.removeValue(index)}
											methodOptions={PAYMENT_METHOD_OPTIONS.filter(
												(option) =>
													option.value === payment.method ||
													!usedMethods.has(option.value as PaymentMethod),
											)}
										/>
									))}

									{remainingCents !== 0 && (
										<output
											className={`block text-sm ${remainingCents > 0 ? "text-destructive" : "text-amber-600"}`}
											aria-live="polite"
										>
											{remainingCents > 0
												? `Pendiente: ${formatMoney(remainingCents)}`
												: `Excedente: ${formatMoney(Math.abs(remainingCents))}. Elimina un pago o ajusta los importes.`}
										</output>
									)}
									{remainingCents === 0 && payments.length > 0 && (
										<output className="block text-sm text-muted-foreground" aria-live="polite">
											Total cubierto ✓
										</output>
									)}

									{remainingCents > 0 && payments.length < 5 && (
										<Button
											type="button"
											variant="outline"
											size="sm"
											className="w-full"
											onClick={() => {
												const available = (
													["cash", "yape", "plin", "card", "bank_transfer"] as PaymentMethod[]
												).find((m) => !usedMethods.has(m));
												if (!available) return;
												const suggestedAmount = moneyCentsToInput(remainingCents);
												field.pushValue({
													key: createId(),
													method: available,
													amount: suggestedAmount,
													cashReceived: suggestedAmount,
													operationReference: "",
													manuallyVerified: false,
												});
											}}
										>
											+ Agregar método de pago
										</Button>
									)}
								</div>
							);
						}}
					</form.Subscribe>
				)}
			</form.Field>

			<Separator />

			<form.AppForm>
				<form.FormError message={formError} />
				<div className="flex gap-2">
					<Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
						Cancelar
					</Button>
					<form.SubmitButton
						label="Confirmar venta"
						submittingLabel="Procesando…"
						className="flex-1"
					/>
				</div>
				<form.UnsavedChangesGuard />
			</form.AppForm>
		</form>
	);
}
