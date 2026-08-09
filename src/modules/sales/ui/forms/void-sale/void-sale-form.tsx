import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";
import { FieldGroup } from "@/shared/components/ui/field";
import { formatMoney } from "@/shared/kernel/money";
import { useAppForm, withForm } from "@/shared/ui/forms";
import { useState } from "react";
import type { SaleDetail, VoidSaleResult } from "../../../application";
import { voidSale } from "../../../application";
import { isSaleError } from "../../../domain";
import { getVoidSaleUnitOfWork } from "../../../infrastructure";
import { PAYMENT_METHOD_LABELS } from "../../sales-format";
import { PaymentReversalFields } from "./payment-reversal-fields";
import { createVoidSaleFormValues, voidSaleFormValuesToInput } from "./void-sale-form.mappers";
import { voidSaleFormOptions } from "./void-sale-form.options";

const REASON_OPTIONS = [
	{ value: "", label: "Selecciona un motivo" },
	{ value: "Error al cobrar", label: "Error al cobrar" },
	{ value: "Producto equivocado", label: "Producto equivocado" },
	{ value: "Cantidad equivocada", label: "Cantidad equivocada" },
	{ value: "Pago no recibido", label: "Pago no recibido" },
	{ value: "Cliente canceló", label: "Cliente canceló" },
	{ value: "Otro", label: "Otro" },
];

const VoidSaleFields = withForm({
	...voidSaleFormOptions,
	props: { sale: null as SaleDetail | null },
	render: function VoidSaleFieldsRender({ form, sale }) {
		if (!sale) return null;
		const unitCount = sale.items.reduce((sum, item) => sum + item.quantity, 0);
		const cashCents = sale.payments
			.filter(({ method }) => method === "cash")
			.reduce((sum, payment) => sum + payment.amountCents, 0);
		return (
			<div className="space-y-5">
				<FieldGroup className="gap-4">
					<form.AppField name="reasonPreset">
						{(field) => <field.SelectField label="Motivo de anulación" options={REASON_OPTIONS} />}
					</form.AppField>
					<form.Subscribe selector={(state) => state.values.reasonPreset}>
						{(preset) =>
							preset === "Otro" ? (
								<form.AppField name="reasonDetails">
									{(field) => (
										<field.TextareaField
											label="Describe el motivo"
											placeholder="Explica por qué se anula la venta"
											maxLength={240}
										/>
									)}
								</form.AppField>
							) : null
						}
					</form.Subscribe>
				</FieldGroup>

				<div className="space-y-3">
					<div>
						<h3 className="text-sm font-semibold">Devolución de pagos</h3>
						<p className="text-xs text-muted-foreground">
							Confirma manualmente cada pago original. Los importes y métodos no se pueden editar.
						</p>
					</div>
					<form.Subscribe selector={(state) => state.values.paymentReversals}>
						{(reversals) =>
							reversals.map((reversal, index) => (
								<PaymentReversalFields
									key={reversal.paymentId}
									form={form}
									fields={`paymentReversals[${index}]`}
									index={index}
								/>
							))
						}
					</form.Subscribe>
				</div>

				<Alert variant="destructive">
					<AlertTitle>Esta acción no puede deshacerse</AlertTitle>
					<AlertDescription>
						<ul className="mt-2 list-disc space-y-1 pl-4">
							<li>Anulará la venta {sale.formattedSaleNumber}.</li>
							<li>Devolverá {unitCount} unidades al inventario.</li>
							{cashCents > 0 && <li>Reducirá el efectivo esperado en {formatMoney(cashCents)}.</li>}
							{sale.payments
								.filter(({ method }) => method !== "cash")
								.map((payment) => (
									<li key={payment.id}>
										Marcará {formatMoney(payment.amountCents)} de{" "}
										{PAYMENT_METHOD_LABELS[payment.method]} como devuelto.
									</li>
								))}
						</ul>
					</AlertDescription>
				</Alert>
			</div>
		);
	},
});

export function VoidSaleForm({
	sale,
	onCancel,
	onSuccess,
}: {
	sale: SaleDetail;
	onCancel(): void;
	onSuccess(result: VoidSaleResult): void;
}) {
	const [formError, setFormError] = useState<string | null>(null);
	const form = useAppForm({
		...voidSaleFormOptions,
		defaultValues: createVoidSaleFormValues(sale),
		onSubmit: async ({ value }) => {
			setFormError(null);
			try {
				const result = await voidSale(
					getVoidSaleUnitOfWork(),
					voidSaleFormValuesToInput(sale.id, value),
				);
				form.reset(value);
				onSuccess(result);
			} catch (error) {
				setFormError(
					isSaleError(error)
						? error.message
						: "No se pudo completar la anulación. Intenta nuevamente.",
				);
			}
		},
	});

	return (
		<form
			className="flex min-h-0 flex-1 flex-col"
			onSubmit={(event) => {
				event.preventDefault();
				void form.handleSubmit();
			}}
		>
			<form.AppForm>
				<div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-6">
					<VoidSaleFields form={form} sale={sale} />
					<div className="mt-4">
						<form.FormError message={formError} />
					</div>
				</div>
				<div className="shrink-0 border-t bg-background px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:px-6">
					<div className="mb-2 min-h-4">
						<form.DirtyStateIndicator />
					</div>
					<form.FormActions
						onCancel={onCancel}
						submitLabel="Anular venta y restaurar stock"
						submittingLabel="Anulando venta…"
					/>
				</div>
				<form.UnsavedChangesGuard />
			</form.AppForm>
		</form>
	);
}
