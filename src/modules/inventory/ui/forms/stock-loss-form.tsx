import { FieldGroup } from "@/shared/components/ui/field";
import { useAppForm, withForm } from "@/shared/ui/forms";
import { useState } from "react";
import { toast } from "sonner";
import {
	type InventoryMutationResult,
	type InventoryUnitOfWork,
	registerStockLoss,
} from "../../application";
import { isInventoryError } from "../../domain";
import { getInventoryUnitOfWork } from "../../infrastructure";
import { StockTransitionPreview } from "../components/stock-transition-preview";
import { stockLossFormValuesToInput } from "./inventory-form.mappers";
import { stockLossFormOptions } from "./inventory-form.options";
import { positiveQuantitySchema } from "./inventory-form.schemas";

const lossTypeOptions = [
	{ value: "damaged", label: "Dañado" },
	{ value: "expired", label: "Vencido" },
	{ value: "other", label: "Otra pérdida" },
];

const StockLossFields = withForm({
	...stockLossFormOptions,
	props: { currentStock: 0 },
	render: function Render({ form, currentStock }) {
		return (
			<FieldGroup className="gap-5">
				<form.AppField name="lossType">
					{(field) => (
						<field.SelectField
							label="Tipo de pérdida"
							emptyLabel="Selecciona un tipo"
							options={lossTypeOptions}
						/>
					)}
				</form.AppField>
				<form.AppField name="quantity" validators={{ onBlur: positiveQuantitySchema }}>
					{(field) => (
						<field.IntegerField
							label="Cantidad retirada"
							minimum={1}
							maximum={currentStock}
							autoFocus
						/>
					)}
				</form.AppField>
				<form.Subscribe selector={(state) => state.values.quantity}>
					{(value) => {
						const quantity = /^\d+$/.test(value) ? Number(value) : null;
						const stockAfter = quantity === null ? null : currentStock - quantity;
						return (
							<StockTransitionPreview
								label="Salida por pérdida"
								currentStock={currentStock}
								quantityDelta={quantity === null ? null : -quantity}
								stockAfter={stockAfter}
								warning={stockAfter === 0}
							/>
						);
					}}
				</form.Subscribe>
				<form.AppField name="reason">
					{(field) => (
						<field.TextareaField
							label="Motivo"
							description="Obligatorio para Otra pérdida; opcional para daño o vencimiento."
							maxLength={240}
							rows={3}
						/>
					)}
				</form.AppField>
			</FieldGroup>
		);
	},
});

interface StockLossFormProps {
	productId: string;
	currentStock: number;
	onCancel(): void;
	onSuccess(result: InventoryMutationResult): void | Promise<void>;
	unitOfWork?: InventoryUnitOfWork;
}

export function StockLossForm({
	productId,
	currentStock,
	onCancel,
	onSuccess,
	unitOfWork,
}: StockLossFormProps) {
	const [formError, setFormError] = useState<string | null>(null);
	const form = useAppForm({
		...stockLossFormOptions,
		onSubmit: async ({ value }) => {
			setFormError(null);
			try {
				const result = await registerStockLoss(
					unitOfWork ?? getInventoryUnitOfWork(),
					stockLossFormValuesToInput(productId, value),
				);
				form.reset(value);
				toast.success("Pérdida registrada");
				await onSuccess(result);
			} catch (error) {
				if (
					isInventoryError(error) &&
					(error.field === "quantity" || error.code === "INSUFFICIENT_STOCK")
				) {
					form.setFieldMeta("quantity", (meta) => ({
						...meta,
						isTouched: true,
						errorMap: { ...meta.errorMap, onSubmit: error.message },
					}));
					return;
				}
				if (
					isInventoryError(error) &&
					(error.field === "reason" || error.code === "INVALID_LOSS_REASON")
				) {
					form.setFieldMeta("reason", (meta) => ({
						...meta,
						isTouched: true,
						errorMap: { ...meta.errorMap, onSubmit: error.message },
					}));
					return;
				}
				setFormError(isInventoryError(error) ? error.message : "No se pudo registrar la pérdida.");
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
					<StockLossFields form={form} currentStock={currentStock} />
					<div className="mt-5">
						<form.FormError message={formError} />
					</div>
				</div>
				<footer className="shrink-0 border-t bg-popover px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:px-6">
					<form.FormActions onCancel={onCancel} submitLabel="Registrar pérdida" />
				</footer>
				<form.UnsavedChangesGuard />
			</form.AppForm>
		</form>
	);
}
