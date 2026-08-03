import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Separator } from "@/shared/components/ui/separator";
import { formatMoney } from "@/shared/kernel/money";
import type { SaleResultView } from "../../application";

const METHOD_LABELS: Record<string, string> = {
	cash: "Efectivo",
	yape: "Yape",
	plin: "Plin",
	card: "POS externo",
	bank_transfer: "Transferencia bancaria",
};

interface SaleCompletedResultProps {
	result: SaleResultView;
	onNewSale(): void;
}

export function SaleCompletedResult({ result, onNewSale }: SaleCompletedResultProps) {
	const completedAt = new Intl.DateTimeFormat("es-PE", {
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
	}).format(new Date(result.createdAt));

	return (
		<section className="space-y-4" aria-label="Venta completada" aria-live="polite">
			{/* Header */}
			<div className="text-center space-y-1.5">
				<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600 text-xl">
					✓
				</div>
				<h2 className="text-lg font-semibold">Venta completada</h2>
				<p className="text-sm text-muted-foreground">{completedAt}</p>
				<Badge variant="secondary" className="font-mono">
					{result.formattedSaleNumber}
				</Badge>
			</div>

			<Separator />

			{/* Ítems */}
			<div className="space-y-1">
				<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
					Productos
				</p>
				<ul className="divide-y text-sm">
					{result.items.map((item) => (
						<li key={item.id} className="flex justify-between gap-2 py-1.5">
							<span className="flex-1 truncate">
								{item.productName} <span className="text-muted-foreground">× {item.quantity}</span>
							</span>
							<span className="font-medium tabular-nums">{formatMoney(item.subtotalCents)}</span>
						</li>
					))}
				</ul>
			</div>

			<Separator />

			{/* Pagos */}
			<div className="space-y-1">
				<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
					Pagos
				</p>
				<ul className="divide-y text-sm">
					{result.payments.map((payment) => (
						<li key={payment.id} className="flex justify-between gap-2 py-1.5">
							<span className="text-muted-foreground">
								{METHOD_LABELS[payment.method] ?? payment.method}
								{payment.operationReference && (
									<span className="ml-1 font-mono text-xs">#{payment.operationReference}</span>
								)}
							</span>
							<span className="font-medium tabular-nums">{formatMoney(payment.amountCents)}</span>
						</li>
					))}
				</ul>
			</div>

			{/* Total y vuelto */}
			<div className="rounded-lg bg-muted/40 px-4 py-3 space-y-1.5">
				<div className="flex justify-between text-sm">
					<span className="text-muted-foreground">Total</span>
					<span className="font-semibold tabular-nums">{formatMoney(result.totalCents)}</span>
				</div>
				{result.changeCents > 0 && (
					<div className="flex justify-between text-sm">
						<span className="text-muted-foreground">Vuelto</span>
						<span className="font-semibold tabular-nums text-green-600">
							{formatMoney(result.changeCents)}
						</span>
					</div>
				)}
			</div>

			<Button type="button" className="w-full" onClick={onNewSale}>
				Nueva venta
			</Button>
		</section>
	);
}
