import { FieldGroup } from "@/shared/components/ui/field";
import { useAppForm, withForm } from "@/shared/ui/forms";
import { useState } from "react";
import { toast } from "sonner";
import { openCashSession, type CashUnitOfWork } from "../../application";
import type { CashSession } from "../../domain";
import { getCashUnitOfWork } from "../../infrastructure";
import { openCashFormValuesToInput } from "./cash-form.mappers";
import { openCashFormOptions } from "./cash-form.options";
import { openCashFormSchema } from "./cash-form.schemas";
import { cashFormErrorMessage, setCashFieldError } from "./form-errors";

const OpenCashFields = withForm({
	...openCashFormOptions,
	props: {},
	render: function Render({ form }) {
		return (
			<FieldGroup>
				<form.AppField
					name="openingCash"
					validators={{ onBlur: openCashFormSchema.shape.openingCash }}
				>
					{(field) => (
						<field.MoneyField
							label="Efectivo inicial"
							description="El sencillo disponible al iniciar la jornada. Puede ser S/ 0.00."
							autoFocus
							placeholder="0.00"
						/>
					)}
				</form.AppField>
			</FieldGroup>
		);
	},
});

export function OpenCashForm({
	onCancel,
	onSuccess,
	unitOfWork,
}: {
	onCancel(): void;
	onSuccess(session: CashSession): void | Promise<void>;
	unitOfWork?: CashUnitOfWork;
}) {
	const [formError, setFormError] = useState<string | null>(null);
	const form = useAppForm({
		...openCashFormOptions,
		onSubmit: async ({ value }) => {
			setFormError(null);
			try {
				const session = await openCashSession(
					unitOfWork ?? getCashUnitOfWork(),
					openCashFormValuesToInput(value),
				);
				form.reset(value);
				toast.success("Caja abierta");
				await onSuccess(session);
			} catch (error) {
				if (!setCashFieldError(form, error)) setFormError(cashFormErrorMessage(error));
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
				<div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-0">
					<OpenCashFields form={form} />
					<div className="mt-5">
						<form.FormError message={formError} />
					</div>
				</div>
				<div className="border-t px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:border-0 sm:px-0 sm:pb-0">
					<div className="mb-2 min-h-4">
						<form.DirtyStateIndicator />
					</div>
					<form.FormActions
						onCancel={onCancel}
						submitLabel="Abrir caja"
						submittingLabel="Abriendo…"
					/>
				</div>
				<form.UnsavedChangesGuard />
			</form.AppForm>
		</form>
	);
}
