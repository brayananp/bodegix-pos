import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";
import { FieldGroup } from "@/shared/components/ui/field";
import { useAppForm, withForm } from "@/shared/ui/forms";
import { useState } from "react";
import { toast } from "sonner";
import {
	type InventoryMutationResult,
	type InventoryUnitOfWork,
	initializeProductStock,
} from "../../application";
import { isInventoryError } from "../../domain";
import { getInventoryUnitOfWork } from "../../infrastructure";
import { initialStockFormValuesToInput } from "./inventory-form.mappers";
import { initialStockFormOptions } from "./inventory-form.options";
import { initialStockFormSchema } from "./inventory-form.schemas";

const InitialStockFields = withForm({
	...initialStockFormOptions,
	props: { currentStock: 0 },
	render: function Render({ form, currentStock }) {
		return (
			<FieldGroup className="gap-5">
				<Alert>
					<AlertTitle>Registro único</AlertTitle>
					<AlertDescription>
						El saldo actual es {currentStock}. Después de guardar, cualquier corrección se realiza
						mediante un conteo físico.
					</AlertDescription>
				</Alert>
				<form.AppField
					name="quantity"
					validators={{ onBlur: initialStockFormSchema.shape.quantity }}
				>
					{(field) => <field.IntegerField label="Cantidad inicial" minimum={1} autoFocus />}
				</form.AppField>
				<form.AppField name="note" validators={{ onBlur: initialStockFormSchema.shape.note }}>
					{(field) => (
						<field.TextareaField
							label="Nota"
							description="Opcional. Describe el conteo de apertura."
							maxLength={240}
							rows={3}
						/>
					)}
				</form.AppField>
			</FieldGroup>
		);
	},
});

interface InitialStockFormProps {
	productId: string;
	currentStock: number;
	onCancel(): void;
	onSuccess(result: InventoryMutationResult): void | Promise<void>;
	unitOfWork?: InventoryUnitOfWork;
}

export function InitialStockForm({
	productId,
	currentStock,
	onCancel,
	onSuccess,
	unitOfWork,
}: InitialStockFormProps) {
	const [formError, setFormError] = useState<string | null>(null);
	const form = useAppForm({
		...initialStockFormOptions,
		onSubmit: async ({ value }) => {
			setFormError(null);
			try {
				const result = await initializeProductStock(
					unitOfWork ?? getInventoryUnitOfWork(),
					initialStockFormValuesToInput(productId, value),
				);
				form.reset(value);
				toast.success("Stock inicial registrado");
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
				setFormError(isInventoryError(error) ? error.message : "No se pudo registrar el stock.");
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
					<InitialStockFields form={form} currentStock={currentStock} />
					<div className="mt-5">
						<form.FormError message={formError} />
					</div>
				</div>
				<footer className="shrink-0 border-t bg-popover px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:px-6">
					<form.FormActions onCancel={onCancel} submitLabel="Registrar stock inicial" />
				</footer>
				<form.UnsavedChangesGuard />
			</form.AppForm>
		</form>
	);
}
