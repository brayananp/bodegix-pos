import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { FieldGroup } from "@/shared/components/ui/field";
import { formatMoney } from "@/shared/kernel/money";
import { useAppForm, withForm } from "@/shared/ui/forms";
import { useState } from "react";
import { toast } from "sonner";
import {
	registerCashDeposit,
	registerCashWithdrawal,
	type CashUnitOfWork,
} from "../../application";
import type { CashMovement } from "../../domain";
import { getCashUnitOfWork } from "../../infrastructure";
import { cashMovementFormValuesToInput, moneyPreview } from "./cash-form.mappers";
import { cashMovementFormOptions } from "./cash-form.options";
import { cashMovementFormSchema } from "./cash-form.schemas";
import type { CashMovementFormMode } from "./cash-form.types";
import { cashFormErrorMessage, setCashFieldError } from "./form-errors";

const CashMovementFields = withForm({
	...cashMovementFormOptions,
	props: { mode: "deposit" as CashMovementFormMode, currentExpectedCashCents: 0 },
	render: function Render({ form, mode, currentExpectedCashCents }) {
		return (
			<FieldGroup className="gap-5">
				<form.AppField name="amount" validators={{ onBlur: cashMovementFormSchema.shape.amount }}>
					{(field) => (
						<field.MoneyField
							label={mode === "deposit" ? "Importe del depósito" : "Importe del retiro"}
							autoFocus
							placeholder="0.00"
						/>
					)}
				</form.AppField>
				<form.Subscribe selector={(state) => state.values.amount}>
					{(value) => {
						const amount = moneyPreview(value);
						const next =
							amount === null
								? null
								: mode === "deposit"
									? currentExpectedCashCents + amount
									: currentExpectedCashCents - amount;
						const excessive = next !== null && next < 0;
						return (
							<div className="rounded-xl border bg-muted/25 p-4 text-sm">
								<div className="flex justify-between gap-3">
									<span className="text-muted-foreground">Efectivo esperado actual</span>
									<span className="font-medium tabular-nums">
										{formatMoney(currentExpectedCashCents)}
									</span>
								</div>
								<div className="mt-2 flex justify-between gap-3">
									<span className="text-muted-foreground">
										{mode === "deposit" ? "Depósito" : "Retiro"}
									</span>
									<span className="font-medium tabular-nums">
										{amount === null ? "—" : formatMoney(amount)}
									</span>
								</div>
								<div className="mt-3 flex justify-between gap-3 border-t pt-3">
									<span className="font-medium">Nuevo efectivo esperado</span>
									<span className="font-heading text-lg font-semibold tabular-nums">
										{next === null || excessive ? "—" : formatMoney(next)}
									</span>
								</div>
								{excessive && (
									<Alert variant="destructive" className="mt-3">
										<AlertDescription>
											El retiro supera el efectivo esperado disponible.
										</AlertDescription>
									</Alert>
								)}
							</div>
						);
					}}
				</form.Subscribe>
				<form.AppField name="reason" validators={{ onBlur: cashMovementFormSchema.shape.reason }}>
					{(field) => (
						<field.TextField
							label="Motivo"
							description="Quedará registrado en el historial y no podrá editarse."
							maxLength={160}
							placeholder={
								mode === "deposit" ? "Ej. Agregar sencillo" : "Ej. Pago manual a proveedor"
							}
						/>
					)}
				</form.AppField>
			</FieldGroup>
		);
	},
});

export function CashMovementForm({
	mode,
	cashSessionId,
	currentExpectedCashCents,
	onCancel,
	onSuccess,
	unitOfWork,
}: {
	mode: CashMovementFormMode;
	cashSessionId: string;
	currentExpectedCashCents: number;
	onCancel(): void;
	onSuccess(movement: CashMovement): void | Promise<void>;
	unitOfWork?: CashUnitOfWork;
}) {
	const [formError, setFormError] = useState<string | null>(null);
	const form = useAppForm({
		...cashMovementFormOptions,
		onSubmit: async ({ value }) => {
			setFormError(null);
			try {
				const input = cashMovementFormValuesToInput(cashSessionId, value);
				if (mode === "withdrawal" && input.amountCents > currentExpectedCashCents) {
					form.setFieldMeta("amount", (meta) => ({
						...meta,
						isTouched: true,
						errorMap: {
							...meta.errorMap,
							onSubmit: "El retiro supera el efectivo esperado disponible.",
						},
					}));
					return;
				}
				const movement =
					mode === "deposit"
						? await registerCashDeposit(unitOfWork ?? getCashUnitOfWork(), input)
						: await registerCashWithdrawal(unitOfWork ?? getCashUnitOfWork(), input);
				form.reset(value);
				toast.success(mode === "deposit" ? "Depósito registrado" : "Retiro registrado");
				await onSuccess(movement);
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
					<CashMovementFields
						form={form}
						mode={mode}
						currentExpectedCashCents={currentExpectedCashCents}
					/>
					<div className="mt-5">
						<form.FormError message={formError} />
					</div>
				</div>
				<div className="border-t px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:border-0 sm:px-0 sm:pb-0">
					<div className="mb-2 min-h-4">
						<form.DirtyStateIndicator />
					</div>
					<form.Subscribe selector={(state) => state.values.amount}>
						{(amount) => (
							<form.FormActions
								onCancel={onCancel}
								submitLabel={mode === "deposit" ? "Registrar depósito" : "Registrar retiro"}
								submittingLabel="Registrando…"
								submitDisabled={
									mode === "withdrawal" && (moneyPreview(amount) ?? 0) > currentExpectedCashCents
								}
							/>
						)}
					</form.Subscribe>
				</div>
				<form.UnsavedChangesGuard />
			</form.AppForm>
		</form>
	);
}
