import { formatMoney } from "@/shared/kernel/money";
import type { SaleDraftTotals } from "../../domain";

interface SaleCartSummaryProps {
	totals: SaleDraftTotals;
}

export function SaleCartSummary({ totals }: SaleCartSummaryProps) {
	return (
		<section aria-label="Resumen del carrito" className="border-t pt-3 space-y-1">
			<div className="flex justify-between text-sm text-muted-foreground">
				<span>
					{totals.lineCount} {totals.lineCount === 1 ? "producto" : "productos"} ·{" "}
					{totals.itemCount} {totals.itemCount === 1 ? "unidad" : "unidades"}
				</span>
			</div>
			<div className="flex justify-between items-baseline">
				<span className="text-sm font-medium">Total</span>
				<span className="text-xl font-bold tabular-nums">{formatMoney(totals.totalCents)}</span>
			</div>
		</section>
	);
}
