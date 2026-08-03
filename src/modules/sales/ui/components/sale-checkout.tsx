import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { formatMoney } from "@/shared/kernel/money";
import type { CompletedSaleResult } from "../../application";
import type { SaleDraftTotals } from "../../domain";
import { CheckoutForm } from "../forms/checkout/checkout-form";
import type { checkoutValuesToPaymentIntents } from "../forms/checkout/checkout-form.mappers";

interface SaleCheckoutProps {
	totals: SaleDraftTotals;
	onComplete(result: CompletedSaleResult): void;
	onCancel(): void;
	onSubmit(
		intents: ReturnType<typeof checkoutValuesToPaymentIntents>,
	): Promise<CompletedSaleResult>;
	submitError?: string | null;
}

export function SaleCheckout({
	totals,
	onComplete,
	onCancel,
	onSubmit,
	submitError,
}: SaleCheckoutProps) {
	return (
		<div className="space-y-4">
			<div className="space-y-0.5">
				<h2 className="text-base font-semibold">Cobrar</h2>
				<p className="text-sm text-muted-foreground">
					{totals.lineCount} producto{totals.lineCount !== 1 ? "s" : ""} · {totals.itemCount} unidad
					{totals.itemCount !== 1 ? "es" : ""} ·{" "}
					<span className="font-medium text-foreground">{formatMoney(totals.totalCents)}</span>
				</p>
			</div>

			{submitError && (
				<Alert variant="destructive" role="alert" aria-live="assertive">
					<AlertDescription>{submitError}</AlertDescription>
				</Alert>
			)}

			<CheckoutForm
				totalCents={totals.totalCents}
				onComplete={onComplete}
				onCancel={onCancel}
				onSubmit={onSubmit}
			/>
		</div>
	);
}
