import { FieldGroup } from "@/shared/components/ui/field";
import { useAppForm, withForm } from "@/shared/ui/forms";
import { useState } from "react";
import { toast } from "sonner";
import {
	reconcileProductStock,
	type InventoryMutationResult,
	type InventoryUnitOfWork,
} from "../../application";
import { isInventoryError } from "../../domain";
import { getInventoryUnitOfWork } from "../../infrastructure";
import { StockTransitionPreview } from "../components/stock-transition-preview";
import { stockReconciliationFormValuesToInput } from "./inventory-form.mappers";
import { stockReconciliationFormOptions } from "./inventory-form.options";
import { stockReconciliationFormSchema } from "./inventory-form.schemas";

const StockReconciliationFields = withForm({
	...stockReconciliationFormOptions,
	props: { currentStock: 0 },
	render: function Render({ form, currentStock }) {
		return (
			<FieldGroup className="gap-5">
				<form.AppField
					name="countedQuantity"
					validators={{ onBlur: stockReconciliationFormSchema.shape.countedQuantity }}
				>
					{(field) => <field.IntegerField label="Cantidad contada" minimum={0} autoFocus />}
				</form.AppField>
				<form.Subscribe selector={(state) => state.values.countedQuantity}>
					{(value) => {
						const counted = /^\d+$/.test(value) ? Number(value) : null;
						const delta = counted === null ? null : counted - currentStock;
						return (
							<StockTransitionPreview
								label={delta === 0 ? "Sin diferencia" : "Resultado del conteo"}
								currentStock={currentStock}
								quantityDelta={delta}
								stockAfter={counted}
							/>
						);
					}}
				</form.Subscribe>
				<form.AppField
					name="reason"
					validators={{ onBlur: stockReconciliationFormSchema.shape.reason }}
				>
					{(field) => (
						<field.TextareaField
							label="Motivo del conteo"
							description="Obligatorio. Explica por qué se realizó la conciliación."
							maxLength={240}
							rows={3}
						/>
					)}
				</form.AppField>
			</FieldGroup>
		);
	},
});

interface StockReconciliationFormProps {
	productId: string;
	currentStock: number;
	onCancel(): void;
	onSuccess(result: InventoryMutationResult): void | Promise<void>;
	unitOfWork?: InventoryUnitOfWork;
}

export function StockReconciliationForm({
	productId,
	currentStock,
	onCancel,
	onSuccess,
	unitOfWork,
}: StockReconciliationFormProps) {
	const [formError, setFormError] = useState<string | null>(null);
	const form = useAppForm({
		...stockReconciliationFormOptions,
		onSubmit: async ({ value }) => {
			setFormError(null);
			try {
				const result = await reconcileProductStock(
					unitOfWork ?? getInventoryUnitOfWork(),
					stockReconciliationFormValuesToInput(productId, value),
				);
				form.reset(value);
				toast.success("Inventario conciliado");
				await onSuccess(result);
			} catch (error) {
				if (
					isInventoryError(error) &&
					(error.field === "countedQuantity" || error.code === "NO_STOCK_CHANGE")
				) {
					form.setFieldMeta("countedQuantity", (meta) => ({
						...meta,
						isTouched: true,
						errorMap: { ...meta.errorMap, onSubmit: error.message },
					}));
					return;
				}
				setFormError(isInventoryError(error) ? error.message : "No se pudo conciliar el stock.");
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
					<StockReconciliationFields form={form} currentStock={currentStock} />
					<div className="mt-5">
						<form.FormError message={formError} />
					</div>
				</div>
				<footer className="shrink-0 border-t bg-popover px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:px-6">
					<form.Subscribe selector={(state) => state.values.countedQuantity}>
						{(value) => (
							<form.FormActions
								onCancel={onCancel}
								submitLabel="Aplicar conciliación"
								submitDisabled={/^\d+$/.test(value) && Number(value) === currentStock}
							/>
						)}
					</form.Subscribe>
				</footer>
				<form.UnsavedChangesGuard />
			</form.AppForm>
		</form>
	);
}
