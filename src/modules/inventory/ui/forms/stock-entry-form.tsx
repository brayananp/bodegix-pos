import { FieldGroup } from "@/shared/components/ui/field";
import { useAppForm, withForm } from "@/shared/ui/forms";
import { useState } from "react";
import { toast } from "sonner";
import {
	type InventoryMutationResult,
	type InventoryUnitOfWork,
	registerStockEntry,
} from "../../application";
import { isInventoryError } from "../../domain";
import { getInventoryUnitOfWork } from "../../infrastructure";
import { StockTransitionPreview } from "../components/stock-transition-preview";
import { stockEntryFormValuesToInput } from "./inventory-form.mappers";
import { stockEntryFormOptions } from "./inventory-form.options";
import { stockEntryFormSchema } from "./inventory-form.schemas";

const StockEntryFields = withForm({
	...stockEntryFormOptions,
	props: { currentStock: 0 },
	render: function Render({ form, currentStock }) {
		return (
			<FieldGroup className="gap-5">
				<form.AppField name="quantity" validators={{ onBlur: stockEntryFormSchema.shape.quantity }}>
					{(field) => <field.IntegerField label="Cantidad recibida" minimum={1} autoFocus />}
				</form.AppField>
				<form.Subscribe selector={(state) => state.values.quantity}>
					{(value) => {
						const quantity = /^\d+$/.test(value) ? Number(value) : null;
						return (
							<StockTransitionPreview
								label="Vista previa de entrada"
								currentStock={currentStock}
								quantityDelta={quantity}
								stockAfter={quantity === null ? null : currentStock + quantity}
							/>
						);
					}}
				</form.Subscribe>
				<form.AppField
					name="reference"
					validators={{ onBlur: stockEntryFormSchema.shape.reference }}
				>
					{(field) => (
						<field.TextField
							label="Referencia"
							description="Opcional. Por ejemplo, número de comprobante."
							maxLength={80}
						/>
					)}
				</form.AppField>
				<form.AppField name="note" validators={{ onBlur: stockEntryFormSchema.shape.note }}>
					{(field) => <field.TextareaField label="Nota" maxLength={240} rows={3} />}
				</form.AppField>
			</FieldGroup>
		);
	},
});

interface StockEntryFormProps {
	productId: string;
	currentStock: number;
	onCancel(): void;
	onSuccess(result: InventoryMutationResult): void | Promise<void>;
	unitOfWork?: InventoryUnitOfWork;
}

export function StockEntryForm({
	productId,
	currentStock,
	onCancel,
	onSuccess,
	unitOfWork,
}: StockEntryFormProps) {
	const [formError, setFormError] = useState<string | null>(null);
	const form = useAppForm({
		...stockEntryFormOptions,
		onSubmit: async ({ value }) => {
			setFormError(null);
			try {
				const result = await registerStockEntry(
					unitOfWork ?? getInventoryUnitOfWork(),
					stockEntryFormValuesToInput(productId, value),
				);
				form.reset(value);
				toast.success("Entrada registrada");
				await onSuccess(result);
			} catch (error) {
				if (isInventoryError(error) && error.field === "quantity") {
					form.setFieldMeta("quantity", (meta) => ({
						...meta,
						isTouched: true,
						errorMap: { ...meta.errorMap, onSubmit: error.message },
					}));
					return;
				}
				setFormError(isInventoryError(error) ? error.message : "No se pudo registrar la entrada.");
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
					<StockEntryFields form={form} currentStock={currentStock} />
					<div className="mt-5">
						<form.FormError message={formError} />
					</div>
				</div>
				<footer className="shrink-0 border-t bg-popover px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:px-6">
					<form.FormActions onCancel={onCancel} submitLabel="Registrar entrada" />
				</footer>
				<form.UnsavedChangesGuard />
			</form.AppForm>
		</form>
	);
}
