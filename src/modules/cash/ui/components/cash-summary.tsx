import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { formatMoney } from "@/shared/kernel/money";
import type { CashSessionSummary } from "../../domain";

function Metric({
	label,
	value,
	emphasis = false,
}: {
	label: string;
	value: number;
	emphasis?: boolean;
}) {
	return (
		<div
			className={
				emphasis
					? "rounded-xl bg-primary px-4 py-4 text-primary-foreground"
					: "rounded-xl border bg-background/70 px-4 py-3"
			}
		>
			<p
				className={
					emphasis
						? "text-xs font-medium uppercase tracking-[0.14em] opacity-75"
						: "text-xs text-muted-foreground"
				}
			>
				{label}
			</p>
			<p className="mt-1 font-heading text-xl font-semibold tabular-nums">{formatMoney(value)}</p>
		</div>
	);
}

export function CashCurrentSummary({ summary }: { summary: CashSessionSummary }) {
	return (
		<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
			<Metric label="Efectivo esperado" value={summary.expectedCashCents} emphasis />
			<Metric label="Efectivo inicial" value={summary.openingCashCents} />
			<Metric label="Ventas en efectivo" value={summary.paymentTotals.cashCents} />
			<Metric label="Depósitos" value={summary.manualDepositsCents} />
			<Metric label="Retiros" value={summary.manualWithdrawalsCents} />
		</div>
	);
}

export function CashPaymentBreakdown({ summary }: { summary: CashSessionSummary }) {
	const rows = [
		["Yape", summary.paymentTotals.yapeCents],
		["Plin", summary.paymentTotals.plinCents],
		["Tarjeta", summary.paymentTotals.cardCents],
		["Transferencia", summary.paymentTotals.bankTransferCents],
	] as const;
	return (
		<Card size="sm">
			<CardHeader>
				<CardTitle>Pagos digitales</CardTitle>
			</CardHeader>
			<CardContent className="grid grid-cols-2 gap-x-5 gap-y-3">
				{rows.map(([label, amount]) => (
					<div
						key={label}
						className="flex items-center justify-between gap-2 border-b pb-2 text-sm"
					>
						<span className="text-muted-foreground">{label}</span>
						<span className="font-medium tabular-nums">{formatMoney(amount)}</span>
					</div>
				))}
			</CardContent>
		</Card>
	);
}

export function CashClosingBreakdown({ summary }: { summary: CashSessionSummary }) {
	const rows = [
		["Efectivo inicial", summary.openingCashCents],
		["Ventas en efectivo", summary.paymentTotals.cashCents],
		["Depósitos", summary.manualDepositsCents],
		["Retiros", -summary.manualWithdrawalsCents],
	] as const;
	return (
		<div className="rounded-xl border bg-muted/20 p-4">
			{rows.map(([label, amount]) => (
				<div key={label} className="flex items-center justify-between gap-4 py-1.5 text-sm">
					<span className="text-muted-foreground">{label}</span>
					<span className="font-medium tabular-nums">
						{amount < 0 ? `−${formatMoney(Math.abs(amount))}` : formatMoney(Math.abs(amount))}
					</span>
				</div>
			))}
			<div className="mt-2 flex items-center justify-between border-t pt-3">
				<span className="font-medium">Efectivo esperado</span>
				<span className="font-heading text-xl font-semibold tabular-nums">
					{formatMoney(summary.expectedCashCents)}
				</span>
			</div>
		</div>
	);
}
