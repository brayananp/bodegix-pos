import { FieldGroup } from "@/shared/components/ui/field";
import { formatMoney } from "@/shared/kernel/money";
import { useAppForm, withForm } from "@/shared/ui/forms";
import { useState } from "react";
import { toast } from "sonner";
import { closeCashSession, type CashUnitOfWork } from "../../application";
import { calculateCashDifference, type CashSessionSummary } from "../../domain";
import { getCashUnitOfWork } from "../../infrastructure";
import { CashDifferenceDisplay } from "../components/cash-difference-display";
import { CashClosingBreakdown, CashPaymentBreakdown } from "../components/cash-summary";
import { closeCashFormValuesToInput, moneyPreview } from "./cash-form.mappers";
import { closeCashFormOptions } from "./cash-form.options";
import { closeCashFormSchema } from "./cash-form.schemas";
import { cashFormErrorMessage, setCashFieldError } from "./form-errors";

const CloseCashFields = withForm({
	...closeCashFormOptions,
	props: { summary: null as CashSessionSummary | null },
	render: function Render({ form, summary }) {
		if (!summary) return null;
		return (
			<div className="space-y-5">
				<CashClosingBreakdown summary={summary} />
				<CashPaymentBreakdown summary={summary} />
				<div className="grid grid-cols-2 gap-3 rounded-xl border bg-background p-4 text-sm">
					<div>
						<p className="text-muted-foreground">Ventas totales</p>
						<p className="mt-1 font-semibold tabular-nums">
							{formatMoney(summary.totalSalesCents)}
						</p>
					</div>
					<div>
						<p className="text-muted-foreground">Número de ventas</p>
						<p className="mt-1 font-semibold tabular-nums">{summary.completedSalesCount}</p>
					</div>
				</div>
				<FieldGroup>
					<form.AppField
						name="countedCash"
						validators={{ onBlur: closeCashFormSchema.shape.countedCash }}
					>
						{(field) => (
							<field.MoneyField
								label="Efectivo contado"
								description="Cuenta el efectivo físico. Una diferencia no impide cerrar."
								autoFocus
								placeholder="0.00"
							/>
						)}
					</form.AppField>
				</FieldGroup>
				<form.Subscribe selector={(state) => state.values.countedCash}>
					{(value) => {
						const counted = moneyPreview(value);
						return counted === null ? (
							<div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
								La diferencia aparecerá cuando ingreses el efectivo contado.
							</div>
						) : (
							<CashDifferenceDisplay
								differenceCents={calculateCashDifference(summary.expectedCashCents, counted)}
							/>
						);
					}}
				</form.Subscribe>
			</div>
		);
	},
});

export function CloseCashForm({
	summary,
	onCancel,
	onSuccess,
	unitOfWork,
}: {
	summary: CashSessionSummary;
	onCancel(): void;
	onSuccess(summary: CashSessionSummary): void | Promise<void>;
	unitOfWork?: CashUnitOfWork;
}) {
	const [formError, setFormError] = useState<string | null>(null);
	const form = useAppForm({
		...closeCashFormOptions,
		onSubmit: async ({ value }) => {
			setFormError(null);
			try {
				const closed = await closeCashSession(
					unitOfWork ?? getCashUnitOfWork(),
					closeCashFormValuesToInput(summary.sessionId, value),
				);
				form.reset(value);
				toast.success("Caja cerrada");
				await onSuccess(closed);
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
				<div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-6">
					<CloseCashFields form={form} summary={summary} />
					<div className="mt-5">
						<form.FormError message={formError} />
					</div>
				</div>
				<footer className="shrink-0 border-t bg-popover px-4 pt-3 pb-[max(.75rem,env(safe-area-inset-bottom))] md:px-6">
					<div className="mb-2 min-h-4">
						<form.DirtyStateIndicator />
					</div>
					<form.FormActions
						onCancel={onCancel}
						submitLabel="Confirmar cierre"
						submittingLabel="Cerrando…"
					/>
				</footer>
				<form.UnsavedChangesGuard />
			</form.AppForm>
		</form>
	);
}
