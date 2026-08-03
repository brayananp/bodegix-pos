import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { formatMoney } from "@/shared/kernel/money";
import type { CashMovementSearchResult } from "../../application";
import { formatCashDate } from "../cash-format";

export function CashMovementList({
	result,
}: {
	result: CashMovementSearchResult | null | undefined;
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Movimientos de efectivo</CardTitle>
			</CardHeader>
			<CardContent>
				{!result ? (
					<p className="py-6 text-sm text-muted-foreground">Cargando movimientos…</p>
				) : result.items.length === 0 ? (
					<div className="rounded-xl border border-dashed px-4 py-8 text-center">
						<p className="font-medium">Aún no hay movimientos manuales</p>
						<p className="mt-1 text-sm text-muted-foreground">
							Los depósitos y retiros confirmados aparecerán aquí.
						</p>
					</div>
				) : (
					<ul className="divide-y" aria-label="Movimientos de caja">
						{result.items.map((movement) => (
							<li
								key={movement.id}
								className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
							>
								<div className="min-w-0">
									<div className="flex items-center gap-2">
										<Badge variant={movement.type === "deposit" ? "secondary" : "outline"}>
											{movement.type === "deposit" ? "Depósito" : "Retiro"}
										</Badge>
										<span className="truncate text-sm font-medium">{movement.reason}</span>
									</div>
									<p className="mt-1 text-xs text-muted-foreground">
										{formatCashDate(movement.createdAt)}
									</p>
								</div>
								<span
									className={
										movement.type === "deposit"
											? "font-heading font-semibold tabular-nums text-primary"
											: "font-heading font-semibold tabular-nums text-foreground"
									}
								>
									{movement.type === "deposit" ? "+" : "−"}
									{formatMoney(movement.amountCents)}
								</span>
							</li>
						))}
					</ul>
				)}
			</CardContent>
		</Card>
	);
}
